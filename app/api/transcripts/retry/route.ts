import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cal.com API configuration
const CAL_API_KEY = process.env.CALCOM_API;
const CAL_API_BASE = "https://api.cal.com/v1";

interface CalTranscriptResponse {
  format: string;
  link: string;
}

interface CalTranscriptData {
  metadata: {
    duration: number;
    created: string;
  };
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
          speaker: number;
          punctuated_word: string;
        }>;
        paragraphs: {
          transcript: string;
          paragraphs: Array<{
            sentences: Array<{
              text: string;
              start: number;
              end: number;
            }>;
            speaker: number;
            start: number;
            end: number;
          }>;
        };
      }>;
    }>;
    utterances: Array<{
      start: number;
      end: number;
      confidence: number;
      transcript: string;
      speaker: number;
    }>;
  };
}

async function processCalTranscriptionRetry(transcriptId: string, bookingUid: string) {
  try {
    console.log("🔄 Retrying Cal.com transcription processing", { transcriptId, bookingUid });

    // Get booking details to find the numeric ID
    const bookingsController = new AbortController();
    const bookingsTimeout = setTimeout(() => bookingsController.abort(), 30000);
    
    const bookingsResponse = await fetch(`${CAL_API_BASE}/bookings?apiKey=${CAL_API_KEY}`, {
      signal: bookingsController.signal
    });
    clearTimeout(bookingsTimeout);
    
    if (!bookingsResponse.ok) {
      throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
    }

    const bookingsData = await bookingsResponse.json();
    const booking = bookingsData.bookings?.find((b: { uid: string; id: number }) => b.uid === bookingUid);
    
    if (!booking) {
      throw new Error(`Booking with UID ${bookingUid} not found`);
    }

    const numericBookingId = booking.id;
    console.log("📋 Found numeric booking ID:", numericBookingId);

    // Get recordings for this booking
    const recordingsController = new AbortController();
    const recordingsTimeout = setTimeout(() => recordingsController.abort(), 30000);
    
    const recordingsResponse = await fetch(`${CAL_API_BASE}/bookings/${numericBookingId}/recordings?apiKey=${CAL_API_KEY}`, {
      signal: recordingsController.signal
    });
    clearTimeout(recordingsTimeout);
    
    if (!recordingsResponse.ok) {
      throw new Error(`Failed to fetch recordings: ${recordingsResponse.status}`);
    }

    const recordings = await recordingsResponse.json();
    console.log("🎥 Found recordings:", recordings.length);

    if (!recordings || recordings.length === 0) {
      throw new Error("No recordings found for this booking");
    }

    // Get the most recent recording
    const recording = recordings[0];
    const recordingId = recording.id;
    
    console.log("🎬 Processing recording:", recordingId);

    // Check if recording is finished
    if (recording.status !== "finished") {
      throw new Error(`Recording not ready yet. Status: ${recording.status}`);
    }

    // Get transcripts for this recording with extended timeout for longer videos
    const transcriptsController = new AbortController();
    const transcriptsTimeout = setTimeout(() => transcriptsController.abort(), 60000);
    
    const transcriptsResponse = await fetch(`${CAL_API_BASE}/bookings/${numericBookingId}/transcripts/${recordingId}?apiKey=${CAL_API_KEY}`, {
      signal: transcriptsController.signal
    });
    clearTimeout(transcriptsTimeout);
    
    if (!transcriptsResponse.ok) {
      throw new Error(`Failed to fetch transcripts: ${transcriptsResponse.status}`);
    }

    const transcripts: CalTranscriptResponse[] = await transcriptsResponse.json();
    console.log("📝 Found transcript formats:", transcripts.map(t => t.format));

    // Find JSON and TXT transcripts
    const jsonTranscript = transcripts.find(t => t.format === 'json');
    const txtTranscript = transcripts.find(t => t.format === 'txt');

    if (!jsonTranscript && !txtTranscript) {
      throw new Error("No JSON or TXT transcript found");
    }

    let transcriptText = '';
    let transcriptJson = null;

    // Download and process JSON transcript if available
    if (jsonTranscript) {
      console.log("📥 Downloading JSON transcript...");
      const jsonController = new AbortController();
      const jsonTimeout = setTimeout(() => jsonController.abort(), 120000);
      
      const jsonResponse = await fetch(jsonTranscript.link, {
        signal: jsonController.signal
      });
      clearTimeout(jsonTimeout);
      
      if (jsonResponse.ok) {
        const jsonData: CalTranscriptData = await jsonResponse.json();
        transcriptJson = {
          words: jsonData.results.channels[0]?.alternatives[0]?.words || [],
          utterances: jsonData.results.utterances || [],
          metadata: jsonData.metadata
        };
        transcriptText = jsonData.results.channels[0]?.alternatives[0]?.transcript || '';
        console.log("✅ JSON transcript processed", {
          wordsCount: transcriptJson.words.length,
          utterancesCount: transcriptJson.utterances.length,
          textLength: transcriptText.length
        });
      }
    }

    // Download TXT transcript if JSON failed or as fallback
    if (!transcriptText && txtTranscript) {
      console.log("📥 Downloading TXT transcript...");
      const txtController = new AbortController();
      const txtTimeout = setTimeout(() => txtController.abort(), 120000);
      
      const txtResponse = await fetch(txtTranscript.link, {
        signal: txtController.signal
      });
      clearTimeout(txtTimeout);
      
      if (txtResponse.ok) {
        transcriptText = await txtResponse.text();
        console.log("✅ TXT transcript processed", { textLength: transcriptText.length });
      }
    }

    // Update the transcript record
    const hasContent = transcriptText.trim().length > 0;
    
    await prisma.meetingTranscript.update({
      where: { id: transcriptId },
      data: {
        transcript: transcriptText,
        transcriptJson: transcriptJson ? JSON.stringify(transcriptJson) : undefined,
        status: hasContent ? 'completed' : 'failed',
        updatedAt: new Date(),
      },
    });

    console.log("✅ Transcript retry processing completed", {
      transcriptId,
      status: hasContent ? 'completed' : 'failed',
      textLength: transcriptText.length,
      hasJson: !!transcriptJson
    });

    return { success: true, status: hasContent ? 'completed' : 'failed' };

  } catch (error: unknown) {
    console.error("❌ Cal.com transcription retry failed:", error);
    
    // Update transcript status to failed
    try {
      await prisma.meetingTranscript.update({
        where: { id: transcriptId },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error("❌ Failed to update transcript status:", updateError);
    }
    
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const { transcriptId } = await req.json();

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
        { status: 400 }
      );
    }

    // Get the transcript from database
    const transcript = await prisma.meetingTranscript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    if (!transcript.bookingUid) {
      return NextResponse.json(
        { error: 'No booking UID found for this transcript' },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.meetingTranscript.update({
      where: { id: transcriptId },
      data: { 
        status: 'processing',
        updatedAt: new Date()
      }
    });

    console.log('🔄 Starting transcript retry for:', transcriptId);

    // Process the transcription with retry logic
    const result = await processCalTranscriptionRetry(transcriptId, transcript.bookingUid);

    return NextResponse.json({
      success: true,
      message: 'Transcript retry completed',
      status: result.status
    });

  } catch (error) {
    console.error('❌ Error retrying transcript:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retry transcript processing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 