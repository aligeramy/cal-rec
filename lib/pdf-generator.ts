import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import { MeetingTranscript } from '@/lib/types';
import { formatDate } from '@/lib/utils';

// Parse transcript JSON for speaker view
interface SpeakerUtterance {
  id: number;
  speaker: string;
  speakerId: number;
  text: string;
  start: number;
  end: number;
}

function parseTranscriptForSpeakers(transcript: MeetingTranscript): SpeakerUtterance[] {
  try {
    if (!transcript.transcriptJson) {
      return [];
    }
    
    const transcriptData = typeof transcript.transcriptJson === 'string' 
      ? JSON.parse(transcript.transcriptJson) 
      : transcript.transcriptJson;

    const clientName = transcript.clientName || 'Client';
    const hostName = transcript.hostName || 'Host';

    if (transcriptData?.utterances && Array.isArray(transcriptData.utterances)) {
      return transcriptData.utterances.map((utterance: { speaker: number; text?: string; transcript?: string; start?: number; end?: number }, index: number) => ({
        id: index,
        speaker: utterance.speaker === 0 ? clientName : hostName,
        speakerId: utterance.speaker,
        text: utterance.text || utterance.transcript || '',
        start: utterance.start || 0,
        end: utterance.end || 0
      }));
    }

    return [];
  } catch (error) {
    console.error('Error parsing transcript JSON for PDF:', error);
    return [];
  }
}

// Simple markdown to HTML converter for PDF generation
function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/<\/li>\s*<li>/g, '</li><li>');
  
  // Wrap in paragraphs if not already wrapped
  if (!html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>') && !html.includes('<ul>')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
}

// Template 1: Speaker View + Full Transcript in Meeting Info
function generateTemplate1(transcript: MeetingTranscript): { conversationContent: string; includeFullTranscript: boolean; includeFullInMeetingInfo: boolean } {
  const speakerUtterances = parseTranscriptForSpeakers(transcript);
  
  if (speakerUtterances.length === 0) {
    return {
      conversationContent: '<div class="transcript-content">No speaker data available.</div>',
      includeFullTranscript: false,
      includeFullInMeetingInfo: false
    };
  }
  
  const conversationContent = `
    <div class="template-1-conversation">
      ${speakerUtterances.map(utterance => {
        const minutes = Math.floor(utterance.start / 60);
        const seconds = Math.floor(utterance.start % 60);
        const timeStamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return `
          <div class="conversation-entry">
            <div class="speaker-header">
              <strong class="speaker-name">${utterance.speaker}</strong>
              <span class="timestamp">[${timeStamp}]</span>
            </div>
            <div class="speaker-message">${utterance.text}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  return {
    conversationContent,
    includeFullTranscript: false, // Don't include separate full transcript section
    includeFullInMeetingInfo: true // Include full transcript in meeting info section
  };
}

// Template 2: Full Transcript Only - Raw transcript with one speaker bolded
function generateTemplate2(transcript: MeetingTranscript): { conversationContent: string; includeFullTranscript: boolean; includeFullInMeetingInfo: boolean } {
  if (!transcript.transcript) {
    return {
      conversationContent: '<div class="transcript-content">No transcript available.</div>',
      includeFullTranscript: false,
      includeFullInMeetingInfo: false
    };
  }
  
  // Process the transcript to bold one speaker (client by default)
  const clientName = transcript.clientName || 'Client';
  
  // Bold the client's name throughout the transcript
  const processedTranscript = transcript.transcript
    .replace(new RegExp(`^${clientName}:`, 'gm'), `<strong>${clientName}:</strong>`)
    .replace(new RegExp(`\\n${clientName}:`, 'g'), `\n<strong>${clientName}:</strong>`);
  
  const conversationContent = `
    <div class="template-2-full-transcript">
      <div class="full-transcript-content">${processedTranscript}</div>
    </div>
  `;
  
  return {
    conversationContent,
    includeFullTranscript: false, // We're showing the processed version, not the raw one
    includeFullInMeetingInfo: false
  };
}

