/**
 * Simple Admin User Creation Script
 * Uses direct Prisma connection (no adapter)
 * 
 * Usage:
 *   npx tsx scripts/create-admin-simple.ts <email> <password> <name>
 */

import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function createAdminUser() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password || !name) {
    console.error('Usage: npx tsx scripts/create-admin-simple.ts <email> <password> <name>');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Create Prisma client without adapter (direct connection)
  const prisma = new PrismaClient();

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
          source: 'create-admin-simple script',
        },
      },
    });

    console.log('✅ Audit log created');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
