import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const { id, transcript, notes } = await req.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
        { status: 400 }
      );
    }

    // Check if transcript exists
    const existingTranscript = await prisma.meetingTranscript.findUnique({
      where: { id },
    });

    if (!existingTranscript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Update fields that were provided
    const updateData: {
      updatedAt: Date;
      transcript?: string;
      notes?: string;
    } = {
      updatedAt: new Date(),
    };

    if (transcript !== undefined) {
      updateData.transcript = transcript;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update the transcript in the database
    const updatedTranscript = await prisma.meetingTranscript.update({
      where: { id },
      data: updateData,
    });

    // Return the updated transcript
    return NextResponse.json({
      success: true,
      message: 'Transcript updated successfully',
      data: updatedTranscript,
    });
  } catch (error) {
    console.error('Error updating transcript:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update transcript',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 