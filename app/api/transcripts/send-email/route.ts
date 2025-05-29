import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { formatDate } from '@/lib/utils'
import { MeetingTranscript } from '@/lib/types'
import { generateTranscriptPDF } from '@/lib/pdf-generator'

// Initialize Resend email client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email domain configuration
const EMAIL_DOMAIN = 'mail.softx.ca'

export async function POST(req: Request) {
  try {
    // Check for required environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Email service configuration error' },
        { status: 500 }
      )
    }

    // Verify authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the request body
    const body = await req.json()
    const { 
      transcriptId, 
      recipient, 
      subject, 
      includeNotes = true, 
      includeTranscript = true,
      sendAsPDF = true
    } = body

    // Validate the required fields
    if (!transcriptId || !recipient?.email) {
      return NextResponse.json(
        { error: 'Missing required fields: transcriptId and recipient email' },
        { status: 400 }
      )
    }

    // Fetch the transcript from the database
    const transcript = await prisma.meetingTranscript.findUnique({
      where: { id: transcriptId }
    }) as MeetingTranscript;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      )
    }

    // Check if transcript is completed
    if (transcript.status !== 'completed' && !transcript.transcript) {
      return NextResponse.json(
        { error: 'Transcript is not yet completed and cannot be sent' },
        { status: 400 }
      )
    }

    // Prepare email content and attachments
    let emailHtml: string;
    const attachments: Array<{
      filename: string;
      content: Buffer;
      type: string;
      disposition: string;
    }> = [];

    if (sendAsPDF) {
      try {
        // Generate PDF attachment
        const pdfBuffer = await generateTranscriptPDF(transcript, {
          includeNotes,
          includeTranscript,
          includeChatView: true,
          includeMetadata: true,
          recipientName: recipient.name || recipient.email.split('@')[0],
          recipientType: recipient.email === transcript.clientEmail ? 'client' : 'admin'
        });

        // Create a simpler email HTML for PDF attachment
        emailHtml = generateEmailHtmlForPDF({
          transcript,
          recipientName: recipient.name || recipient.email.split('@')[0],
        });

        // Add PDF attachment
        attachments.push({
          filename: `transcript-${transcript.bookingUid}-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          type: 'application/pdf',
          disposition: 'attachment'
        });
      } catch (pdfError) {
        console.warn('PDF generation failed, falling back to HTML email:', pdfError);
        
        // Fallback to HTML email if PDF generation fails
        emailHtml = generateEmailHtml({
          transcript,
          recipientName: recipient.name || recipient.email.split('@')[0],
          includeNotes,
          includeTranscript
        });
        
        // Add a note about PDF generation failure
        emailHtml = emailHtml.replace(
          '<p>Dear',
          '<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-bottom: 20px; border-radius: 4px;"><strong>Note:</strong> PDF generation is temporarily unavailable. Please find the transcript content below.</div><p>Dear'
        );
      }
    } else {
      // Generate full HTML email content
      emailHtml = generateEmailHtml({
        transcript,
        recipientName: recipient.name || recipient.email.split('@')[0],
        includeNotes,
        includeTranscript
      });
    }

    // Send the email
    const { data, error } = await resend.emails.send({
      from: `TranscriptAI <no-reply@${EMAIL_DOMAIN}>`,
      to: [recipient.email],
      subject: subject || `Meeting Transcript: ${transcript.title || 'Untitled Meeting'}`,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (error) {
      console.error('Error sending email via Resend:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send email';
      if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = `Email service error: ${error.message}`;
        } else if ('name' in error && typeof error.name === 'string') {
          errorMessage = `Email service error: ${error.name}`;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage, details: error },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: data?.id
    })
  } catch (error) {
    console.error('Error in transcript email API:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to generate simple email HTML for PDF attachment
function generateEmailHtmlForPDF({ 
  transcript, 
  recipientName 
}: {
  transcript: MeetingTranscript
  recipientName: string
}) {
  const startTime = transcript.startTime ? formatDate(transcript.startTime) : 'N/A'
  const hostName = transcript.hostName || 'The Host'
  const meetingTitle = transcript.title || 'Untitled Meeting'
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Meeting Transcript</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 10px;
          }
          .metadata {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #666;
            text-align: center;
            border-top: 1px solid #eaeaea;
            padding-top: 20px;
          }
          .attachment-notice {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #1a56db;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${meetingTitle}</div>
          <div class="metadata">
            <p>Meeting Date: ${startTime}</p>
            <p>Duration: ${transcript.duration ? `${transcript.duration} minutes` : 'N/A'}</p>
            ${transcript.clientName ? `<p>Client: ${transcript.clientName}</p>` : ''}
            ${transcript.hostName ? `<p>Host: ${transcript.hostName}</p>` : ''}
          </div>
        </div>
        
        <p>Dear ${recipientName},</p>
        
        <p>Please find attached the complete transcript for your meeting with ${hostName} on ${startTime}.</p>
        
        <div class="attachment-notice">
          <strong>📎 Attachment:</strong> The full meeting transcript and notes are included as a PDF attachment to this email.
        </div>
        
        <p>The PDF contains:</p>
        <ul>
          <li>Complete meeting information and metadata</li>
          <li>Full transcript of the conversation</li>
          ${transcript.notes ? '<li>Meeting notes and summary</li>' : ''}
        </ul>
        
        <p>Thank you for using our transcription service.</p>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} TranscriptAI. All rights reserved.</p>
        </div>
      </body>
    </html>
  `
}

// Helper function to generate email HTML content
function generateEmailHtml({ 
  transcript, 
  recipientName, 
  includeNotes, 
  includeTranscript 
}: {
  transcript: MeetingTranscript
  recipientName: string
  includeNotes: boolean
  includeTranscript: boolean
}) {
  const startTime = transcript.startTime ? formatDate(transcript.startTime) : 'N/A'
  const hostName = transcript.hostName || 'The Host'
  const meetingTitle = transcript.title || 'Untitled Meeting'
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Meeting Transcript</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 10px;
          }
          .metadata {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 5px;
          }
          .notes, .transcript {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #666;
            text-align: center;
            border-top: 1px solid #eaeaea;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${meetingTitle}</div>
          <div class="metadata">
            <p>Meeting Date: ${startTime}</p>
            <p>Duration: ${transcript.duration ? `${transcript.duration} minutes` : 'N/A'}</p>
            ${transcript.clientName ? `<p>Client: ${transcript.clientName}</p>` : ''}
            ${transcript.hostName ? `<p>Host: ${transcript.hostName}</p>` : ''}
          </div>
        </div>
        
        <p>Dear ${recipientName},</p>
        
        <p>Please find below the transcript for your meeting with ${hostName} on ${startTime}.</p>
        
        ${includeNotes && transcript.notes ? `
        <div class="section">
          <div class="section-title">Meeting Notes</div>
          <div class="notes">${transcript.notes}</div>
        </div>
        ` : ''}
        
        ${includeTranscript && transcript.transcript ? `
        <div class="section">
          <div class="section-title">Transcript</div>
          <div class="transcript">${transcript.transcript}</div>
        </div>
        ` : ''}
        
        <p>Thank you for using our transcription service.</p>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} TranscriptAI. All rights reserved.</p>
        </div>
      </body>
    </html>
  `
} 