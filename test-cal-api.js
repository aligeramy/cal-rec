const axios = require('axios');

// Test Cal.com API to get recordings
async function testCalApi() {
  console.log('🔍 Testing Cal.com API for recordings...');
  
  // You'll need to replace these with actual values
  const bookingId = 'YOUR_BOOKING_ID'; // Get this from your database
  const apiKey = 'YOUR_CAL_API_KEY';   // Get this from Cal.com dashboard
  
  if (bookingId === 'YOUR_BOOKING_ID' || apiKey === 'YOUR_CAL_API_KEY') {
    console.log('❌ Please update the bookingId and apiKey in this script');
    console.log('💡 You can find these values in:');
    console.log('   - Booking ID: Your database (bookingUid field)');
    console.log('   - API Key: Cal.com dashboard > Settings > API Keys');
    return;
  }
  
  try {
    console.log('📋 Making API request...');
    const response = await axios.get(`https://api.cal.com/v1/bookings/${bookingId}/recordings`, {
      params: { apiKey },
      timeout: 30000,
      headers: {
        'User-Agent': 'Cal-Transcription-Service/1.0.0'
      }
    });

    console.log('✅ API request successful!');
    console.log('Status:', response.status);
    console.log('Recordings found:', response.data.length);
    
    if (response.data.length > 0) {
      const recording = response.data[0];
      console.log('\n📹 Recording details:');
      console.log('   ID:', recording.id);
      console.log('   Status:', recording.status);
      console.log('   Duration:', recording.duration, 'seconds');
      console.log('   Start time:', new Date(recording.start_ts * 1000).toISOString());
      console.log('   Download link:', recording.download_link?.substring(0, 100) + '...');
      
      if (recording.status === 'finished') {
        console.log('✅ Recording is ready for download');
        
        // Test if the download link works
        try {
          console.log('\n🔗 Testing download link...');
          const headResponse = await axios.head(recording.download_link, {
            timeout: 10000
          });
          
          console.log('✅ Download link is accessible');
          console.log('   Content-Type:', headResponse.headers['content-type']);
          console.log('   Content-Length:', headResponse.headers['content-length']);
          
        } catch (downloadError) {
          console.log('❌ Download link test failed:', downloadError.response?.status || downloadError.message);
        }
        
      } else {
        console.log('⚠️ Recording not ready yet. Status:', recording.status);
      }
    } else {
      console.log('❌ No recordings found for this booking');
    }

  } catch (error) {
    console.error('❌ API request failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testCalApi().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 