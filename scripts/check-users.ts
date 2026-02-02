import { PrismaClient } from '../app/generated/prisma';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import dotenv from 'dotenv';
import path from 'path';

const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment loaded:', envResult.parsed ? 'Yes' : 'No');
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

if (envResult.parsed?.DATABASE_URL) {
  try {
    const url = new URL(envResult.parsed.DATABASE_URL);
    process.env.PGHOST = url.hostname;
    process.env.PGUSER = url.username;
    process.env.PGPASSWORD = url.password;
    process.env.PGDATABASE = url.pathname.slice(1);
    process.env.PGPORT = url.port || '5432';
    
    console.log('Parsed DATABASE_URL into PG* variables');
  } catch (e) {
    console.error('Error parsing DATABASE_URL:', e);
  }
}

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
console.log('Connection string:', connectionString ? `Found (${connectionString.length} chars)` : 'NOT FOUND');

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });
    
    console.log('Users in database:', users.length);
    users.forEach(user => {
      console.log('---');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      if (user.password) {
        console.log('Password hash starts with:', user.password.substring(0, 10));
        console.log('Password hash length:', user.password.length);
      } else {
        console.log('Password: Not set (activation pending)');
      }
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
