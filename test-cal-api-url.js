const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Test the Cal.com API URL you provided
const testUrl = 'https://app.cal.com/api/video/recording?token=0b0fe146-56d2-466a-85aa-4c6a0c688128:1764075569653:ae2a533848a937fcb5299844e18191a6ec69b430525c4a1072e07c3abcfb902c';

async function testCalApiUrl() {
  console.log('🔍 Testing Cal.com API recording URL...');
  console.log('URL:', testUrl);
  
  try {
    // First, let's see what headers we get
    console.log('\n📋 Checking response headers...');
    const headResponse = await axios.head(testUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Cal-Transcription-Service/1.0.0'
      }
    });
    
    console.log('✅ HEAD request successful');
    console.log('Status:', headResponse.status);
    console.log('Headers:', headResponse.headers);
    
    // Now try to download
    console.log('\n📥 Downloading file...');
    const response = await axios({
      method: 'GET',
      url: testUrl,
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': 'Cal-Transcription-Service/1.0.0'
      }
    });

    const testFilePath = path.join(__dirname, 'test-cal-download');
    const writer = fs.createWriteStream(testFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Check what we downloaded
    const stats = fs.statSync(testFilePath);
    console.log('✅ Download completed');
    console.log('📊 File size:', stats.size, 'bytes');
    console.log('📊 File size:', (stats.size / 1024).toFixed(2), 'KB');

    // Try to read the first few bytes to see what type of file it is
    const buffer = fs.readFileSync(testFilePath);
    const firstBytes = buffer.slice(0, 20);
    console.log('📄 First 20 bytes (hex):', firstBytes.toString('hex'));
    console.log('📄 First 20 bytes (text):', firstBytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.'));

    // Check if it's a video file with FFprobe
    console.log('\n🎵 Checking with FFprobe...');
    
    return new Promise((resolve) => {
      ffmpeg.ffprobe(testFilePath, (err, metadata) => {
        if (err) {
          console.error('❌ FFprobe failed:', err.message);
          console.log('💡 This suggests the downloaded file is not a valid video/audio file');
          
          // Try to read as text to see if it's an error message
          try {
            const content = fs.readFileSync(testFilePath, 'utf8');
            console.log('📄 File content (first 500 chars):');
            console.log(content.substring(0, 500));
          } catch (readError) {
            console.log('❌ Cannot read file as text either');
          }
        } else {
          console.log('✅ FFprobe successful - this is a valid media file:');
          console.log('   Duration:', metadata.format.duration, 'seconds');
          console.log('   Bitrate:', metadata.format.bit_rate);
          console.log('   Format:', metadata.format.format_name);
          console.log('   Size:', metadata.format.size);
          
          if (metadata.streams) {
            metadata.streams.forEach((stream, index) => {
              console.log(`   Stream ${index}:`, stream.codec_type, stream.codec_name);
              if (stream.duration) {
                console.log(`     Duration: ${stream.duration}s`);
              }
            });
          }
        }
        
        // Clean up
        fs.removeSync(testFilePath);
        console.log('🧹 Cleaned up test file');
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Headers:', error.response.headers);
      
      // If we got a response, try to read the error content
      if (error.response.data) {
        try {
          let errorContent = '';
          error.response.data.on('data', chunk => {
            errorContent += chunk.toString();
          });
          error.response.data.on('end', () => {
            console.error('   Error content:', errorContent.substring(0, 500));
          });
        } catch (e) {
          console.error('   Could not read error content');
        }
      }
    }
  }
}

// Run the test
testCalApiUrl().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 