const axios = require('axios');

// Test the Cal.com API URL with different authentication approaches
const testUrl = 'https://app.cal.com/api/video/recording?token=0b0fe146-56d2-466a-85aa-4c6a0c688128:1764075569653:ae2a533848a937fcb5299844e18191a6ec69b430525c4a1072e07c3abcfb902c';

async function testWithDifferentHeaders() {
  console.log('🔍 Testing Cal.com API with different headers...');
  
  const testCases = [
    {
      name: 'Basic User-Agent',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    },
    {
      name: 'Cal.com Referrer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://app.cal.com/',
        'Origin': 'https://app.cal.com'
      }
    },
    {
      name: 'Accept Headers',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'video/mp4,video/*,*/*',
        'Accept-Encoding': 'identity',
        'Range': 'bytes=0-'
      }
    },
    {
      name: 'No Headers',
      headers: {}
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    try {
      const response = await axios.head(testUrl, {
        headers: testCase.headers,
        timeout: 10000
      });
      
      console.log('✅ Success!');
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content-Length:', response.headers['content-length']);
      
      // If successful, try to download a small chunk
      try {
        const downloadResponse = await axios({
          method: 'GET',
          url: testUrl,
          headers: {
            ...testCase.headers,
            'Range': 'bytes=0-1023' // First 1KB
          },
          timeout: 10000
        });
        
        console.log('✅ Download test successful');
        console.log('Downloaded bytes:', downloadResponse.data.length);
        
      } catch (downloadError) {
        console.log('❌ Download failed:', downloadError.response?.status || downloadError.message);
      }
      
    } catch (error) {
      console.log('❌ Failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.statusText || error.message);
    }
  }
}

// Also test if the URL might be expired
async function testUrlExpiration() {
  console.log('\n🕐 Checking if URL might be expired...');
  
  // Extract timestamp from URL
  const urlParts = testUrl.match(/token=([^:]+):(\d+):/);
  if (urlParts) {
    const timestamp = parseInt(urlParts[2]);
    const now = Date.now();
    const age = now - timestamp;
    const ageHours = age / (1000 * 60 * 60);
    
    console.log('URL timestamp:', new Date(timestamp).toISOString());
    console.log('Current time:', new Date(now).toISOString());
    console.log('URL age:', ageHours.toFixed(2), 'hours');
    
    if (ageHours > 12) {
      console.log('⚠️ URL is older than 12 hours - likely expired');
    } else {
      console.log('✅ URL is recent - should still be valid');
    }
  }
}

// Run tests
testWithDifferentHeaders()
  .then(() => testUrlExpiration())
  .then(() => {
    console.log('\n🏁 All tests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  }); 