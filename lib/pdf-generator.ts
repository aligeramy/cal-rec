import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import { MeetingTranscript } from '@/lib/types';
import { formatDate } from '@/lib/utils';

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
    recipientType = 'client'
  } = options;

  // Generate HTML content for the PDF
  const htmlContent = generatePDFHTML(transcript, {
    includeNotes,
    includeTranscript,
    includeMetadata,
    recipientName,
    recipientType
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
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 0.5in;">
          <span>Meeting Transcript - ${transcript.title || 'Untitled Meeting'}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-bottom: 0.5in;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${footerDate}</span>
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
    recipientType
  } = options;

  const startTime = transcript.startTime ? formatDate(transcript.startTime) : 'N/A';
  const endTime = transcript.endTime ? formatDate(transcript.endTime) : 'N/A';
  const duration = transcript.duration ? `${transcript.duration} minutes` : 'N/A';
  const meetingTitle = transcript.title || 'Untitled Meeting';

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
            border-left: 4px solid #1a56db;
          }
          
          .transcript-content {
            white-space: pre-wrap;
            line-height: 1.8;
            font-size: 11px;
          }
          
          .notes-content {
            white-space: pre-wrap;
            line-height: 1.7;
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
          </div>
          ` : ''}
          
          ${includeNotes && transcript.notes ? `
          <!-- Notes Section -->
          <div class="section">
            <div class="section-title">Meeting Notes</div>
            <div class="content-box">
              <div class="notes-content">${transcript.notes}</div>
            </div>
          </div>
          ` : ''}
          
          ${includeTranscript && transcript.transcript ? `
          <!-- Full Transcript Section -->
          <div class="section ${includeNotes && transcript.notes ? 'page-break' : ''}">
            <div class="section-title">Full Transcript</div>
            <div class="content-box">
              <div class="transcript-content">${transcript.transcript}</div>
            </div>
          </div>
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