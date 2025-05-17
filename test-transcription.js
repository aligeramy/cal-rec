import axios from 'axios';

// Test video URL - using a small sample MP4 file
const TEST_VIDEO_URL = 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4';

// Your service URL
const SERVICE_URL = 'https://transcribe.softx.ca/process';

// Callback URL for receiving transcription results
const CALLBACK_URL = 'https://cal.softx.ca/api/transcripts/update';

// Generate a unique ID for this test
const TEST_BOOKING_ID = `test-${Date.now()}`;

async function testTranscription() {
  try {
    console.log(`\n📝 Testing transcription service at ${SERVICE_URL}`);
    console.log(`📋 Using test booking ID: ${TEST_BOOKING_ID}`);
    console.log(`🎬 Test video URL: ${TEST_VIDEO_URL}`);
    
    const response = await axios.post(SERVICE_URL, {
      downloadUrl: TEST_VIDEO_URL,
      bookingUid: TEST_BOOKING_ID,
      title: 'Test Transcription',
      callbackUrl: CALLBACK_URL
    });
    
    console.log('\n✅ Request accepted!');
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
    console.log('\n⏳ The transcription process has started.');
    console.log('📝 The service will:');
    console.log('   1. Download the video');
    console.log('   2. Extract audio using FFmpeg');
    console.log('   3. Transcribe using OpenAI Whisper API');
    console.log('   4. Send results to your callback URL');
    
    console.log('\n🔍 Check your database in a few minutes for bookingUid:', TEST_BOOKING_ID);
    console.log('   You should see the transcript data appear when processing completes.');
    
  } catch (error) {
    console.error('\n❌ Error testing transcription service:');
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Error data:', error.response.data);
    } else {
      console.error('🔴 Error message:', error.message);
    }
  }
}

// Run the test
testTranscription(); 