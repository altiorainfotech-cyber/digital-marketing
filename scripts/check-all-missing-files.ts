import prisma from '../lib/prisma';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkAllMissingFiles() {
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME!;

  console.log('🔍 Checking ALL assets for missing files in R2...\n');

  // Get all assets
  const assets = await prisma.asset.findMany({
    where: {
      assetType: {
        in: ['IMAGE', 'VIDEO', 'DOCUMENT'],
      },
    },
    select: {
      id: true,
      title: true,
      assetType: true,
      storageUrl: true,
      status: true,
      uploadedAt: true,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  console.log(`Found ${assets.length} assets in database\n`);

  const missingAssets: any[] = [];
  const existingAssets: any[] = [];
  const invalidUrls: any[] = [];

  for (const asset of assets) {
    // Extract the R2 key from storage URL
    const match = asset.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (!match) {
      invalidUrls.push(asset);
      console.log(`⚠️  ${asset.assetType}: ${asset.title} - Invalid URL format`);
      continue;
    }

    const key = match[1];

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await r2.send(command);
      existingAssets.push({ ...asset, key, size: response.ContentLength });
      console.log(`✅ ${asset.assetType}: ${asset.title}`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        missingAssets.push({ ...asset, key });
        console.log(`❌ ${asset.assetType}: ${asset.title} - FILE MISSING`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Existing: ${existingAssets.length}`);
  console.log(`   ❌ Missing: ${missingAssets.length}`);
  console.log(`   ⚠️  Invalid URLs: ${invalidUrls.length}`);

  if (missingAssets.length > 0) {
    console.log(`\n⚠️  Found ${missingAssets.length} asset(s) with missing files:\n`);
    
    // Group by asset type
    const byType = missingAssets.reduce((acc, asset) => {
      if (!acc[asset.assetType]) acc[asset.assetType] = [];
      acc[asset.assetType].push(asset);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(byType).forEach(([type, assets]) => {
      console.log(`\n${type}S (${assets.length}):`);
      assets.forEach((asset, index) => {
        console.log(`  ${index + 1}. ${asset.title}`);
        console.log(`     ID: ${asset.id}`);
        console.log(`     Path: ${asset.key}`);
        console.log(`     Status: ${asset.status}`);
        console.log(`     Uploaded: ${asset.uploadedAt.toISOString()}`);
      });
    });

    console.log('\n🔧 To fix these issues, run:');
    console.log('  npx tsx scripts/mark-all-broken-assets.ts');
  } else {
    console.log('\n✅ All asset files exist in R2!');
  }

  await prisma.$disconnect();
}

checkAllMissingFiles().catch(console.error);
