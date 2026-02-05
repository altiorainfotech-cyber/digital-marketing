/**
 * Check a specific asset in the database and verify if file exists in R2
 */

import prisma from '../lib/prisma';

const assetId = 'cml9epott0014i6oum49iu3wg';

async function checkAsset() {
  console.log('🔍 Checking asset in database...\n');

  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        uploader: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!asset) {
      console.log('❌ Asset not found in database');
      return;
    }

    console.log('✅ Asset found in database:');
    console.log('');
    console.log('ID:', asset.id);
    console.log('Title:', asset.title);
    console.log('Type:', asset.assetType);
    console.log('Status:', asset.status);
    console.log('Storage URL:', asset.storageUrl);
    console.log('Uploader:', asset.uploader?.name);
    console.log('Uploaded:', asset.uploadedAt);
    console.log('');

    // Extract the R2 key from storage URL
    const match = asset.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (match) {
      const key = match[1];
      console.log('R2 Key:', key);
      console.log('');
      console.log('Expected public URL:');
      console.log(`https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/${key}`);
      console.log('');
      console.log('⚠️  This file does NOT exist in R2 bucket!');
      console.log('');
      console.log('Possible reasons:');
      console.log('  1. Upload failed but database record was created');
      console.log('  2. File was deleted from R2 but not from database');
      console.log('  3. Upload is still in progress');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Re-upload the asset');
      console.log('  2. Delete this asset record from database');
      console.log('  3. Mark asset as broken/failed');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAsset();
