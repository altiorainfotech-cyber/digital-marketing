/**
 * Fix Asset Visibility Script
 * 
 * This script will update all ADMIN_ONLY assets to COMPANY visibility
 * so that users in the same company can see them.
 */

import prisma from '../lib/prisma';

async function main() {
  console.log('🔧 Fixing asset visibility...\n');

  // Get all ADMIN_ONLY assets
  const adminOnlyAssets = await prisma.asset.findMany({
    where: {
      visibility: 'ADMIN_ONLY',
    },
    include: {
      uploader: {
        select: {
          name: true,
          email: true,
        },
      },
      Company: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`📊 Found ${adminOnlyAssets.length} ADMIN_ONLY assets\n`);

  if (adminOnlyAssets.length === 0) {
    console.log('✅ No assets to fix!');
    return;
  }

  console.log('🔄 Updating visibility to COMPANY...\n');

  for (const asset of adminOnlyAssets) {
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        visibility: 'COMPANY',
      },
    });

    console.log(`✅ Updated: ${asset.title}`);
    console.log(`   Uploader: ${asset.uploader.name}`);
    console.log(`   Company: ${asset.Company?.name || 'None'}`);
    console.log(`   Status: ${asset.status}`);
    console.log(`   New Visibility: COMPANY`);
    console.log('');
  }

  console.log(`\n✅ Successfully updated ${adminOnlyAssets.length} assets!`);
  console.log('\n💡 Now all users in the same company can see these assets.');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
