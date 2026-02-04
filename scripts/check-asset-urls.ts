/**
 * Check Asset URLs Script
 * 
 * Displays all asset storage URLs to understand the current format
 */

import prisma from '../lib/prisma';

async function checkAssetUrls() {
  console.log('🔍 Checking asset storage URLs...\n');

  try {
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: 10,
    });

    console.log(`Found ${assets.length} recent assets:\n`);

    for (const asset of assets) {
      console.log(`📄 ${asset.title}`);
      console.log(`   Type: ${asset.assetType}`);
      console.log(`   URL: ${asset.storageUrl}`);
      console.log(`   ID: ${asset.id}\n`);
    }

  } catch (error) {
    console.error('❌ Error checking asset URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAssetUrls()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
