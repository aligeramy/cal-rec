import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

// Simple health check endpoint
export async function GET() {
  console.log("⚡ Webhook health check requested");
  const webhookSecret = process.env.CAL_WEBHOOK_SECRET ? "configured" : "missing";
  
  return NextResponse.json({
    status: "healthy",
    webhook_secret: webhookSecret,
    message: "Cal.com webhook endpoint is working. POST to this endpoint with proper Cal.com signature to process webhooks."
  });
}

// Move processCalTranscription here
async function processCalTranscription(transcriptId: string, bookingUid: string) {
  try {
    console.log("🔄 Starting Cal.com transcription processing", { transcriptId, bookingUid });

    // Wait a bit for the recording to be fully processed by Cal.com
    console.log("⏳ Waiting 30 seconds for Cal.com to process the recording...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get booking details to find the numeric ID
    const bookingsResponse = await fetch(`${CAL_API_BASE}/bookings?apiKey=${CAL_API_KEY}`);
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
    const recordingsResponse = await fetch(`${CAL_API_BASE}/bookings/${numericBookingId}/recordings?apiKey=${CAL_API_KEY}`);
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

    // Get transcripts for this recording with retry logic
    let transcripts: CalTranscriptResponse[] = [];
    let transcriptAttempts = 0;
    const maxTranscriptAttempts = 3;
    
    while (transcriptAttempts < maxTranscriptAttempts) {
      transcriptAttempts++;
      console.log(`📝 Attempting to fetch transcripts (attempt ${transcriptAttempts}/${maxTranscriptAttempts})...`);
      
      const transcriptsResponse = await fetch(`${CAL_API_BASE}/bookings/${numericBookingId}/transcripts/${recordingId}?apiKey=${CAL_API_KEY}`);
      
      if (transcriptsResponse.ok) {
        transcripts = await transcriptsResponse.json();
        console.log("📝 Found transcript formats:", transcripts.map(t => t.format));
        break;
      } else if (transcriptsResponse.status === 404 && transcriptAttempts < maxTranscriptAttempts) {
        console.log(`⏳ Transcripts not ready yet, waiting 30 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      } else {
        throw new Error(`Failed to fetch transcripts: ${transcriptsResponse.status}`);
      }
    }
    
    if (transcripts.length === 0) {
      throw new Error("No transcripts found after all retry attempts");
    }

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
      const jsonResponse = await fetch(jsonTranscript.link);
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
      const txtResponse = await fetch(txtTranscript.link);
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

    console.log("✅ Transcript processing completed", {
      transcriptId,
      status: hasContent ? 'completed' : 'failed',
      textLength: transcriptText.length,
      hasJson: !!transcriptJson
    });

  } catch (error: unknown) {
    console.error("❌ Cal.com transcription processing failed:", error);
    
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
  }
}

export async function POST(req: Request) {
  console.log("🔔 Cal.com webhook received");
  
  try {
    // Get the signature from the header
    const signature = req.headers.get("x-cal-signature-256");
    console.log("🔐 Signature:", signature);
    
    // Debug: Log all headers to see what Cal.com is sending
    console.log("📋 All headers:", Object.fromEntries([...req.headers.entries()]));
    
    if (!signature || !process.env.CAL_WEBHOOK_SECRET) {
      console.error("❌ Missing signature or webhook secret");
      console.log("Headers received:", Object.fromEntries([...req.headers.entries()]));
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 401 }
      );
    }

    // Get the raw body for verification
    const rawBody = await req.text();
    console.log("📦 Raw webhook payload:", rawBody.substring(0, 200) + "...");
    
    const data = JSON.parse(rawBody);
    console.log("📊 Event type:", data.triggerEvent);
    
    // Generate HMAC directly like the working code
    const hmac = crypto.createHmac("sha256", process.env.CAL_WEBHOOK_SECRET);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest("hex");
    
    console.log("🔐 Calculated signature:", calculatedSignature);
    console.log("🔐 Received signature:", signature);
    
    // Compare signatures
    if (calculatedSignature !== signature) {
      console.error("❌ Signature mismatch");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log("✅ Signature verified successfully");

    // Process the webhook based on the type
    const { triggerEvent, payload: eventPayload } = data;
    console.log("📊 Event type:", triggerEvent);
    console.log("📦 Event payload:", eventPayload);

    if (triggerEvent === "BOOKING_CREATED") {
      console.log("🆕 New booking created, saving to database");
      
      // Extract fields matching your previous working code
      const { uid, title, startTime, endTime, organizer, location, metadata, conferenceData } = eventPayload;
      console.log("📝 New booking details:", { uid, title, startTime, endTime });
      
      // Extract meeting link - could be Google Meet, Zoom, etc.
      let meetingLink = null;
      
      // Check for conference data (Google Meet, Zoom, etc.)
      if (conferenceData?.entryPoints?.length > 0) {
        // Find video entry point
        const videoEntry = conferenceData.entryPoints.find((ep: { entryPointType: string, uri: string }) => ep.entryPointType === 'video');
        if (videoEntry) {
          meetingLink = videoEntry.uri;
          console.log('🔗 Found meeting link from conferenceData:', meetingLink);
        }
      }
      
      // If no conferenceData, check location for meeting URLs
      if (!meetingLink && location) {
        // Check if location is a URL
        if (location.startsWith('http') || location.includes('meet.google.com') || location.includes('zoom.us')) {
          meetingLink = location;
          console.log('🔗 Found meeting link from location:', meetingLink);
        }
      }
      
      // If still no link, check metadata for custom fields
      if (!meetingLink && metadata?.videoCallUrl) {
        meetingLink = metadata.videoCallUrl;
        console.log('🔗 Found meeting link from metadata:', meetingLink);
      }
      
      // Extract client/attendee info
    const attendees = eventPayload?.attendees || [];
      const clientAttendee = attendees.find((a: { email: string }) => a.email !== organizer.email) || {};
    
    const clientName = clientAttendee.name;
    const clientEmail = clientAttendee.email;
    const hostName = organizer.name;
    const hostEmail = organizer.email;
    const notes = eventPayload?.description;
    const meetingType = eventPayload?.eventType?.title;
    
    // Calculate duration in minutes if both start and end times are available
    let duration = null;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

      // Create booking record in database - use meeting transcript table
    const transcript = await prisma.meetingTranscript.upsert({
        where: { bookingUid: uid },
      update: { 
        title,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
          status: "pending",
        clientName,
        clientEmail,
        hostName,
        hostEmail,
        duration,
        meetingType,
          location: meetingLink || location, // Use meeting link if available
          notes
      },
      create: {
          bookingUid: uid,
        title,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
          status: "pending",
        clientName,
        clientEmail,
        hostName,
        hostEmail,
        duration,
        meetingType,
          location: meetingLink || location, // Use meeting link if available
          notes
        }
      });

      console.log("✅ Successfully saved booking to database:", transcript.id);
      return NextResponse.json(
        { message: "Booking created successfully", id: transcript.id },
        { status: 200 }
      );
    } 
    else if (triggerEvent === "BOOKING_CANCELLED") {
      // Meeting was cancelled
      const { uid } = eventPayload;
      console.log("❌ Booking cancelled:", uid);
      
      // Find the meeting transcript
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { bookingUid: uid },
      });
      
      if (transcript) {
        console.log("🔍 Found transcript to cancel:", transcript.id);
        // Update status to cancelled
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { status: "cancelled" }
        });
        console.log("✅ Transcript marked as cancelled");
      } else {
        console.log("❓ No transcript found for cancellation");
      }
      
      return NextResponse.json({ 
        message: "Booking cancellation processed",
        success: true 
      });
    }
    else if (triggerEvent === "MEETING_ENDED") {
      // Meeting has ended
      const { uid } = eventPayload;
      console.log("🏁 Meeting ended:", uid);
      
      // Find the transcript
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { bookingUid: uid },
      });
      
      if (transcript) {
        console.log("🔍 Found transcript to update end time:", transcript.id);
        // Update the transcript end time
        const updated = await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { 
            endTime: new Date(),
            status: transcript.status === "pending" ? "completed" : transcript.status
      }
    });
        console.log("✅ Transcript updated:", updated.id);
      } else {
        console.log("❓ No transcript found to update end time");
      }
      
      return NextResponse.json({ 
        message: "Meeting end processed",
        success: true 
      });
    }
    // Check if this is a RECORDING_READY event
    else if (triggerEvent === "RECORDING_READY") {
      console.log("🎥 Recording ready, processing with Cal.com transcription service");
      
      const { uid, downloadLink } = eventPayload;

      if (!uid || !downloadLink) {
        console.error("❌ Missing required fields in webhook payload", { uid, downloadLink });
        return NextResponse.json(
          { error: "Missing required fields in webhook payload" },
          { status: 400 }
        );
      }

      console.log("🔗 Cal.com provided download link:", downloadLink);
      console.log("🔍 Cal.com notified us that a recording is ready for booking:", uid);

      // Update meeting transcript record with recording status
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { bookingUid: uid },
      });

      if (!transcript) {
        console.error("❌ No transcript found for recording:", uid);
        return NextResponse.json(
          { error: "No transcript found for this recording" },
          { status: 404 }
        );
      }

      // Set status to processing while we fetch the transcription
      await prisma.meetingTranscript.update({
        where: { id: transcript.id },
        data: { 
          status: "processing",
          recordingUrl: downloadLink
        }
      });

      console.log("✅ Updated database record status to processing:", transcript.id);

      // Start processing Cal.com transcription asynchronously
      processCalTranscription(transcript.id, uid).catch((error: unknown) => {
        console.error("❌ Async Cal.com transcription processing failed:", error);
      });

      return NextResponse.json({
        message: "Recording processing started with Cal.com transcription service", 
        id: transcript.id
      });
    }

    // Check if this is a RECORDING_TRANSCRIPTION_GENERATED event
    else if (triggerEvent === "RECORDING_TRANSCRIPTION_GENERATED") {
      console.log("📝 Cal.com generated transcription, processing immediately");
      
      const { uid } = eventPayload;
      console.log("🔍 Processing transcription for booking:", uid);

      if (!uid) {
        console.error("❌ Missing booking UID in transcription event");
        return NextResponse.json(
          { error: "Missing booking UID" },
          { status: 400 }
        );
      }

      // Find the transcript record
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { bookingUid: uid },
      });

      if (!transcript) {
        console.error("❌ No transcript found for transcription event:", uid);
        return NextResponse.json(
          { error: "No transcript found for this booking" },
          { status: 404 }
        );
      }

      // Update status to processing
      await prisma.meetingTranscript.update({
        where: { id: transcript.id },
        data: { status: "processing" }
      });

      // Process transcription immediately (no delay since Cal.com says it's ready)
      processCalTranscriptionNoDelay(transcript.id, uid).catch((error: unknown) => {
        console.error("❌ Immediate transcription processing failed:", error);
      });

      return NextResponse.json({
        message: "Transcription processing started immediately",
        success: true
      });
    }

    console.log("ℹ️ Received unhandled event type:", triggerEvent);
    return NextResponse.json({
      message: `Processed ${triggerEvent} event`,
      success: true
    });
  } catch (error) {
    console.error("❌ Error processing Cal.com webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Process transcription without delay for RECORDING_TRANSCRIPTION_GENERATED events
async function processCalTranscriptionNoDelay(transcriptId: string, bookingUid: string) {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      console.log("🔄 Starting immediate Cal.com transcription processing", { transcriptId, bookingUid, attempt: retryCount + 1 });

      // No delay - Cal.com already told us transcription is ready
    
    // Get booking details to find the numeric ID
    const bookingsResponse = await fetch(`${CAL_API_BASE}/bookings?apiKey=${CAL_API_KEY}`);
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
    const recordingsResponse = await fetch(`${CAL_API_BASE}/bookings/${numericBookingId}/recordings?apiKey=${CAL_API_KEY}`);
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

    // Get transcripts for this recording (should be ready since Cal.com sent the event)
    const transcriptsResponse = await fetch(`${CAL_API_BASE}/bookings/${numericBookingId}/transcripts/${recordingId}?apiKey=${CAL_API_KEY}`);
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
      const jsonResponse = await fetch(jsonTranscript.link);
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
      const txtResponse = await fetch(txtTranscript.link);
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

    console.log("✅ Immediate transcript processing completed", {
      transcriptId,
      status: hasContent ? 'completed' : 'failed',
      textLength: transcriptText.length,
      hasJson: !!transcriptJson
    });

    return;
  } catch (error: unknown) {
    console.error("❌ Immediate Cal.com transcription processing failed:", error);
    
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
    
    retryCount++;
    if (retryCount < maxRetries) {
      console.log(`⏳ Retrying in 30 seconds... (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}
} 