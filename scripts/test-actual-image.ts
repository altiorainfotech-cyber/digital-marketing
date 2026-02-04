/**
 * Test actual image access from R2
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testImageAccess() {
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  
  // Test URLs from actual assets
  const testUrls = [
    `${r2PublicUrl}/images/cml6j2gd3000804ie69dym61g`,
    `${r2PublicUrl}/images/cml6j02gu000004jjjqsban74`,
    `${r2PublicUrl}/assets/cml6gsw3h0000i3oujuclbgo0/1770115058264-2.png`,
  ];

  console.log('Testing actual image URLs from R2...\n');

  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Origin': 'https://digital-marketing-ten-alpha.vercel.app'
        }
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers.get('content-type') || 'N/A'}`);
      console.log(`  Content-Length: ${response.headers.get('content-length') || 'N/A'}`);
      console.log(`  CORS Allow-Origin: ${response.headers.get('access-control-allow-origin') || 'N/A'}`);
      
      if (response.status === 200) {
        console.log('  ✅ Image is accessible');
      } else if (response.status === 404) {
        console.log('  ❌ Image not found in R2 bucket');
      } else if (response.status === 403) {
        console.log('  ❌ Access forbidden');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
    console.log('');
  }

  console.log('\n=== Diagnosis ===\n');
  console.log('If images return 404:');
  console.log('  → Files may not have been uploaded to R2 correctly');
  console.log('  → Check the storage path format\n');
  
  console.log('If images return 403:');
  console.log('  → R2 bucket public access is not enabled');
  console.log('  → Enable "Public Development URL" in Cloudflare dashboard\n');
  
  console.log('If CORS headers are missing:');
  console.log('  → CORS configuration needs to be applied');
  console.log('  → Use Cloudflare dashboard to configure CORS\n');
}

testImageAccess();
