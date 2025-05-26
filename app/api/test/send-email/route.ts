import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcriptId, recipientEmail, recipientName } = body;

    if (!transcriptId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing transcriptId or recipientEmail' },
        { status: 400 }
      );
    }

    // Call the actual send-email API
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/transcripts/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any auth headers if needed
        ...(req.headers.get('authorization') && {
          'authorization': req.headers.get('authorization')!
        })
      },
      body: JSON.stringify({
        transcriptId,
        recipient: {
          email: recipientEmail,
          name: recipientName || recipientEmail.split('@')[0]
        },
        subject: `Test Meeting Transcript`,
        includeNotes: true,
        includeTranscript: true,
        sendAsPDF: true
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: result
    });

  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 