// Template 3: Full Transcript on Top + Speaker View Below
function generateTemplate3(transcript: MeetingTranscript): { conversationContent: string; includeFullTranscript: boolean; includeFullInMeetingInfo: boolean } {
  const speakerUtterances = parseTranscriptForSpeakers(transcript);
  
  if (speakerUtterances.length === 0) {
    return {
      conversationContent: '<div class="transcript-content">No speaker data available.</div>',
      includeFullTranscript: true, // Will show full transcript in separate section
      includeFullInMeetingInfo: false
    };
  }
  
  const conversationContent = `
    <div class="template-3-conversation">
      <div class="section-subtitle">Speaker-by-Speaker Breakdown</div>
      ${speakerUtterances.map(utterance => {
        const minutes = Math.floor(utterance.start / 60);
        const seconds = Math.floor(utterance.start % 60);
        const timeStamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return `
          <div class="breakdown-entry">
            <div class="breakdown-header">
              <span class="breakdown-speaker">${utterance.speaker}</span>
              <span class="breakdown-time">${timeStamp}</span>
            </div>
            <div class="breakdown-content">${utterance.text}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  return {
    conversationContent,
    includeFullTranscript: true, // This template shows BOTH full transcript AND speaker breakdown
    includeFullInMeetingInfo: false
  };
}

// Template 4: Executive Summary - Key points only with speaker highlights
function generateTemplate4(transcript: MeetingTranscript): { conversationContent: string; includeFullTranscript: boolean; includeFullInMeetingInfo: boolean } {
  const speakerUtterances = parseTranscriptForSpeakers(transcript);
  
  if (speakerUtterances.length === 0) {
    return {
      conversationContent: '<div class="transcript-content">No speaker data available.</div>',
      includeFullTranscript: false,
      includeFullInMeetingInfo: false
    };
  }
  
  // Filter to longer utterances (likely more important points)
  const keyPoints = speakerUtterances.filter(utterance => utterance.text.length > 100);
  const pointsToShow = keyPoints.length > 0 ? keyPoints : speakerUtterances.slice(0, Math.min(10, speakerUtterances.length));
  
  const conversationContent = `
    <div class="template-4-executive">
      <div class="executive-note">
        <em>This executive summary shows key discussion points from the meeting.</em>
      </div>
      ${pointsToShow.map((utterance, index) => {
        const minutes = Math.floor(utterance.start / 60);
        const seconds = Math.floor(utterance.start % 60);
        const timeStamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return `
          <div class="executive-point">
            <div class="point-number">${index + 1}</div>
            <div class="point-content">
              <div class="point-header">
                <strong class="point-speaker">${utterance.speaker}</strong>
                <span class="point-time">${timeStamp}</span>
              </div>
              <div class="point-text">${utterance.text}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  return {
    conversationContent,
    includeFullTranscript: false, // Executive summary only, no full transcript
    includeFullInMeetingInfo: false
  };
}

// Import chromium for serverless environments
let chromium: {
  args: string[];
  defaultViewport: { width: number; height: number };
  executablePath: () => Promise<string>;
  headless: boolean;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  chromium = require('@sparticuz/chromium');
} catch {
  console.log('Chromium package not found, using regular puppeteer');
}

export interface PDFGenerationOptions {
  includeNotes?: boolean;
  includeTranscript?: boolean;
  includeMetadata?: boolean;
  recipientName?: string;
  recipientType?: 'client' | 'admin';
  template?: 1 | 2 | 3 | 4;
}

