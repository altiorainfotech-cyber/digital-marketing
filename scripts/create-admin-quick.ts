/**
 * Quick Admin User Creation Script
 * 
 * Usage:
 *   npx tsx scripts/create-admin-quick.ts <email> <password> <name>
 */

import { PrismaClient } from '../app/generated/prisma';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';
import ws from 'ws';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env:', result.error);
} else {
  console.log('.env loaded successfully');
}

// Configure Neon for WebSocket support
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

async function createAdminUser() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password || !name) {
    console.error('Usage: npx tsx scripts/create-admin-quick.ts <email> <password> <name>');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  console.log('DATABASE_URL:', connectionString ? 'Found' : 'Not found');
  console.log('Connection string length:', connectionString?.length);
  console.log('First 50 chars:', connectionString?.substring(0, 50));
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Creating pool with connection string...');
  const adapter = new PrismaNeon({ connectionString: connectionString });
  console.log('Pool created');
  console.log('Adapter created');
  const prisma = new PrismaClient({ adapter });
  console.log('Prisma client created');

  console.log('Creating admin user...');

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('✅ User already exists:', email);
      await prisma.$disconnect();
      
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resourceType: 'USER',
        resourceId: user.id,
        metadata: {
          role: 'ADMIN',
          createdBy: 'system',
          source: 'create-admin-quick script',
        },
      },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    
  }
}

createAdminUser();
