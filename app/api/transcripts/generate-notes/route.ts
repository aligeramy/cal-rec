import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    if (!transcript.transcript || transcript.transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'No transcript content available to generate notes from' },
        { status: 400 }
      );
    }

    console.log('📝 Generating notes for transcript:', transcriptId);

    // Generate notes using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional meeting notes assistant. Generate comprehensive, well-structured meeting notes based on the provided transcript. 

Your notes should include:
- Meeting summary (2-3 sentences)
- Key discussion points
- Action items (if any)
- Decisions made (if any)
- Important topics covered
- Next steps (if mentioned)

Format the notes in a clean, professional manner using markdown formatting. Be concise but thorough.`
        },
        {
          role: "user",
          content: `Please generate professional meeting notes for the following transcript:

Title: ${transcript.title || 'Meeting'}
Participants: ${transcript.clientName || 'Client'} and ${transcript.hostName || 'Host'}
Duration: ${transcript.duration ? `${transcript.duration} minutes` : 'Unknown'}

Transcript:
${transcript.transcript}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const generatedNotes = completion.choices[0]?.message?.content;

    if (!generatedNotes) {
      throw new Error('Failed to generate notes');
    }

    console.log('✅ Notes generated successfully');

    return NextResponse.json({
      success: true,
      notes: generatedNotes,
    });

  } catch (error) {
    console.error('❌ Error generating notes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 