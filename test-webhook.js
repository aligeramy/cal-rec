const axios = require('axios');

async function testWebhook() {
  console.log('🧪 Testing webhook endpoint...');
  
  // Test data similar to what the VPS sends
  const testData = {
    bookingUid: 'u5NQPkhHTA7EtfqCh5nhVY', // From the logs
    transcription: {
      text: '',
      duration: 1.0199999809265137,
      language: 'english',
      segments: [],
      words: [],
      metadata: {
        model: 'whisper-1',
        temperature: 0.0,
        timestamp_granularities: ['word', 'segment'],
        file_size_mb: '0.02',
        estimated_duration: 1.116
      }
    },
    jobId: '4d4cd4b2-cb5e-4244-b096-3b1989c41f77',
    status: 'completed'
  };

  try {
    console.log('📤 Sending test webhook...');
    const response = await axios.post('http://localhost:3000/api/transcripts/webhook', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Webhook test successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Webhook test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure Next.js dev server is running on port 3000');
    }
  }
}

testWebhook(); 