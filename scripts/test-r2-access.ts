/**
 * Test R2 Bucket Access and CORS Configuration
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testR2Access() {
  console.log('=== R2 Configuration Test ===\n');

  // Check environment variables
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  const r2BucketName = process.env.R2_BUCKET_NAME;
  const r2AccountId = process.env.R2_ACCOUNT_ID;

  console.log('Environment Variables:');
  console.log(`  R2_PUBLIC_URL: ${r2PublicUrl || '❌ NOT SET'}`);
  console.log(`  R2_BUCKET_NAME: ${r2BucketName || '❌ NOT SET'}`);
  console.log(`  R2_ACCOUNT_ID: ${r2AccountId || '❌ NOT SET'}`);
  console.log('');

  if (!r2PublicUrl) {
    console.error('❌ R2_PUBLIC_URL is not set!');
    console.log('\nPlease set it in your .env file:');
    console.log('R2_PUBLIC_URL="https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev"');
    process.exit(1);
  }

  // Test public URL access
  console.log('Testing R2 Public URL Access...');
  try {
    const response = await fetch(r2PublicUrl);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200 || response.status === 403 || response.status === 404) {
      console.log('  ✅ R2 bucket is reachable');
    } else {
      console.log('  ⚠️  Unexpected status code');
    }

    // Check CORS headers
    console.log('\nCORS Headers:');
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-expose-headers',
    ];

    let hasCors = false;
    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        console.log(`  ✅ ${header}: ${value}`);
        hasCors = true;
      }
    });

    if (!hasCors) {
      console.log('  ⚠️  No CORS headers found - you may need to configure CORS');
    }

  } catch (error) {
    console.error('  ❌ Failed to reach R2 bucket:', error);
  }

  // Test with a sample asset path
  console.log('\nTesting Sample Asset URL...');
  const samplePath = `${r2PublicUrl}/assets/test.jpg`;
  console.log(`  URL: ${samplePath}`);
  
  try {
    const response = await fetch(samplePath, { method: 'HEAD' });
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('  ℹ️  File not found (expected if no test file exists)');
    } else if (response.status === 200) {
      console.log('  ✅ File accessible');
    } else if (response.status === 403) {
      console.log('  ❌ Access forbidden - check bucket permissions');
    }
  } catch (error) {
    console.error('  ❌ Error:', error);
  }

  console.log('\n=== Recommendations ===\n');
  
  console.log('1. Ensure R2 bucket has public access enabled:');
  console.log('   - Go to Cloudflare Dashboard → R2 → Your Bucket');
  console.log('   - Enable "Public Development URL" or set up a custom domain\n');
  
  console.log('2. Verify CORS configuration is applied:');
  console.log('   - The CORS policy should allow your domain');
  console.log('   - Current allowed origins in r2-cors-config.json:');
  console.log('     • http://localhost:3000');
  console.log('     • http://localhost:3001');
  console.log('     • https://digital-marketing-ten-alpha.vercel.app\n');
  
  console.log('3. If using Vercel, ensure R2_PUBLIC_URL is set in environment variables');
  console.log('   - Go to Vercel Dashboard → Settings → Environment Variables');
  console.log('   - Add R2_PUBLIC_URL with the public URL\n');
}

testR2Access();
