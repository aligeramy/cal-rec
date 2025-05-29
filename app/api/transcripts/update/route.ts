import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const { id, transcript, notes, meetingType } = await req.json();

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
      meetingType?: string;
    } = {
      updatedAt: new Date(),
    };

    if (transcript !== undefined) {
      // Sanitize the transcript HTML before saving
      updateData.transcript = sanitizeHtml(transcript, {
        allowedTags: [
          'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'div'
        ],
        allowedAttributes: {
          a: ['href', 'name', 'target', 'rel'],
          span: ['style', 'class'],
          div: ['style', 'class'],
          '*': ['style', 'class']
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedStyles: {
          '*': {
            // Allow some inline styles if needed
            color: [/^.*$/],
            'background-color': [/^.*$/],
            'text-align': [/^.*$/],
            'font-weight': [/^.*$/],
            'font-style': [/^.*$/],
            'text-decoration': [/^.*$/],
            'margin': [/^.*$/],
            'padding': [/^.*$/],
          }
        },
        // Remove any script tags or dangerous content
        disallowedTagsMode: 'discard',
        allowedClasses: {
          '*': ['*'] // Allow all classes for styling
        }
      });
    }

    if (notes !== undefined) {
      // Also sanitize notes if they contain HTML
      updateData.notes = sanitizeHtml(notes, {
        allowedTags: [
          'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'div'
        ],
        allowedAttributes: {
          a: ['href', 'name', 'target', 'rel'],
          span: ['style', 'class'],
          div: ['style', 'class'],
          '*': ['style', 'class']
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedStyles: {
          '*': {
            color: [/^.*$/],
            'background-color': [/^.*$/],
            'text-align': [/^.*$/],
            'font-weight': [/^.*$/],
            'font-style': [/^.*$/],
            'text-decoration': [/^.*$/],
            'margin': [/^.*$/],
            'padding': [/^.*$/],
          }
        },
        disallowedTagsMode: 'discard',
        allowedClasses: {
          '*': ['*']
        }
      });
    }

    if (meetingType !== undefined) {
      updateData.meetingType = meetingType;
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