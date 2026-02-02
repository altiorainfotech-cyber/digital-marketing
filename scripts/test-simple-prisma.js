require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50));

async function test() {
  try {
    const { prisma } = require('../lib/prisma-simple.ts');
    console.log('Prisma loaded');
    
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users:', users.length);
    users.forEach(u => console.log('  -', u.email));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
