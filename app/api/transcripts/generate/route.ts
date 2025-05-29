import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateConversation } from '@/lib/ai-conversation-generator';
import { getTemplateById } from '@/lib/conversation-templates';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const { templateId, customTemplate, clientName, clientEmail, hostName, hostEmail, title } = await req.json();

    // Validate required fields
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    if (!clientName) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    // Get the template or create custom template
    let template;
    if (templateId === 'custom') {
      if (!customTemplate?.trim()) {
        return NextResponse.json(
          { error: 'Custom template prompt is required' },
          { status: 400 }
        );
      }
      
      // Create a custom template object
      template = {
        id: 'custom',
        name: 'Custom Template',
        description: 'User-defined custom conversation',
        prompt: customTemplate.trim(),
        duration: 15 // Default duration for custom templates
      };
    } else {
      template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
    }

    console.log('🚀 Starting AI conversation generation:', {
      templateId,
      templateName: template.name,
      clientName,
      clientEmail: clientEmail || 'No email provided',
      hostName: hostName || 'Host'
    });

    // Generate the conversation using AI
    const generatedConversation = await generateConversation(
      template,
      clientName,
      hostName || 'Host'
    );

    // Create a unique booking UID for the generated conversation
    const bookingUid = Math.floor(100000000 + Math.random() * 900000000).toString();

    // Save to database
    const transcript = await prisma.meetingTranscript.create({
      data: {
        bookingUid,
        title: title || `${template.name}`,
        startTime: new Date(),
        endTime: new Date(Date.now() + generatedConversation.duration * 60 * 1000),
        transcript: generatedConversation.transcript,
        transcriptJson: generatedConversation.transcriptJson,
        status: 'completed',
        clientName,
        clientEmail: clientEmail || null,
        hostName: hostName || 'Host',
        hostEmail: hostEmail || session.user?.email || null,
        duration: generatedConversation.duration,
        meetingType: `${template.name}`,
        location: 'Generated Conversation',
        notes: `This conversation was generated using AI based on the "${template.name}" template.`,
        recordingUrl: null,
      },
    });

    console.log('✅ AI conversation saved to database:', {
      id: transcript.id,
      clientName: transcript.clientName,
      clientEmail: transcript.clientEmail,
      hostName: transcript.hostName,
      duration: generatedConversation.duration,
      utterances: generatedConversation.transcriptJson.utterances?.length || 0,
      words: generatedConversation.transcriptJson.words?.length || 0
    });

    return NextResponse.json({
      success: true,
      message: 'AI conversation generated successfully',
      data: {
        id: transcript.id,
        title: transcript.title,
        clientName: transcript.clientName,
        clientEmail: transcript.clientEmail,
        duration: generatedConversation.duration,
        utterances: generatedConversation.transcriptJson.utterances?.length || 0,
        words: generatedConversation.transcriptJson.words?.length || 0
      },
    });

  } catch (error) {
    console.error('❌ Error generating AI conversation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 