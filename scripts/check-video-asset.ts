/**
 * Check Video Asset - Diagnose video loading issue
 */

import prisma from '../lib/prisma';

async function checkVideoAsset() {
  const assetId = 'cml99q18i000mi6ouq1qzjog1'; // From the error URL
  
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
    const bucketName = process.env.R2_BUCKET_NAME;
    console.log('\n🔧 R2_PUBLIC_URL:', publicUrl || '❌ NOT CONFIGURED');
    
    if (publicUrl && asset.storageUrl) {
      // Extract the key from r2://bucket-name/key
      const match = asset.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
      const key = match ? match[1] : asset.storageUrl;
      const fullUrl = `${publicUrl}/${key}`;
      console.log('🌐 Full public URL:', fullUrl);
      
      // Try to fetch the video
      console.log('\n🔍 Testing video accessibility...');
      try {
        const response = await fetch(fullUrl, { method: 'HEAD' });
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          console.log('✅ Video is accessible!');
        } else {
          console.log('❌ Video is not accessible - Status:', response.status);
        }
      } catch (fetchError: any) {
        console.log('❌ Failed to fetch video:', fetchError.message);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoAsset();
