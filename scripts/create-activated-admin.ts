import { PrismaClient } from '../app/generated/prisma';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load .env file
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env:', result.error);
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function createActivatedAdmin() {
  try {
    // Get credentials from environment variables or command line arguments
    const email = process.env.ADMIN_EMAIL || process.argv[2];
    const password = process.env.ADMIN_PASSWORD || process.argv[3];
    const name = process.env.ADMIN_NAME || process.argv[4] || 'Admin User';

    if (!email || !password) {
      console.error('❌ Error: Email and password are required');
      console.log('\nUsage:');
      console.log('  npx tsx scripts/create-activated-admin.ts <email> <password> [name]');
      console.log('\nOr set environment variables:');
      console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npx tsx scripts/create-activated-admin.ts');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to be activated
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          isActivated: true,
          activatedAt: new Date(),
          activationCode: null,
          activationCodeExpiresAt: null,
        },
      });

      console.log('\n✅ User updated successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role:', updatedUser.role);
      console.log('Activated:', updatedUser.isActivated);
    } else {
      // Create new activated user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          isActivated: true,
          activatedAt: new Date(),
        },
      });

      console.log('\n✅ Admin user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role:', user.role);
      console.log('Activated:', user.isActivated);
    }

    console.log('\n🔗 You can now login at: http://localhost:3000/auth/signin');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createActivatedAdmin();
