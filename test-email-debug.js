const { PrismaClient } = require('./lib/generated/prisma');

async function testEmailFunctionality() {
  const prisma = new PrismaClient();
  
  try {
    // Get a completed transcript
    const transcript = await prisma.meetingTranscript.findFirst({
      where: { 
        status: 'completed',
        OR: [
          { clientEmail: { not: null } },
          { hostEmail: { not: null } }
        ]
      }
    });
    
    if (!transcript) {
      console.log('No completed transcript with email found');
      return;
    }
    
    console.log('Found transcript:', {
      id: transcript.id,
      title: transcript.title,
      clientEmail: transcript.clientEmail,
      hostEmail: transcript.hostEmail,
      status: transcript.status
    });
    
    // Test the email API endpoint
    const testPayload = {
      transcriptId: transcript.id,
      recipient: {
        email: transcript.clientEmail || transcript.hostEmail,
        name: transcript.clientName || transcript.hostName || 'Test User'
      },
      subject: `Test Email: ${transcript.title || 'Untitled Meeting'}`,
      includeNotes: true,
      includeTranscript: true,
      sendAsPDF: true
    };
    
    console.log('Testing email API with payload:', testPayload);
    
    // Make the API call
    const response = await fetch('http://localhost:3000/api/transcripts/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // This will fail auth, but we'll see the error
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', result);
    
    if (!response.ok) {
      console.log('Email API failed with status:', response.status);
      console.log('Error details:', result);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailFunctionality(); 