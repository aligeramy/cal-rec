const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Test downloading from the actual Cal.com recording URL in your database
async function debugDownload() {
  console.log('🔍 Debugging Cal.com Recording Download...\n');
  
  // Replace this with the actual URL from your database
  const recordingUrl = 'https://app.cal.com/api/video/recording?token=YOUR_ACTUAL_TOKEN_FROM_DB';
  
  if (recordingUrl.includes('YOUR_ACTUAL_TOKEN_FROM_DB')) {
    console.log('❌ Please update the recordingUrl with the actual URL from your database');
    console.log('💡 Copy the exact URL from your database recordingUrl field');
    return;
  }

  console.log('🔗 Testing URL:', recordingUrl.substring(0, 100) + '...');

  try {
    // Step 1: Check what headers we get
    console.log('\n📋 Step 1: Checking response headers...');
    const headResponse = await axios.head(recordingUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      maxRedirects: 5
    });
    
    console.log('✅ HEAD request successful');
    console.log('   Status:', headResponse.status);
    console.log('   Content-Type:', headResponse.headers['content-type']);
    console.log('   Content-Length:', headResponse.headers['content-length']);
    console.log('   File Size:', headResponse.headers['content-length'] ? Math.round(headResponse.headers['content-length'] / 1024 / 1024) + ' MB' : 'Unknown');
    console.log('   Accept-Ranges:', headResponse.headers['accept-ranges']);
    
    // Step 2: Try different download approaches
    console.log('\n📥 Step 2: Testing different download methods...');
    
    const testMethods = [
      {
        name: 'Browser-like headers',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'video/mp4,video/*,*/*',
          'Accept-Encoding': 'identity',
          'Referer': 'https://app.cal.com/',
          'Origin': 'https://app.cal.com'
        }
      },
      {
        name: 'Simple headers',
        headers: {
          'User-Agent': 'Cal-Transcription-Service/1.0.0'
        }
      },
      {
        name: 'Range request (first 1MB)',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Range': 'bytes=0-1048575'
        }
      }
    ];

    for (const method of testMethods) {
      console.log(`\n🧪 Testing: ${method.name}`);
      
      try {
        const response = await axios({
          method: 'GET',
          url: recordingUrl,
          responseType: 'stream',
          timeout: 60000,
          headers: method.headers,
          maxRedirects: 5
        });

        console.log('   ✅ Request successful');
        console.log('   Status:', response.status);
        console.log('   Content-Type:', response.headers['content-type']);
        console.log('   Content-Length:', response.headers['content-length']);
        
        // Save a small sample to check
        const testFilePath = path.join(__dirname, `test-${method.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`);
        const writer = fs.createWriteStream(testFilePath);
        
        let downloadedBytes = 0;
        let chunks = 0;
        
        response.data.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          chunks++;
          
          // Only save first 5MB for testing
          if (downloadedBytes < 5 * 1024 * 1024) {
            writer.write(chunk);
          }
        });

        await new Promise((resolve, reject) => {
          response.data.on('end', () => {
            writer.end();
            console.log('   📊 Downloaded:', Math.round(downloadedBytes / 1024), 'KB in', chunks, 'chunks');
            
            // Check actual file size
            const stats = fs.statSync(testFilePath);
            console.log('   📁 File saved:', Math.round(stats.size / 1024), 'KB');
            
            if (stats.size < 100000) { // Less than 100KB
              console.log('   ⚠️ WARNING: Downloaded file is very small!');
            }
            
            resolve();
          });
          
          response.data.on('error', reject);
          writer.on('error', reject);
        });

        // If this method worked well, break
        if (downloadedBytes > 1000000) { // More than 1MB
          console.log('   ✅ This method seems to work well!');
          break;
        }

      } catch (error) {
        console.log('   ❌ Failed:', error.response?.status || error.message);
      }
    }

    // Step 3: Check for redirects
    console.log('\n🔄 Step 3: Checking for redirects...');
    try {
      const response = await axios({
        method: 'GET',
        url: recordingUrl,
        maxRedirects: 0, // Don't follow redirects
        validateStatus: () => true, // Accept all status codes
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (response.status >= 300 && response.status < 400) {
        console.log('   🔄 Redirect detected!');
        console.log('   Status:', response.status);
        console.log('   Location:', response.headers.location);
        console.log('   💡 The URL redirects to:', response.headers.location?.substring(0, 100) + '...');
        
        // Test the redirect URL directly
        if (response.headers.location) {
          console.log('\n🎯 Testing redirect URL directly...');
          try {
            const directResponse = await axios.head(response.headers.location, {
              timeout: 30000
            });
            
            console.log('   ✅ Direct URL works!');
            console.log('   Content-Length:', directResponse.headers['content-length']);
            console.log('   File Size:', directResponse.headers['content-length'] ? Math.round(directResponse.headers['content-length'] / 1024 / 1024) + ' MB' : 'Unknown');
            
          } catch (directError) {
            console.log('   ❌ Direct URL failed:', directError.message);
          }
        }
      } else {
        console.log('   ℹ️ No redirect, direct response');
      }

    } catch (error) {
      console.log('   ❌ Redirect check failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Headers:', error.response.headers);
    }
  }
}

// Run the debug
debugDownload().then(() => {
  console.log('\n🏁 Debug completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Check which download method worked best');
  console.log('2. Look for redirect URLs that might be the real download link');
  console.log('3. Update VPS backend to use the working method');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug crashed:', error);
  process.exit(1);
}); 