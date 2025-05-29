// Test script for PDF generation
// Run with: npx tsx test-pdf-generation.mjs

import { generateTranscriptPDF } from './lib/pdf-generator.ts';
import fs from 'fs';
import path from 'path';

// Mock transcript data for testing with chat view
const mockTranscript = {
  id: 'test-id',
  bookingUid: 'test-booking-123',
  title: 'Test Meeting with Chat View',
  startTime: new Date('2024-01-15T10:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  duration: 60,
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  hostName: 'Jane Smith',
  hostEmail: 'jane@example.com',
  transcript: 'This is a test transcript. The meeting went well and we discussed various topics including project timelines, budget considerations, and next steps. The client was satisfied with the proposed approach.',
  transcriptJson: JSON.stringify({
    words: [
      { word: "Hello", start: 0.5, end: 1.0, confidence: 0.95, speaker: 1, punctuated_word: "Hello" },
      { word: "there", start: 1.0, end: 1.5, confidence: 0.92, speaker: 1, punctuated_word: "there." },
      { word: "Hi", start: 2.0, end: 2.3, confidence: 0.98, speaker: 0, punctuated_word: "Hi" },
      { word: "Jane", start: 2.3, end: 2.8, confidence: 0.89, speaker: 0, punctuated_word: "Jane." }
    ],
    utterances: [
      {
        start: 0.5,
        end: 1.5,
        confidence: 0.93,
        transcript: "Hello there.",
        speaker: 1
      },
      {
        start: 2.0,
        end: 2.8,
        confidence: 0.94,
        transcript: "Hi Jane.",
        speaker: 0
      },
      {
        start: 5.0,
        end: 8.5,
        confidence: 0.91,
        transcript: "Thanks for joining the meeting today. How are you doing?",
        speaker: 1
      },
      {
        start: 9.0,
        end: 12.0,
        confidence: 0.96,
        transcript: "I'm doing great, thank you! Ready to discuss the project.",
        speaker: 0
      }
    ],
    metadata: {
      duration: 720,
      created: new Date().toISOString()
    }
  }),
  notes: 'Meeting Notes:\n\n1. Project approved\n2. Timeline: 6 weeks\n3. Budget: $50,000\n4. Next meeting: Next Friday',
  status: 'completed',
  createdAt: new Date(),
  updatedAt: new Date()
};

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing enhanced PDF generation with chat view...');
    
    const pdfBuffer = await generateTranscriptPDF(mockTranscript, {
      includeNotes: true,
      includeTranscript: true,
      includeChatView: true,
      includeMetadata: true,
      recipientName: 'John Doe',
      recipientType: 'client'
    });
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // Save the PDF for manual inspection
    const outputPath = path.join(process.cwd(), 'test-transcript-with-chat.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`💾 PDF saved to: ${outputPath}`);
    console.log('🎉 Test completed successfully!');
    console.log('📋 The PDF now includes:');
    console.log('   • Meeting metadata');
    console.log('   • Meeting notes');
    console.log('   • Chat view with message bubbles');
    console.log('   • Full transcript');
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    console.error(error.stack);
  }
}

testPDFGeneration(); 