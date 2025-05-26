const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function checkTranscripts() {
  try {
    const transcripts = await prisma.meetingTranscript.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('Recent transcripts:');
    transcripts.forEach(t => {
      console.log(`ID: ${t.id}, Status: ${t.status}, Client: ${t.clientEmail}, Host: ${t.hostEmail}, Title: ${t.title}`);
    });
    
    if (transcripts.length === 0) {
      console.log('No transcripts found in database');
    }
    
    // Check for completed transcripts with email addresses
    const completedWithEmails = transcripts.filter(t => 
      t.status === 'completed' && (t.clientEmail || t.hostEmail)
    );
    
    console.log(`\nCompleted transcripts with emails: ${completedWithEmails.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTranscripts(); 