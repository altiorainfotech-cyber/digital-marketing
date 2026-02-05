/**
 * Fix Video Storage URL
 * Updates the storage URL for the broken video asset
 */

import prisma from '../lib/prisma';

async function fixVideoStorageUrl() {
  const assetId = 'cml99q18i000mi6ouq1qzjog1';
  const correctStorageUrl = 'r2://digitalmarketing/assets/cml99q18i000mi6ouq1qzjog1/1770284566256-Video_Recreation_Without_Text.mp4';
  
  try {
    console.log('🔧 Fixing storage URL for asset:', assetId);
    
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        storageUrl: true,
      },
    });

    if (!asset) {
      console.log('❌ Asset not found');
      return;
    }

    console.log('\n📍 Current storage URL:', asset.storageUrl);
    console.log('📍 Correct storage URL:', correctStorageUrl);
    
    // Update the storage URL
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        storageUrl: correctStorageUrl,
      },
    });

    console.log('\n✅ Storage URL updated successfully!');
    
    // Verify the update
    const updatedAsset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { storageUrl: true },
    });
    
    console.log('✅ Verified new storage URL:', updatedAsset?.storageUrl);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixVideoStorageUrl();
