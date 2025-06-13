import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTranscriptPDF } from '@/lib/pdf-generator';
import { MeetingTranscript } from '@/lib/types';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Get the transcript from database
    const transcript = await prisma.meetingTranscript.findUnique({
      where: { id },
    }) as MeetingTranscript | null;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    console.log('📄 Generating comprehensive PDF for transcript:', id);

    // Generate PDF with both conversation overview and full transcript
    const pdfBuffer = await generateTranscriptPDF(transcript, {
      includeNotes: true,
      includeTranscript: true,
      includeMetadata: true,
    });

    console.log('✅ PDF generated successfully');

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="transcript-${transcript.title || 'untitled'}-${id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 