const { PrismaClient } = require('./lib/generated/prisma');

// Cal.com API configuration
const CAL_API_KEY = process.env.CALCOM_API || "cal_live_90103c78a8e4b3cd0a0b55d6b7f06ee4";
const CAL_API_BASE = "https://api.cal.com/v1";

async function debugCalTranscription() {
  const prisma = new PrismaClient();
  
  try {
    // Get a failed or processing transcript
    const transcript = await prisma.meetingTranscript.findFirst({
      where: { 
        OR: [
          { status: 'failed' },
          { status: 'processing' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!transcript) {
      console.log('No failed or processing transcripts found');
      return;
    }
    
    console.log('🔍 Found transcript to debug:', {
      id: transcript.id,
      bookingUid: transcript.bookingUid,
      status: transcript.status,
      title: transcript.title
    });
    
    const bookingUid = transcript.bookingUid;
    
    // Step 1: Test Cal.com API authentication
    console.log('\n📡 Step 1: Testing Cal.com API authentication...');
    const authTestResponse = await fetch(`${CAL_API_BASE}/me?apiKey=${CAL_API_KEY}`);
    console.log('Auth test status:', authTestResponse.status);
    
    if (!authTestResponse.ok) {
      console.error('❌ Cal.com API authentication failed');
      const errorText = await authTestResponse.text();
      console.error('Error:', errorText);
      return;
    }
    
    const userInfo = await authTestResponse.json();
    console.log('✅ Cal.com API authenticated as:', userInfo.email);
    
    // Step 2: Find the booking by UID
    console.log('\n📋 Step 2: Finding booking by UID...');
    const bookingsResponse = await fetch(`${CAL_API_BASE}/bookings?apiKey=${CAL_API_KEY}`);
    
    if (!bookingsResponse.ok) {
      console.error('❌ Failed to fetch bookings:', bookingsResponse.status);
      const errorText = await bookingsResponse.text();
      console.error('Error:', errorText);
      return;
    }
    
    const bookingsData = await bookingsResponse.json();
    console.log('📊 Total bookings found:', bookingsData.bookings?.length || 0);
    
    const booking = bookingsData.bookings?.find(b => b.uid === bookingUid);
    
    if (!booking) {
      console.error('❌ Booking not found with UID:', bookingUid);
      console.log('Available booking UIDs:', bookingsData.bookings?.map(b => b.uid).slice(0, 5));
      return;
    }
    
    console.log('✅ Found booking:', {
      id: booking.id,
      uid: booking.uid,
      title: booking.title,
      status: booking.status
    });
    
    // Step 3: Get recordings for this booking
    console.log('\n🎥 Step 3: Getting recordings...');
    const recordingsResponse = await fetch(`${CAL_API_BASE}/bookings/${booking.id}/recordings?apiKey=${CAL_API_KEY}`);
    
    if (!recordingsResponse.ok) {
      console.error('❌ Failed to fetch recordings:', recordingsResponse.status);
      const errorText = await recordingsResponse.text();
      console.error('Error:', errorText);
      return;
    }
    
    const recordings = await recordingsResponse.json();
    console.log('🎬 Recordings found:', recordings.length);
    
    if (recordings.length === 0) {
      console.log('❌ No recordings found for this booking');
      console.log('This could mean:');
      console.log('1. The meeting was not recorded');
      console.log('2. The recording is still being processed by Cal.com');
      console.log('3. The recording failed');
      return;
    }
    
    const recording = recordings[0];
    console.log('📹 Recording details:', {
      id: recording.id,
      status: recording.status,
      duration: recording.duration,
      download_link: recording.download_link ? 'Available' : 'Not available'
    });
    
    if (recording.status !== 'finished') {
      console.log('⏳ Recording is not finished yet. Status:', recording.status);
      console.log('Wait for the recording to be processed by Cal.com before transcription can begin.');
      return;
    }
    
    // Step 4: Get transcripts
    console.log('\n📝 Step 4: Getting transcripts...');
    const transcriptsResponse = await fetch(`${CAL_API_BASE}/bookings/${booking.id}/transcripts/${recording.id}?apiKey=${CAL_API_KEY}`);
    
    if (!transcriptsResponse.ok) {
      console.error('❌ Failed to fetch transcripts:', transcriptsResponse.status);
      const errorText = await transcriptsResponse.text();
      console.error('Error:', errorText);
      
      if (transcriptsResponse.status === 404) {
        console.log('💡 This likely means Cal.com has not generated transcripts yet.');
        console.log('Transcripts are generated after the recording is processed.');
        console.log('Try again in a few minutes.');
      }
      return;
    }
    
    const transcripts = await transcriptsResponse.json();
    console.log('📄 Transcript formats available:', transcripts.map(t => t.format));
    
    // Step 5: Download and test transcript content
    const txtTranscript = transcripts.find(t => t.format === 'txt');
    if (txtTranscript) {
      console.log('\n📥 Step 5: Downloading TXT transcript...');
      const txtResponse = await fetch(txtTranscript.link);
      
      if (txtResponse.ok) {
        const transcriptText = await txtResponse.text();
        console.log('✅ TXT transcript downloaded successfully');
        console.log('📊 Transcript length:', transcriptText.length, 'characters');
        console.log('📝 First 200 characters:', transcriptText.substring(0, 200));
        
        // Update the database
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: {
            transcript: transcriptText,
            status: 'completed',
            updatedAt: new Date(),
          },
        });
        
        console.log('✅ Database updated successfully!');
        console.log('🎉 Transcript should now be visible in the frontend');
        
      } else {
        console.error('❌ Failed to download TXT transcript:', txtResponse.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugCalTranscription(); 