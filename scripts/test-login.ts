/**
 * Test login functionality
 * Checks if admin user exists and can authenticate
 */

import { prisma } from '../lib/prisma';
import { compare } from 'bcryptjs';

async function testLogin() {
  const testEmail = process.env.TEST_EMAIL || process.argv[2];
  const testPassword = process.env.TEST_PASSWORD || process.argv[3];

  if (!testEmail || !testPassword) {
    console.error('❌ Error: Email and password are required');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/test-login.ts <email> <password>');
    console.log('\nOr set environment variables:');
    console.log('  TEST_EMAIL=admin@example.com TEST_PASSWORD=yourpassword npx tsx scripts/test-login.ts');
    process.exit(1);
  }
  
  try {
    console.log('Testing login for:', testEmail);
    console.log('');
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log('');
      console.log('Available users:');
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          role: true,
        },
      });
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name}, ${u.role})`);
      });
      return;
    }
    
    console.log('✅ User found:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created: ${user.createdAt}`);
    
    if (!user.password) {
      console.log('❌ User has no password set (activation pending)');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
    console.log(`  Password length: ${user.password.length}`);
    console.log('');
    
    // Test password
    console.log(`Testing password: ${testPassword}`);
    const isValid = await compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect');
      console.log('');
      console.log('Trying other common passwords...');
      
      const commonPasswords = [
        'password',
        'Password123',
        'admin123',
        'Admin123',
      ];
      
      for (const pwd of commonPasswords) {
        const valid = await compare(pwd, user.password);
        if (valid) {
          console.log(`✅ Found working password: ${pwd}`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
