/**
 * Fixed Admin User Creation Script
 * 
 * This script works around Neon Pool connection issues by setting PG* environment variables.
 */

import { PrismaClient } from '../app/generated/prisma';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';
import ws from 'ws';

// Configure Neon
neonConfig.webSocketConstructor = ws;

// Parse DATABASE_URL and set PG* environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

try {
  const url = new URL(DATABASE_URL);
  process.env.PGHOST = url.hostname;
  process.env.PGUSER = url.username;
  process.env.PGPASSWORD = url.password;
  process.env.PGDATABASE = url.pathname.slice(1);
  process.env.PGPORT = url.port || '5432';
  
  console.log('Database connection configured:');
  console.log('  Host:', process.env.PGHOST);
  console.log('  Database:', process.env.PGDATABASE);
  console.log('  User:', process.env.PGUSER);
  console.log('');
} catch (e) {
  console.error('Error parsing DATABASE_URL:', e);
  process.exit(1);
}

async function createAdmin() {
  console.log('==========================================');
  console.log('Admin User Creation');
  console.log('==========================================\n');

  // Create Prisma client with explicit connection string
  const adapter = new PrismaNeon({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // Check for existing admin
    console.log('Checking for existing admin users...');
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    console.log(`Found ${adminCount} admin user(s)\n`);

    if (adminCount > 0) {
      console.log('✅ Admin user(s) already exist!');
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      console.log('\nExisting admin users:');
      admins.forEach((admin, index) => {
        console.log(`\n${index + 1}. ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   ID: ${admin.id}`);
      });
      console.log('\nYou can sign in with any of these accounts.\n');
      return;
    }

    // Create default admin - get credentials from environment or prompt
    console.log('⚠️  No admin users found. Creating default admin...\n');

    const defaultAdmin = {
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
    };

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('⚠️  WARNING: Using default credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables for custom credentials.\n');
    }

    console.log('Creating admin with:');
    console.log(`  Name: ${defaultAdmin.name}`);
    console.log(`  Email: ${defaultAdmin.email}`);
    console.log(`  Password: ${defaultAdmin.password}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

    const user = await prisma.user.create({
      data: {
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('Sign in credentials:');
    console.log(`  Email: ${defaultAdmin.email}`);
    console.log(`  Password: ${defaultAdmin.password}`);
    console.log('\n⚠️  Remember to change the password after first login!\n');

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
          source: 'create-admin-fixed script',
        },
      },
    });

    console.log('✅ Audit log created\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    
  }
}

createAdmin()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
