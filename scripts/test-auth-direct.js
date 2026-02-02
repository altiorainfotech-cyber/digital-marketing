require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function testAuth() {
  const email = process.env.TEST_EMAIL || process.argv[2];

  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage:');
    console.log('  node scripts/test-auth-direct.js <email>');
    console.log('\nOr set environment variable:');
    console.log('  TEST_EMAIL=admin@example.com node scripts/test-auth-direct.js');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get the admin user
    const result = await pool.query(
      'SELECT id, email, name, password, role FROM "User" WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:', user.email);
    console.log('   Role:', user.role);
    console.log('   Password hash:', user.password.substring(0, 20) + '...');
    
    // Test common passwords
    const testPasswords = ['password', 'Password123', 'admin123', 'Admin123'];
    
    console.log('\nTesting passwords:');
    for (const pwd of testPasswords) {
      const isValid = await bcrypt.compare(pwd, user.password);
      console.log(`   "${pwd}": ${isValid ? '✅ MATCH' : '❌ no match'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAuth();
