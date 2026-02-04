/**
 * Fix Storage URLs with Actual File Paths
 * 
 * Maps assets to their actual files in R2 and updates storage URLs
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import prisma from '../lib/prisma';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

async function fixStorageUrlsWithFiles() {
  console.log('🔍 Fixing storage URLs with actual file paths...\n');

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

    if (!response.Contents || response.Contents.length === 0) {
      console.log('📭 No files found in R2 bucket\n');
      return;
    }

    console.log(`Found ${response.Contents.length} files in R2\n`);

    // Create a map of asset ID to file key
    const assetFileMap = new Map<string, string>();
    
    for (const obj of response.Contents) {
      if (!obj.Key) continue;
      
      // Extract asset ID from path: assets/{asset-id}/{filename}
      const match = obj.Key.match(/^assets\/([^/]+)\//);
      if (match) {
        const assetId = match[1];
        // Store the most recent file for each asset (they're sorted by timestamp in filename)
        if (!assetFileMap.has(assetId) || obj.Key > assetFileMap.get(assetId)!) {
          assetFileMap.set(assetId, obj.Key);
        }
      }
    }

    console.log(`Mapped ${assetFileMap.size} assets to files\n`);

    // Get all assets from database
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        storageUrl: true,
      },
    });

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const asset of assets) {
      // Skip if already has correct format
      if (asset.storageUrl.startsWith('r2://') && asset.storageUrl.includes('/assets/')) {
        console.log(`✓ ${asset.title} - already correct`);
        continue;
      }

      // Find the file for this asset
      const fileKey = assetFileMap.get(asset.id);
      
      if (fileKey) {
        const newStorageUrl = `r2://${bucketName}/${fileKey}`;
        
        console.log(`📝 Updating: ${asset.title}`);
        console.log(`   Old URL: ${asset.storageUrl}`);
        console.log(`   New URL: ${newStorageUrl}`);

        await prisma.asset.update({
          where: { id: asset.id },
          data: { storageUrl: newStorageUrl },
        });

        updatedCount++;
        console.log(`   ✅ Updated\n`);
      } else {
        console.log(`⚠️  ${asset.title} - file not found in R2`);
        console.log(`   Asset ID: ${asset.id}`);
        console.log(`   Current URL: ${asset.storageUrl}\n`);
        notFoundCount++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Total assets: ${assets.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Not found in R2: ${notFoundCount}`);
    console.log(`   Already correct: ${assets.length - updatedCount - notFoundCount}`);

  } catch (error) {
    console.error('❌ Error fixing storage URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixStorageUrlsWithFiles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
