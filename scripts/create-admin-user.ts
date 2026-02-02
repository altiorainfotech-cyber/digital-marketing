/**
 * Create Initial Admin User Script
 * 
 * This script creates the first admin user in the production database.
 * 
 * Usage:
 *   export DATABASE_URL='your-production-database-url'
 *   npx tsx scripts/create-admin-user.ts
 */

import { PrismaClient } from '../app/generated/prisma';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';
import ws from 'ws';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (envResult.parsed?.DATABASE_URL) {
  // Parse DATABASE_URL and set individual PG* variables for Neon
  try {
    const url = new URL(envResult.parsed.DATABASE_URL);
    process.env.PGHOST = url.hostname;
    process.env.PGUSER = url.username;
    process.env.PGPASSWORD = url.password;
    process.env.PGDATABASE = url.pathname.slice(1); // Remove leading slash
    process.env.PGPORT = url.port || '5432';
    
    console.log('Parsed DATABASE_URL into PG* variables');
    console.log('PGHOST:', process.env.PGHOST);
    console.log('PGUSER:', process.env.PGUSER);
    console.log('PGDATABASE:', process.env.PGDATABASE);
  } catch (e) {
    console.error('Error parsing DATABASE_URL:', e);
  }
}

// Configure Neon for WebSocket support
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Create Prisma client with adapter
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connection string in createPrismaClient:', connectionString ? `Found (${connectionString.length} chars)` : 'NOT FOUND');
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // The Neon Pool sometimes ignores the connectionString parameter
  // and looks for PGHOST, PGUSER, PGDATABASE, PGPASSWORD, etc.
  // So we need to set DATABASE_URL in the environment before creating the Pool
  console.log('Creating adapter...');
  const adapter = new PrismaNeon({ connectionString });
  console.log('Adapter created, PrismaClient next...');
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdminUser() {
  console.log('\n==========================================');
  console.log('Create Initial Admin User');
  console.log('==========================================\n');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('⚠️  Warning: An admin user already exists:');
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Name: ${existingAdmin.name}`);
    console.log('');
    
    const confirm = await question('Create another admin user? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Aborted.');
      rl.close();
      await prisma.$disconnect();
      
      process.exit(0);
    }
    console.log('');
  }

  // Get user details
  const name = await question('Admin name: ');
  if (!name.trim()) {
    console.log('❌ Error: Name is required');
    rl.close();
    await prisma.$disconnect();
    
    process.exit(1);
  }

  const email = await question('Admin email: ');
  if (!email.trim() || !email.includes('@')) {
    console.log('❌ Error: Valid email is required');
    rl.close();
    await prisma.$disconnect();
    
    process.exit(1);
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('❌ Error: User with this email already exists');
    rl.close();
    await prisma.$disconnect();
    
    process.exit(1);
  }

  const password = await question('Admin password (min 8 characters): ');
  if (!password || password.length < 8) {
    console.log('❌ Error: Password must be at least 8 characters');
    rl.close();
    await prisma.$disconnect();
    
    process.exit(1);
  }

  const confirmPassword = await question('Confirm password: ');
  if (password !== confirmPassword) {
    console.log('❌ Error: Passwords do not match');
    rl.close();
    await prisma.$disconnect();
    
    process.exit(1);
  }

  console.log('');
  console.log('Creating admin user...');

  try {
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

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('User details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log('');
    console.log('You can now log in with these credentials.');
    console.log('');

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
          source: 'create-admin-user script',
        },
      },
    });

    console.log('✅ Audit log created');
    console.log('');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    rl.close();
    await prisma.$disconnect();
    
    process.exit(1);
  }

  rl.close();
  await prisma.$disconnect();
  
}

// Run the script
createAdminUser()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
