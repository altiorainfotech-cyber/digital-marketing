/**
 * Cleanup Orphaned Assets
 * 
 * Removes assets that don't have corresponding files in R2
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import prisma from '../lib/prisma';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

async function cleanupOrphanedAssets() {
  console.log('🔍 Finding orphaned assets (assets without files in R2)...\n');

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'digitalmarketing';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('❌ Missing R2 configuration');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    // List all files in R2
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);
    const assetIdsInR2 = new Set<string>();

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (!obj.Key) continue;
        
        // Extract asset ID from path: assets/{asset-id}/{filename}
        const match = obj.Key.match(/^assets\/([^/]+)\//);
        if (match) {
          assetIdsInR2.add(match[1]);
        }
      }
    }

    console.log(`Found ${assetIdsInR2.size} assets with files in R2\n`);

    // Get all assets from database
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
        uploadedAt: true,
      },
    });

    console.log(`Found ${assets.length} assets in database\n`);

    // Find orphaned assets
    const orphanedAssets = assets.filter(asset => !assetIdsInR2.has(asset.id));

    if (orphanedAssets.length === 0) {
      console.log('✅ No orphaned assets found!\n');
      return;
    }

    console.log(`Found ${orphanedAssets.length} orphaned assets:\n`);

    for (const asset of orphanedAssets) {
      console.log(`📄 ${asset.title}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   Type: ${asset.assetType}`);
      console.log(`   Uploaded: ${asset.uploadedAt}`);
      console.log(`   URL: ${asset.storageUrl}\n`);
    }

    // Ask for confirmation (in a real scenario, you'd use readline or similar)
    console.log('⚠️  These assets will be DELETED from the database.');
    console.log('   Run with --confirm flag to proceed with deletion.\n');

    // Check for --confirm flag
    if (process.argv.includes('--confirm')) {
      console.log('🗑️  Deleting orphaned assets...\n');

      for (const asset of orphanedAssets) {
        await prisma.asset.delete({
          where: { id: asset.id },
        });
        console.log(`✅ Deleted: ${asset.title}`);
      }

      console.log(`\n✨ Cleanup complete! Deleted ${orphanedAssets.length} orphaned assets.`);
    } else {
      console.log('ℹ️  No assets were deleted. Run with --confirm to delete.');
    }

  } catch (error) {
    console.error('❌ Error cleaning up orphaned assets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedAssets()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
