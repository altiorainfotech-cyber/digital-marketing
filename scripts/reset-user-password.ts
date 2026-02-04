/**
 * Reset User Password Script
 * 
 * Usage:
 *   npx tsx scripts/reset-user-password.ts <email> <new-password>
 */

import { Client } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function resetPassword() {
  const email = process.argv[2] || 'Amish@altiorainfotech.com';
  const newPassword = process.argv[3] || 'NewPassword123!';

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
    const userResult = await client.query(
      'SELECT id, email, name, role FROM "User" WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password hashed');

    // Update password
    await client.query(
      'UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE email = $2',
      [hashedPassword, email]
    );

    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('New credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
    console.log('');
    console.log('⚠️  Please save this password securely and change it after first login.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetPassword();
