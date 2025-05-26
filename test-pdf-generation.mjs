import { generateTranscriptPDF } from './lib/pdf-generator.js';
import fs from 'fs';
import path from 'path';

// Mock transcript data for testing
const mockTranscript = {
  id: 'test-id',
  bookingUid: 'test-booking-123',
  title: 'Test Meeting',
  startTime: new Date('2024-01-15T10:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  duration: 60,
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  hostName: 'Jane Smith',
  hostEmail: 'jane@example.com',
  transcript: 'This is a test transcript. The meeting went well and we discussed various topics including project timelines, budget considerations, and next steps. The client was satisfied with the proposed approach.',
  notes: 'Meeting Notes:\n\n1. Project approved\n2. Timeline: 6 weeks\n3. Budget: $50,000\n4. Next meeting: Next Friday',
  status: 'completed',
  createdAt: new Date(),
  updatedAt: new Date()
};

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF generation...');
    
    const pdfBuffer = await generateTranscriptPDF(mockTranscript, {
      includeNotes: true,
      includeTranscript: true,
      includeMetadata: true,
      recipientName: 'John Doe',
      recipientType: 'client'
    });
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // Save the PDF for manual inspection
    const outputPath = path.join(process.cwd(), 'test-transcript.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`💾 PDF saved to: ${outputPath}`);
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testPDFGeneration(); 