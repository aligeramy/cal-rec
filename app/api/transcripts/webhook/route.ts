import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    console.log('🔔 Transcription webhook received from VPS');
    
    // Parse request body
    const { bookingUid, transcription, jobId, status, error } = await req.json();
    
    console.log('📊 Webhook payload:', { bookingUid, jobId, status, hasTranscription: !!transcription });

    // Validate required fields
    if (!bookingUid) {
      console.error('❌ Missing bookingUid in webhook payload');
      return NextResponse.json(
        { error: 'bookingUid is required' },
        { status: 400 }
      );
    }

    // Find the transcript by booking UID
    const existingTranscript = await prisma.meetingTranscript.findUnique({
      where: { bookingUid },
    });

    if (!existingTranscript) {
      console.error('❌ Transcript not found for booking:', bookingUid);
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    console.log('🔍 Found transcript:', existingTranscript.id);

    // Prepare update data based on status
    const updateData: {
      updatedAt: Date;
      status: string;
      transcript?: string;
      transcriptJson?: string;
      notes?: string;
    } = {
      updatedAt: new Date(),
      status: status === 'completed' ? 'completed' : 'failed',
    };

    if (status === 'completed' && transcription) {
      // Handle both successful and empty transcriptions
      const transcriptText = transcription.text || transcription || '';
      const hasContent = transcriptText.trim().length > 0;
      
      updateData.transcript = transcriptText;
      updateData.status = hasContent ? 'completed' : 'failed';
      
      // Store full transcription JSON in transcriptJson field (properly serialized)
      if (typeof transcription === 'object') {
        updateData.transcriptJson = JSON.stringify(transcription);
      }
      
      // Add metadata as notes if available
      const metadata = [];
      if (transcription.duration) metadata.push(`Duration: ${transcription.duration}s`);
      if (transcription.language) metadata.push(`Language: ${transcription.language}`);
      if (transcription.segments?.length) metadata.push(`Segments: ${transcription.segments.length}`);
      if (transcription.words?.length) metadata.push(`Words: ${transcription.words.length}`);
      
      if (!hasContent) {
        metadata.push('No speech detected');
        updateData.notes = metadata.join(' | ') + ' | Audio may be silent or too short';
      } else {
        updateData.notes = metadata.join(' | ');
      }
      
      console.log(hasContent ? '✅ Processing successful transcription' : '⚠️ Processing empty transcription', {
        textLength: transcriptText.length,
        segmentsCount: transcription.segments?.length || 0,
        wordsCount: transcription.words?.length || 0,
        hasContent
      });
    } else {
      // Failed transcription
      updateData.status = 'failed';
      updateData.notes = error || 'Transcription failed';
      console.log('❌ Processing failed transcription:', error);
    }

    // Update the transcript in the database
    const updatedTranscript = await prisma.meetingTranscript.update({
      where: { id: existingTranscript.id },
      data: updateData,
    });

    console.log('✅ Transcript updated successfully:', updatedTranscript.id);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Transcript updated successfully',
      transcriptId: updatedTranscript.id,
      status: updateData.status
    });

  } catch (error) {
    console.error('❌ Error processing transcription webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process transcription webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 