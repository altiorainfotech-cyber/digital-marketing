/**
 * Fix Asset Storage URLs
 * 
 * This script fixes assets that have incorrect storage URLs by:
 * 1. Listing actual files in R2
 * 2. Matching them to assets in the database
 * 3. Updating the storage URLs to match actual file locations
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Client } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixAssetStorageUrls() {
  console.log('🔍 Fixing asset storage URLs...\n');

  // Initialize R2 client
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  // Initialize database client
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    // List all files in R2
    console.log('📂 Listing files in R2 bucket...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
    });

    const r2Response = await r2Client.send(listCommand);
    const r2Files = r2Response.Contents || [];
    console.log(`Found ${r2Files.length} files in R2\n`);

    // Get all assets from database
    const assetsResult = await dbClient.query(`
      SELECT id, title, "assetType", "storageUrl"
      FROM "Asset"
      ORDER BY "uploadedAt" DESC
    `);

    const assets = assetsResult.rows;
    console.log(`Found ${assets.length} assets in database\n`);

    let fixedCount = 0;
    let notFoundCount = 0;

    // Process each asset
    for (const asset of assets) {
      const storageUrl = asset.storageUrl;

      // Skip if already has correct format
      if (storageUrl.startsWith('r2://') && storageUrl.includes('/assets/')) {
        continue;
      }

      // Skip links
      if (storageUrl.startsWith('link://')) {
        continue;
      }

      console.log(`\n📄 Processing: ${asset.title}`);
      console.log(`   Current URL: ${storageUrl}`);
      console.log(`   Asset ID: ${asset.id}`);

      // Try to find matching file in R2
      let matchingFile = null;

      // Method 1: Look for files in assets/[assetId]/ directory
      matchingFile = r2Files.find(file => 
        file.Key?.includes(`assets/${asset.id}/`)
      );

      // Method 2: Look for files with matching title
      if (!matchingFile && asset.title) {
        const sanitizedTitle = asset.title.replace(/[^a-zA-Z0-9.-]/g, '_');
        matchingFile = r2Files.find(file => 
          file.Key?.includes(asset.title) || 
          file.Key?.includes(sanitizedTitle)
        );
      }

      // Method 3: Look in old images/ or videos/ directories
      if (!matchingFile) {
        const oldPath1 = `images/${asset.id}`;
        const oldPath2 = `videos/${asset.id}`;
        matchingFile = r2Files.find(file => 
          file.Key === oldPath1 || file.Key === oldPath2
        );
      }

      if (matchingFile) {
        const newStorageUrl = `r2://${process.env.R2_BUCKET_NAME}/${matchingFile.Key}`;
        console.log(`   ✅ Found file: ${matchingFile.Key}`);
        console.log(`   New URL: ${newStorageUrl}`);

        // Update database
        await dbClient.query(
          'UPDATE "Asset" SET "storageUrl" = $1 WHERE id = $2',
          [newStorageUrl, asset.id]
        );

        fixedCount++;
      } else {
        console.log(`   ❌ No matching file found in R2`);
        notFoundCount++;
      }
    }

    console.log('\n\n=== Summary ===');
    console.log(`Total assets: ${assets.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Not found: ${notFoundCount}`);
    console.log(`Already correct: ${assets.length - fixedCount - notFoundCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

fixAssetStorageUrls();
