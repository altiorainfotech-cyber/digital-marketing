require('dotenv').config();
const path = require('path');

console.log('Environment check:');
console.log('CWD:', process.cwd());
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50));
console.log('');

// Try to import and use prisma
async function testPrisma() {
  try {
    console.log('Attempting to load Prisma client...');
    const { prisma } = require('../lib/prisma.ts');
    
    console.log('✅ Prisma client loaded');
    console.log('');
    
    console.log('Testing database query...');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    });
    
    console.log('✅ Query successful!');
    console.log('Users found:', users.length);
    users.forEach(u => console.log('  -', u.email, '('+u.role+')'));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPrisma();
