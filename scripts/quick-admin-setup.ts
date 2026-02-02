/**
 * Quick Admin Setup Script
 * 
 * This script checks if an admin user exists and creates one if needed.
 * It's designed to work around Neon connection issues by using the same
 * Prisma client setup as the main application.
 */

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function quickAdminSetup() {
  console.log('\n==========================================');
  console.log('Quick Admin Setup');
  console.log('==========================================\n');

  try {
    // Check if any admin users exist
    console.log('Checking for existing admin users...');
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    console.log(`Found ${adminCount} admin user(s)\n`);

    if (adminCount > 0) {
      console.log('✅ Admin user(s) already exist!');
      console.log('');
      
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      console.log('Existing admin users:');
      admins.forEach((admin, index) => {
        console.log(`\n${index + 1}. ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Created: ${admin.createdAt.toISOString()}`);
      });
      console.log('');
      console.log('You can sign in with any of these accounts.');
      console.log('');
      return;
    }

    // No admin users found - create a default one
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
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('User details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log('');
    console.log('Sign in credentials:');
    console.log(`  Email: ${defaultAdmin.email}`);
    console.log(`  Password: ${defaultAdmin.password}`);
    console.log('');
    console.log('⚠️  Remember to change the password after first login!');
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
          source: 'quick-admin-setup script',
        },
      },
    });

    console.log('✅ Audit log created');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
quickAdminSetup()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
