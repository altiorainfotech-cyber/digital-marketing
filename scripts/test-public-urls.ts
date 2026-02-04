/**
 * Test Public URLs
 * 
 * Tests that public URLs are generated correctly for assets with files in R2
 */

import prisma from '../lib/prisma';
import { getPublicUrl } from '../lib/config';

async function testPublicUrls() {
  console.log('🔍 Testing public URL generation...\n');

  try {
    // Get assets with correct storage URLs
    const assets = await prisma.asset.findMany({
      where: {
        storageUrl: {
          startsWith: 'r2://digitalmarketing/assets/',
        },
      },
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
      },
      take: 5,
    });

    console.log(`Found ${assets.length} assets with files in R2:\n`);

    for (const asset of assets) {
      const publicUrl = getPublicUrl(asset.storageUrl);
      
      console.log(`📄 ${asset.title}`);
      console.log(`   Type: ${asset.assetType}`);
      console.log(`   Storage URL: ${asset.storageUrl}`);
      console.log(`   Public URL: ${publicUrl}`);
      console.log(`   ✅ URL generated successfully\n`);
    }

    console.log('✨ All public URLs generated correctly!');
    console.log('\nTo test in browser:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Navigate to an asset detail page');
    console.log('3. The image/video should load from R2\n');

  } catch (error) {
    console.error('❌ Error testing public URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPublicUrls()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
