/**
 * Find Broken Storage URLs
 * Identifies assets with incorrect storage URL patterns
 */

import prisma from '../lib/prisma';

async function findBrokenStorageUrls() {
  try {
    console.log('🔍 Searching for assets with incorrect storage URLs...\n');
    
    // Find assets with the old pattern (videos/[id] or images/[id])
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { storageUrl: { contains: '/videos/' } },
          { storageUrl: { contains: '/images/' } },
        ],
      },
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
        status: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    if (assets.length === 0) {
      console.log('✅ No assets found with old storage URL pattern');
      return;
    }

    console.log(`Found ${assets.length} assets with potentially incorrect storage URLs:\n`);
    
    assets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.title}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   Type: ${asset.assetType}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   Storage URL: ${asset.storageUrl}`);
      console.log('');
    });
    
    console.log('\n💡 These assets may need their storage URLs updated to match the actual R2 file paths.');
    console.log('   Run list-r2-files.ts to see the actual file paths in R2.');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findBrokenStorageUrls();