export async function generateTranscriptPDF(
  transcript: MeetingTranscript,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const {
    includeNotes = true,
    includeTranscript = true,
    includeMetadata = true,
    recipientName,
    recipientType = 'client',
    template = 1
  } = options;

  // Generate HTML content for the PDF
  const htmlContent = generatePDFHTML(transcript, {
    includeNotes,
    includeTranscript,
    includeMetadata,
    recipientName,
    recipientType,
    template
  });

  let browser;

  try {
    // Check if we're in a serverless environment
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
    
    if (isServerless && chromium) {
      // Use chromium for serverless environments
      browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      // Use regular puppeteer for local development
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }

    const page = await browser.newPage();
    
    // Set content and wait for any dynamic content to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Use the meeting date if available, otherwise fall back to current date
    const footerDate = transcript.startTime 
      ? transcript.startTime.toLocaleDateString() 
      : new Date().toLocaleDateString();
    
    // Generate PDF with professional formatting
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '0.75in',
        bottom: '1in',
        left: '0.75in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: Arial, sans-serif; font-size: 9px; color: #999; width: 100%; text-align: center; margin-top: 0.3in;">
          <span>${transcript.title || 'Meeting Transcript'}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: Arial, sans-serif; font-size: 9px; color: #999; width: 100%; text-align: center; margin-bottom: 0.3in;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | ${footerDate}</span>
        </div>
      `
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generatePDFHTML(
  transcript: MeetingTranscript,
  options: PDFGenerationOptions
): string {
  const {
    includeNotes,
    includeTranscript,
    includeMetadata,
    recipientName,
    recipientType,
    template = 1
  } = options;

  const startTime = transcript.startTime ? formatDate(transcript.startTime) : 'N/A';
  const endTime = transcript.endTime ? formatDate(transcript.endTime) : 'N/A';
  const duration = transcript.duration ? `${transcript.duration} minutes` : 'N/A';
  const meetingTitle = transcript.title || 'Untitled Meeting';

  // Generate conversation content based on template
  let conversationContent = '';
  let includeFullTranscript = true;
  let includeFullInMeetingInfo = false;
  
  switch (template) {
    case 1: {
      const result = generateTemplate1(transcript);
      conversationContent = result.conversationContent;
      includeFullTranscript = result.includeFullTranscript;
      includeFullInMeetingInfo = result.includeFullInMeetingInfo;
      break;
    }
    case 2: {
      const result = generateTemplate2(transcript);
      conversationContent = result.conversationContent;
      includeFullTranscript = result.includeFullTranscript;
      includeFullInMeetingInfo = result.includeFullInMeetingInfo;
      break;
    }
    case 3: {
      const result = generateTemplate3(transcript);
      conversationContent = result.conversationContent;
      includeFullTranscript = result.includeFullTranscript;
      includeFullInMeetingInfo = result.includeFullInMeetingInfo;
      break;
    }
    case 4: {
      const result = generateTemplate4(transcript);
      conversationContent = result.conversationContent;
      includeFullTranscript = result.includeFullTranscript;
      includeFullInMeetingInfo = result.includeFullInMeetingInfo;
      break;
    }
    default: {
      const result = generateTemplate1(transcript);
      conversationContent = result.conversationContent;
      includeFullTranscript = result.includeFullTranscript;
      includeFullInMeetingInfo = result.includeFullInMeetingInfo;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Transcript - ${meetingTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 12px;
          }
          
          .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 20px 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1a56db;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          
          .logo-icon {
            width: 32px;
            height: 32px;
            fill: #1a56db;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
          }
          
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          
          .subtitle {
            font-size: 14px;
            color: #666;
          }
          
          .metadata-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          
          .metadata-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .metadata-item {
            margin-bottom: 10px;
          }
          
          .metadata-label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            width: 120px;
          }
          
          .metadata-value {
            color: #333;
          }
          
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .content-box {
            background-color: #fafafa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
          }
          
          .transcript-content {
            white-space: pre-wrap;
            line-height: 1.8;
            font-size: 11px;
          }
          
          /* Template 1: Clean Conversation Flow */
          .template-1-conversation .conversation-entry {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .template-1-conversation .speaker-header {
            margin-bottom: 8px;
          }
          
          .template-1-conversation .speaker-name {
            font-size: 13px;
            font-weight: bold;
            color: #1a56db;
          }
          
          .template-1-conversation .timestamp {
            font-size: 10px;
            color: #666;
            margin-left: 10px;
          }
          
          .template-1-conversation .speaker-message {
            font-size: 11px;
            line-height: 1.6;
            color: #333;
            padding-left: 15px;
            border-left: 3px solid #e0e0e0;
            padding-top: 5px;
            padding-bottom: 5px;
          }
          
          /* Template 2: Full Transcript Only */
          .template-2-full-transcript .full-transcript-content {
            white-space: pre-wrap;
            line-height: 1.8;
            font-size: 11px;
            color: #333;
          }
          
          .template-2-full-transcript .full-transcript-content strong {
            color: #1a56db;
            font-weight: bold;
          }
          
          /* Template 3: Full Transcript + Speaker Breakdown */
          .template-3-conversation .section-subtitle {
            font-size: 14px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .template-3-conversation .breakdown-entry {
            margin-bottom: 18px;
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border-left: 3px solid #1a56db;
            page-break-inside: avoid;
          }
          
          .template-3-conversation .breakdown-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          
          .template-3-conversation .breakdown-speaker {
            font-size: 12px;
            font-weight: bold;
            color: #1a56db;
          }
          
          .template-3-conversation .breakdown-time {
            font-size: 10px;
            color: #666;
            background-color: white;
            padding: 2px 6px;
            border-radius: 3px;
          }
          
          .template-3-conversation .breakdown-content {
            font-size: 11px;
            line-height: 1.6;
            color: #333;
          }
          
          /* Template 4: Executive Summary */
          .template-4-executive .executive-note {
            background-color: #e3f2fd;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 25px;
            font-size: 11px;
            color: #1565c0;
            text-align: center;
          }
          
          .template-4-executive .executive-point {
            display: flex;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .template-4-executive .point-number {
            width: 30px;
            height: 30px;
            background-color: #1a56db;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
          }
          
          .template-4-executive .point-content {
            flex: 1;
          }
          
          .template-4-executive .point-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          
          .template-4-executive .point-speaker {
            font-size: 12px;
            color: #1a56db;
          }
          
          .template-4-executive .point-time {
            font-size: 10px;
            color: #666;
            background-color: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
          }
          
          .template-4-executive .point-text {
            font-size: 11px;
            line-height: 1.6;
            color: #333;
          }
          
          .notes-content {
            line-height: 1.7;
          }
          
          /* Markdown styles for notes */
          .notes-content h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 16px 0 8px 0;
            color: #1a56db;
          }
          
          .notes-content h2 {
            font-size: 14px;
            font-weight: bold;
            margin: 14px 0 6px 0;
            color: #333;
          }
          
          .notes-content h3 {
            font-size: 12px;
            font-weight: bold;
            margin: 12px 0 4px 0;
            color: #333;
          }
          
          .notes-content p {
            margin: 8px 0;
          }
          
          .notes-content ul, .notes-content ol {
            margin: 8px 0;
            padding-left: 20px;
          }
          
          .notes-content li {
            margin: 4px 0;
          }
          
          .notes-content strong {
            font-weight: bold;
          }
          
          .notes-content em {
            font-style: italic;
          }
          
          .notes-content code {
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
          }
          
          .recipient-info {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 162.02 146.42">
                <path d="M73.01,28.33c4.41-7.86,10.68-23.78,19.97-26.53,11.17-3.3,27.38-2.69,34.85,7.21,8.06,10.68,26,42.05,31.57,54.43,3.19,7.12,3.47,10.24.79,17.56-2.68,7.31-20.28,32.52-20.13,36.84l15.95,28.49c-6.76-1.67-13.92.77-21.38-.11-24.27-2.86-23.33-39.39-42.35-42.65-12.29-2.11-23.16,3.7-32.67-8.33-12.46-15.76-12.89-29.77.9-44.92,7.58-8.32,24.25-9.12,34.23-5.21,9.18,3.6,17.98,26.61,23.48,35.52.65,1.05,4.67,8.05,5.81,7.21,5.14-7.28,7.37-12.47,4.17-21.19-2.13-5.79-15.12-28.9-19.19-32.81-2.46-2.37-9.3-5.51-12.49-5.51h-23.5Z"/>
                <path d="M46.01,43.33c1.23,1.08-13.96,23.2-14.01,29.49s10.03,23.11,13.83,29.19c6.38,10.19,8.37,15.13,21.69,16.31,17.58,1.56,20.01-4.04,30.9,13.1,2.78,4.38,5.39,10.15,7.58,14.92h-57.5c-4.36,0-11.25-4.49-13.93-8.07L.24,77.61c-1.91-9.1,7.89-27.67,15.86-31.68.97-.49,6.89-2.6,7.4-2.6h22.5Z"/>
                <path d="M68.51.33c.85.05,3.26-.2,2.49,1.48-5.15,6.19-7.96,16.74-14.05,21.96-1.22,1.05-7.3,4.56-8.44,4.56h-25.5c6.06-7.69,9.59-22.43,19.44-26.06,1.08-.4,7.39-1.94,8.06-1.94,5.87,0,12.21-.35,18,0Z"/>
              </svg>
              <span class="logo-text">NotionIQ</span>
            </div>
            <div class="title">${meetingTitle}</div>
            <div class="subtitle">Meeting Transcript Report</div>
          </div>
          
          ${recipientName ? `
          <div class="recipient-info">
            <strong>Prepared for:</strong> ${recipientName} (${recipientType === 'client' ? 'Client' : 'Administrator'})
          </div>
          ` : ''}
          
          ${includeMetadata ? `
          <!-- Metadata Section -->
          <div class="section">
            <div class="section-title">Meeting Information</div>
            <div class="metadata-section">
              <div class="metadata-grid">
                <div>
                  <div class="metadata-item">
                    <span class="metadata-label">Meeting Date:</span>
                    <span class="metadata-value">${startTime}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">End Time:</span>
                    <span class="metadata-value">${endTime}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Duration:</span>
                    <span class="metadata-value">${duration}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Booking ID:</span>
                    <span class="metadata-value">${transcript.bookingUid}</span>
                  </div>
                </div>
                <div>
                  ${transcript.clientName ? `
                  <div class="metadata-item">
                    <span class="metadata-label">Client:</span>
                    <span class="metadata-value">${transcript.clientName}</span>
                  </div>
                  ` : ''}
                  ${transcript.clientEmail ? `
                  <div class="metadata-item">
                    <span class="metadata-label">Client Email:</span>
                    <span class="metadata-value">${transcript.clientEmail}</span>
                  </div>
                  ` : ''}
                  ${transcript.hostName ? `
                  <div class="metadata-item">
                    <span class="metadata-label">Host:</span>
                    <span class="metadata-value">${transcript.hostName}</span>
                  </div>
                  ` : ''}
                  ${transcript.hostEmail ? `
                  <div class="metadata-item">
                    <span class="metadata-label">Host Email:</span>
                    <span class="metadata-value">${transcript.hostEmail}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
            </div>
            
            ${includeFullInMeetingInfo && transcript.transcript ? `
            <!-- Full Transcript in Meeting Info -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <div style="font-size: 14px; font-weight: bold; color: #1a56db; margin-bottom: 10px;">Complete Transcript</div>
              <div class="transcript-content" style="background-color: #fafafa; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">${transcript.transcript}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          ${includeNotes && transcript.notes ? `
          <!-- Notes Section -->
          <div class="section">
            <div class="section-title">Meeting Notes</div>
            <div class="content-box">
              <div class="notes-content">${markdownToHtml(transcript.notes)}</div>
            </div>
          </div>
          ` : ''}
          
          ${includeTranscript && transcript.transcript ? `
          <!-- Conversation Section -->
          <div class="section ${includeNotes && transcript.notes ? 'page-break' : ''}">
            <div class="section-title">Meeting Conversation</div>
            <div class="content-box">
              ${conversationContent}
            </div>
          </div>
          
          ${includeFullTranscript ? `
          <!-- Full Transcript Section -->
          <div class="section page-break">
            <div class="section-title">Complete Transcript</div>
            <div class="content-box">
              <div class="transcript-content">${transcript.transcript}</div>
            </div>
          </div>
          ` : ''}
          ` : ''}
          
          <!-- Status Section -->
          <div class="section">
            <div class="section-title">Transcript Status</div>
            <div class="content-box">
              <p><strong>Status:</strong> ${transcript.status}</p>
              ${transcript.status === 'processing' ? '<p>The transcript is currently being processed and will be available shortly.</p>' : ''}
              ${transcript.status === 'failed' ? '<p>Transcript processing failed. Please contact support for assistance.</p>' : ''}
              ${transcript.status === 'pending' ? '<p>The transcript is pending processing.</p>' : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
} 