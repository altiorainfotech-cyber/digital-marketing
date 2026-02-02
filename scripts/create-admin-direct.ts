/**
 * Direct Admin User Creation Script
 * Uses direct SQL to bypass adapter issues
 * 
 * Usage:
 *   npx tsx scripts/create-admin-direct.ts
 */

import { Client } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createAdminUser() {
  // Get credentials from environment variables or command line arguments
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const name = process.env.ADMIN_NAME || process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/create-admin-direct.ts <email> <password> [name]');
    console.log('\nOr set environment variables:');
    console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npx tsx scripts/create-admin-direct.ts');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id, email, name, role FROM "User" WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists:');
      console.log(`  Email: ${existingUser.rows[0].email}`);
      console.log(`  Name: ${existingUser.rows[0].name}`);
      console.log(`  Role: ${existingUser.rows[0].role}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Create user
    const result = await client.query(
      `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, 'ADMIN']
    );

    const user = result.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);

    // Create audit log
    await client.query(
      `INSERT INTO "AuditLog" (id, "userId", action, "resourceType", "resourceId", metadata, "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [
        user.id,
        'CREATE',
        'USER',
        user.id,
        JSON.stringify({
          role: 'ADMIN',
          createdBy: 'system',
          source: 'create-admin-direct script',
        }),
      ]
    );

    console.log('✅ Audit log created');
    console.log('');
    console.log('You can now log in with these credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();
