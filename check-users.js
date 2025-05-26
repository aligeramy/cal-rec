const { PrismaClient } = require('./lib/generated/prisma');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log('Users in database:');
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('\nTo create a user, you need to:');
      console.log('1. Go to http://localhost:3000/signup');
      console.log('2. Create an account with email and password');
      console.log('3. Then login at http://localhost:3000/login');
    } else {
      users.forEach(user => {
        console.log(`✅ User: ${user.email} (${user.name || 'No name'}) - Created: ${user.createdAt}`);
      });
      console.log(`\nTotal users: ${users.length}`);
      console.log('\nTo access transcripts:');
      console.log('1. Go to http://localhost:3000/login');
      console.log('2. Login with one of the above email addresses');
      console.log('3. Then navigate to http://localhost:3000/dashboard/transcripts');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 