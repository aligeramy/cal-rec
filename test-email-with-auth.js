const { PrismaClient } = require('./lib/generated/prisma');

async function testEmailWithAuth() {
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
    
    // Test the email API endpoint with a simple test first
    console.log('\n1. Testing API endpoint availability...');
    const healthResponse = await fetch('http://localhost:3000/api/transcripts/send-email', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Health check status:', healthResponse.status);
    
    // Test with minimal payload to see what error we get
    console.log('\n2. Testing with minimal payload...');
    const testPayload = {
      transcriptId: transcript.id,
      recipient: {
        email: transcript.clientEmail || transcript.hostEmail,
        name: transcript.clientName || transcript.hostName || 'Test User'
      }
    };
    
    console.log('Test payload:', testPayload);
    
    const response = await fetch('http://localhost:3000/api/transcripts/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', result);
    
    // Check if it's specifically an auth issue
    if (response.status === 401) {
      console.log('\n❌ AUTHENTICATION ISSUE CONFIRMED');
      console.log('The email API requires authentication but the request is not authenticated.');
      console.log('This happens when:');
      console.log('1. User is not logged in');
      console.log('2. Session cookies are not being sent with the request');
      console.log('3. Session has expired');
      console.log('\nTo fix this, make sure:');
      console.log('1. You are logged into the application');
      console.log('2. The frontend includes credentials: "include" in fetch requests');
      console.log('3. The session is valid');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailWithAuth(); 