const bcrypt = require('bcryptjs');
const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyPassword() {
  const email = process.env.TEST_EMAIL || process.argv[2];
  
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage:');
    console.log('  node scripts/verify-password.js <email>');
    console.log('\nOr set environment variable:');
    console.log('  TEST_EMAIL=admin@example.com node scripts/verify-password.js');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Fetching user from database...\n');
    
    const result = await pool.query(
      'SELECT email, name, role, password FROM "User" WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Password hash: ${user.password.substring(0, 30)}...`);
    console.log('');
    
    // Test common passwords
    const passwordsToTest = [
      'password',
      'Password123',
      'admin123',
      'Admin123',
    ];
    
    console.log('Testing passwords...\n');
    
    for (const pwd of passwordsToTest) {
      const isValid = await bcrypt.compare(pwd, user.password);
      if (isValid) {
        console.log(`✅ FOUND WORKING PASSWORD: "${pwd}"`);
        console.log('');
        return;
      } else {
        console.log(`❌ "${pwd}" - incorrect`);
      }
    }
    
    console.log('\n❌ None of the tested passwords work');
    console.log('\nYou may need to reset the password using:');
    console.log(`  npx tsx scripts/create-admin-direct.ts ${email} <new-password> Admin`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyPassword();
