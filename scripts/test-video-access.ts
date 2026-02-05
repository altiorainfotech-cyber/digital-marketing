import prisma from '../lib/prisma';

async function testVideoAccess() {
  try {
    console.log('Testing video access...\n');
    
    const videoAssetId = 'cml96cni70000i6ouw6r79uhx';
    
    // Get the asset
    const asset = await prisma.asset.findUnique({
      where: { id: videoAssetId },
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
        mimeType: true,
        fileSize: true,
      },
    });
    
    if (!asset) {
      console.log('❌ Asset not found');
      return;
    }
    
    console.log('Asset Details:');
    console.log('- ID:', asset.id);
    console.log('- Title:', asset.title);
    console.log('- Type:', asset.assetType);
    console.log('- Storage URL:', asset.storageUrl);
    console.log('- MIME Type:', asset.mimeType);
    console.log('- File Size:', asset.fileSize ? `${(asset.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown');
    console.log('');
    
    // Check if R2_PUBLIC_URL is configured
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
      console.log('⚠️  R2_PUBLIC_URL is not configured in .env');
      console.log('   Videos cannot be previewed without this setting');
      return;
    }
    
    console.log('✅ R2_PUBLIC_URL configured:', publicUrl);
    
    // Construct the public URL
    const videoPublicUrl = asset.storageUrl.replace(
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/`,
      `${publicUrl}/`
    );
    
    console.log('');
    console.log('Public URL:', videoPublicUrl);
    console.log('');
    console.log('To test if the video is accessible:');
    console.log('1. Open this URL in your browser:', videoPublicUrl);
    console.log('2. Or run: curl -I', videoPublicUrl);
    console.log('');
    console.log('Common issues:');
    console.log('- R2 bucket public access not enabled');
    console.log('- CORS not properly configured');
    console.log('- Video file was not uploaded successfully');
    console.log('- Wrong R2_PUBLIC_URL in .env');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVideoAccess();
