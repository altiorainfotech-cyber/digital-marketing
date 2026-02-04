/**
 * Check Specific Asset
 */

import prisma from '../lib/prisma';

async function checkAsset() {
  const assetId = 'cml6j2gd3000804ie69dym61g';
  
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      title: true,
      assetType: true,
      storageUrl: true,
      uploadedAt: true,
    },
  });

  console.log('Asset details:');
  console.log(JSON.stringify(asset, null, 2));

  await prisma.$disconnect();
}

checkAsset();
