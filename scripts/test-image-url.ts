/**
 * Test if a specific image URL is accessible
 * 
 * Usage: npx tsx scripts/test-image-url.ts
 */

const imageUrl = 'https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/cml9epott0014i6oum49iu3wg/1770292948151-Gemini_Generated_Image_gmpomugmpomugmpo.png';

async function testImageUrl() {
  console.log('🔍 Testing image URL accessibility...\n');
  console.log('URL:', imageUrl);
  console.log('');

  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD', // Just check headers, don't download the whole image
    });

    console.log('Status:', response.status, response.statusText);
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS: Image is accessible!');
      console.log('');
      console.log('Headers:');
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
    } else if (response.status === 403) {
      console.log('❌ ERROR: 403 Forbidden');
      console.log('');
      console.log('This means:');
      console.log('  - The R2 bucket exists');
      console.log('  - But public access is NOT enabled');
      console.log('');
      console.log('Solution:');
      console.log('  1. Go to Cloudflare Dashboard > R2');
      console.log('  2. Click on "digitalmarketing" bucket');
      console.log('  3. Go to Settings tab');
      console.log('  4. Enable "Public Access" or "R2.dev subdomain"');
    } else if (response.status === 404) {
      console.log('❌ ERROR: 404 Not Found');
      console.log('');
      console.log('This means:');
      console.log('  - The file does not exist at this path in R2');
      console.log('  - Or the path is incorrect');
      console.log('');
      console.log('Solution:');
      console.log('  1. Run: npx tsx scripts/list-r2-files.ts');
      console.log('  2. Check if the file exists in R2');
      console.log('  3. Verify the storage URL in your database');
    } else {
      console.log('❌ ERROR: Unexpected status code');
      console.log('');
      console.log('Response:', await response.text());
    }
  } catch (error: any) {
    console.log('❌ ERROR: Failed to fetch image');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    console.log('This could mean:');
    console.log('  - Network connectivity issue');
    console.log('  - DNS resolution problem');
    console.log('  - CORS blocking the request (if running in browser)');
  }
}

testImageUrl();
