/**
 * Fix Storage URLs Script
 * 
 * Converts old Cloudflare Images/Stream URLs to R2 URLs
 * - images://account-id/asset-id -> r2://bucket-name/images/asset-id
 * - stream://account-id/asset-id -> r2://bucket-name/videos/asset-id
 */

import prisma from '../lib/prisma';

async function fixStorageUrls() {
  console.log('🔍 Checking for assets with old storage URL formats...\n');

  try {
    // Find all assets
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
      },
    });

    console.log(`Found ${assets.length} total assets\n`);

    const bucketName = process.env.R2_BUCKET_NAME || 'digitalmarketing';
    let updatedCount = 0;

    for (const asset of assets) {
      let newStorageUrl: string | null = null;

      // Convert images:// URLs (handles both images:///id and images://account/id formats)
      if (asset.storageUrl.startsWith('images://')) {
        // Extract the asset ID (last part after the last /)
        const parts = asset.storageUrl.split('/');
        const assetId = parts[parts.length - 1];
        if (assetId) {
          newStorageUrl = `r2://${bucketName}/images/${assetId}`;
        }
      }
      // Convert stream:// URLs (handles both stream:///id and stream://account/id formats)
      else if (asset.storageUrl.startsWith('stream://')) {
        // Extract the asset ID (last part after the last /)
        const parts = asset.storageUrl.split('/');
        const assetId = parts[parts.length - 1];
        if (assetId) {
          newStorageUrl = `r2://${bucketName}/videos/${assetId}`;
        }
      }

      // Update if conversion was successful
      if (newStorageUrl) {
        console.log(`📝 Updating asset: ${asset.title}`);
        console.log(`   Old URL: ${asset.storageUrl}`);
        console.log(`   New URL: ${newStorageUrl}`);

        await prisma.asset.update({
          where: { id: asset.id },
          data: { storageUrl: newStorageUrl },
        });

        updatedCount++;
        console.log(`   ✅ Updated\n`);
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Total assets: ${assets.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Unchanged: ${assets.length - updatedCount}`);

  } catch (error) {
    console.error('❌ Error fixing storage URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixStorageUrls()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
