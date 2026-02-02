/**
 * Check and Clean Assets Script
 * 
 * This script will:
 * 1. Show all assets in the database
 * 2. Remove dummy/demo assets
 * 3. Show visibility settings for each asset
 */

import prisma from '../lib/prisma';

async function main() {
  console.log('🔍 Checking assets in database...\n');

  // Get all assets
  const assets = await prisma.asset.findMany({
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      Company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  console.log(`📊 Total assets found: ${assets.length}\n`);

  if (assets.length === 0) {
    console.log('✅ No assets in database. Database is clean.');
    return;
  }

  // Display all assets
  console.log('📋 Current Assets:\n');
  assets.forEach((asset, index) => {
    console.log(`${index + 1}. ${asset.title}`);
    console.log(`   ID: ${asset.id}`);
    console.log(`   Type: ${asset.assetType}`);
    console.log(`   Status: ${asset.status}`);
    console.log(`   Visibility: ${asset.visibility}`);
    console.log(`   Upload Type: ${asset.uploadType}`);
    console.log(`   Uploader: ${asset.uploader.name} (${asset.uploader.email})`);
    console.log(`   Company: ${asset.Company?.name || 'None'}`);
    console.log(`   Uploaded: ${asset.uploadedAt.toLocaleString()}`);
    console.log(`   Storage URL: ${asset.storageUrl}`);
    console.log('');
  });

  // Identify potential dummy/demo assets
  const dummyKeywords = ['test', 'demo', 'dummy', 'sample', 'example', 'placeholder'];
  const potentialDummyAssets = assets.filter(asset => {
    const titleLower = asset.title.toLowerCase();
    const descLower = (asset.description || '').toLowerCase();
    return dummyKeywords.some(keyword => 
      titleLower.includes(keyword) || descLower.includes(keyword)
    );
  });

  if (potentialDummyAssets.length > 0) {
    console.log(`\n🗑️  Found ${potentialDummyAssets.length} potential dummy/demo assets:\n`);
    potentialDummyAssets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.title} (ID: ${asset.id})`);
    });

    console.log('\n⚠️  To delete these assets, uncomment the deletion code below and run again.\n');
    
    // UNCOMMENT THE LINES BELOW TO DELETE DUMMY ASSETS
    // console.log('🗑️  Deleting dummy assets...');
    // for (const asset of potentialDummyAssets) {
    //   await prisma.asset.delete({
    //     where: { id: asset.id },
    //   });
    //   console.log(`   ✅ Deleted: ${asset.title}`);
    // }
    // console.log('\n✅ Dummy assets deleted successfully!');
  } else {
    console.log('\n✅ No obvious dummy/demo assets found.');
  }

  // Check for assets with problematic visibility settings
  console.log('\n🔒 Checking visibility settings...\n');
  
  const uploaderOnlyAssets = assets.filter(a => a.visibility === 'UPLOADER_ONLY');
  const adminOnlyAssets = assets.filter(a => a.visibility === 'ADMIN_ONLY');
  const pendingAssets = assets.filter(a => a.status === 'PENDING_REVIEW');
  const draftAssets = assets.filter(a => a.status === 'DRAFT');

  console.log(`   UPLOADER_ONLY assets: ${uploaderOnlyAssets.length}`);
  console.log(`   ADMIN_ONLY assets: ${adminOnlyAssets.length}`);
  console.log(`   PENDING_REVIEW assets: ${pendingAssets.length}`);
  console.log(`   DRAFT assets: ${draftAssets.length}`);

  console.log('\n💡 Visibility Rules:');
  console.log('   - UPLOADER_ONLY: Only the uploader can see');
  console.log('   - ADMIN_ONLY: Only admins can see');
  console.log('   - COMPANY: All users in the same company can see');
  console.log('   - PENDING_REVIEW: Only admins can see (waiting for approval)');
  console.log('   - DRAFT: Only the uploader can see');

  console.log('\n✅ Asset check complete!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
