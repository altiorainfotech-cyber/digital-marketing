/**
 * Fix broken asset - mark as failed or delete
 * 
 * Usage: npx tsx scripts/fix-broken-asset.ts
 */

import prisma from '../lib/prisma';
import { AssetStatus } from '@/app/generated/prisma';

const assetId = 'cml9epott0014i6oum49iu3wg';

async function fixBrokenAsset() {
  console.log('🔧 Fixing broken asset...\n');

  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      console.log('❌ Asset not found');
      return;
    }

    console.log('Asset:', asset.title);
    console.log('Status:', asset.status);
    console.log('');

    // Option 1: Mark as rejected with reason
    console.log('Option 1: Mark as REJECTED (keeps record for audit)');
    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: AssetStatus.REJECTED,
        rejectionReason: 'Upload failed - file not found in storage. Please re-upload.',
        rejectedAt: new Date(),
      },
    });

    console.log('✅ Asset marked as REJECTED');
    console.log('');
    console.log('The asset will now show as rejected with a message to re-upload.');
    console.log('User can see the rejection reason and upload again.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Notify the uploader (meenakshi) about the failed upload');
    console.log('  2. Ask them to re-upload the file');
    console.log('  3. Ensure CORS is configured on R2 bucket');

    // Option 2: Delete completely (uncomment if preferred)
    // await prisma.asset.delete({
    //   where: { id: assetId },
    // });
    // console.log('✅ Asset deleted from database');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixBrokenAsset();
