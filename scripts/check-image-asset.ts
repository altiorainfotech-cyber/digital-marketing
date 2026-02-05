/**
 * Check Image Asset - Diagnose image loading issue
 */

import prisma from '../lib/prisma';

async function checkImageAsset() {
  const assetId = 'cml9dtasy000si6ou0onte0zx'; // From the error URL
  
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
        status: true,
        uploadedAt: true,
        fileSize: true,
        mimeType: true,
      },
    });

    if (!asset) {
      console.log('❌ Asset not found in database');
      return;
    }

    console.log('✅ Asset found in database:');
    console.log(JSON.stringify(asset, null, 2));
    console.log('\n📍 Storage URL:', asset.storageUrl);
    
    // Check if R2_PUBLIC_URL is configured
    const publicUrl = process.env.R2_PUBLIC_URL;
    console.log('\n🔧 R2_PUBLIC_URL:', publicUrl || '❌ NOT CONFIGURED');
    
    if (publicUrl && asset.storageUrl) {
      // Extract the key from r2://bucket-name/key
      const match = asset.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
      const key = match ? match[1] : asset.storageUrl;
      const fullUrl = `${publicUrl}/${key}`;
      console.log('🌐 Full public URL:', fullUrl);
      
      // Try to fetch the image
      console.log('\n🔍 Testing image accessibility...');
      try {
        const response = await fetch(fullUrl, { method: 'HEAD' });
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          console.log('✅ Image is accessible!');
        } else {
          console.log('❌ Image is not accessible - Status:', response.status);
        }
      } catch (fetchError: any) {
        console.log('❌ Failed to fetch image:', fetchError.message);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageAsset();
