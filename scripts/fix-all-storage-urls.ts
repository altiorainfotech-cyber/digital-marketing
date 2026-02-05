/**
 * Fix All Storage URLs
 * Matches database records with actual R2 files and updates storage URLs
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import prisma from '../lib/prisma';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

async function fixAllStorageUrls() {
  console.log('🔧 Starting storage URL fix process...\n');

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
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
    // Step 1: Get all files from R2
    console.log('📦 Fetching files from R2...');
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);
    const r2Files = response.Contents || [];
    console.log(`✅ Found ${r2Files.length} files in R2\n`);

    // Step 2: Get assets with old storage URL pattern
    console.log('🔍 Finding assets with old storage URLs...');
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { storageUrl: { contains: '/videos/' } },
          { storageUrl: { contains: '/images/' } },
        ],
      },
      select: {
        id: true,
        title: true,
        storageUrl: true,
      },
    });
    console.log(`✅ Found ${assets.length} assets to fix\n`);

    // Step 3: Match and update
    let fixed = 0;
    let notFound = 0;

    for (const asset of assets) {
      // Find matching R2 file by asset ID
      const matchingFile = r2Files.find(file => 
        file.Key?.includes(`assets/${asset.id}/`)
      );

      if (matchingFile && matchingFile.Key) {
        const correctStorageUrl = `r2://${bucketName}/${matchingFile.Key}`;
        
        console.log(`🔧 Fixing: ${asset.title}`);
        console.log(`   Old: ${asset.storageUrl}`);
        console.log(`   New: ${correctStorageUrl}`);
        
        await prisma.asset.update({
          where: { id: asset.id },
          data: { storageUrl: correctStorageUrl },
        });
        
        fixed++;
        console.log('   ✅ Updated\n');
      } else {
        console.log(`⚠️  No R2 file found for: ${asset.title} (${asset.id})`);
        notFound++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⚠️  Not found in R2: ${notFound}`);
    console.log(`   📝 Total processed: ${assets.length}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAllStorageUrls()
  .then(() => {
    console.log('\n✅ Process complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Process failed:', error);
    process.exit(1);
  });
