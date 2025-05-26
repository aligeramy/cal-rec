import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { formatDate } from '@/lib/utils'
import { MeetingTranscript } from '@/lib/types'

// Initialize Resend email client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email domain configuration
const EMAIL_DOMAIN = 'mail.softx.ca'

export async function POST(req: Request) {
  try {
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
      includeTranscript = true 
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

    // Generate email HTML content
    const emailHtml = generateEmailHtml({
      transcript,
      recipientName: recipient.name || recipient.email.split('@')[0],
      includeNotes,
      includeTranscript
    })

    // Send the email
    const { data, error } = await resend.emails.send({
      from: `TranscriptAI <no-reply@${EMAIL_DOMAIN}>`,
      to: [recipient.email],
      subject: subject || `Meeting Transcript: ${transcript.title || 'Untitled Meeting'}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending email via Resend:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
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
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
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