/**
 * Fix Image Storage URL
 * Updates the storage URL for the broken image asset
 */

import prisma from '../lib/prisma';

async function fixImageStorageUrl() {
  const assetId = 'cml9dtasy000si6ou0onte0zx';
  const correctStorageUrl = 'r2://digitalmarketing/assets/cml9dtasy000si6ou0onte0zx/1770291437071-BarnEggs_Miniature_Feed.png';
  
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
    
    // Test accessibility
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (publicUrl) {
      const match = correctStorageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
      const key = match ? match[1] : '';
      const fullUrl = `${publicUrl}/${key}`;
      
      console.log('\n🔍 Testing image accessibility...');
      console.log('🌐 Public URL:', fullUrl);
      
      const response = await fetch(fullUrl, { method: 'HEAD' });
      console.log('📊 Status:', response.status);
      
      if (response.ok) {
        console.log('✅ Image is now accessible!');
      } else {
        console.log('❌ Image still not accessible');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixImageStorageUrl();
