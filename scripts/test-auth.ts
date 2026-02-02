import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testAuth() {
  console.log('Testing authentication setup...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
  console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'NOT SET');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('');
  
  // Test password hashing
  const testPassword = 'testpassword123';
  console.log('Testing bcrypt password hashing...');
  console.log('Test password:', testPassword);
  
  const hash = await bcrypt.hash(testPassword, 10);
  console.log('Generated hash:', hash);
  console.log('Hash length:', hash.length);
  console.log('');
  
  // Test password comparison
  const isValid = await bcrypt.compare(testPassword, hash);
  console.log('Password comparison (correct):', isValid);
  
  const isInvalid = await bcrypt.compare('wrongpassword', hash);
  console.log('Password comparison (incorrect):', isInvalid);
  console.log('');
  
  // Check if NEXTAUTH_SECRET is strong enough
  if (process.env.NEXTAUTH_SECRET) {
    const secret = process.env.NEXTAUTH_SECRET;
    console.log('NEXTAUTH_SECRET analysis:');
    console.log('- Length:', secret.length);
    console.log('- Is default value:', secret === 'your-secret-key-here-change-in-production');
    
    if (secret === 'your-secret-key-here-change-in-production') {
      console.log('⚠️  WARNING: Using default NEXTAUTH_SECRET! This should be changed in production.');
    }
  }
}

testAuth().catch(console.error);
