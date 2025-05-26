// Test script to verify email functionality
// Run with: node test-email-functionality.js

const fetch = require('node-fetch');

async function testEmailFunctionality() {
  try {
    console.log('🧪 Testing email functionality...');
    
    // Test with a mock transcript ID - you'll need to replace this with a real one
    const testData = {
      transcriptId: 'cmb5lxkya0000jy04pcbhmtx0', // Replace with actual transcript ID
      recipientEmail: 'test@example.com', // Replace with your test email
      recipientName: 'Test User'
    };
    
    console.log('📧 Sending test email to:', testData.recipientEmail);
    
    const response = await fetch('http://localhost:3000/api/test/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('📄 Response:', result);
    } else {
      console.error('❌ Email sending failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions for running the test
console.log(`
📋 Email Functionality Test Instructions:

1. Make sure your Next.js app is running (npm run dev)
2. Update the transcriptId in this script with a real transcript ID from your database
3. Update the recipientEmail with your test email address
4. Make sure RESEND_API_KEY is set in your .env file
5. Run this script: node test-email-functionality.js

🔧 Current test configuration:
- Transcript ID: cmb5lxkya0000jy04pcbhmtx0 (update this!)
- Recipient: test@example.com (update this!)
- PDF Generation: Enabled
- Include Notes: Yes
- Include Transcript: Yes

`);

// Uncomment the line below to run the test
// testEmailFunctionality(); 