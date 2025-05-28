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
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString()}</span>
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
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 10px;
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
            <div class="logo">TranscriptAI</div>
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
          <!-- Transcript Section -->
          <div class="section ${includeNotes && transcript.notes ? 'page-break' : ''}">
            <div class="section-title">Full Transcript</div>
            <div class="content-box">
              <div class="transcript-content">${transcript.transcript}</div>
            </div>
          </div>
          ` : ''}
          
          ${!includeTranscript && !transcript.transcript ? `
          <div class="section">
            <div class="section-title">Transcript Status</div>
            <div class="content-box">
              <p><strong>Status:</strong> ${transcript.status}</p>
              ${transcript.status === 'processing' ? '<p>The transcript is currently being processed and will be available shortly.</p>' : ''}
              ${transcript.status === 'failed' ? '<p>Transcript processing failed. Please contact support for assistance.</p>' : ''}
              ${transcript.status === 'pending' ? '<p>The transcript is pending processing.</p>' : ''}
            </div>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
} 