import prisma from '../lib/prisma';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

async function markAllBrokenAssets() {
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME!;

  console.log('🔍 Finding assets with missing files in R2...\n');

  // Get all assets (excluding LINK type which doesn't use R2)
  const assets = await prisma.asset.findMany({
    where: {
      assetType: {
        in: ['IMAGE', 'VIDEO', 'DOCUMENT'],
      },
      status: {
        not: 'REJECTED', // Skip already rejected assets
      },
    },
    select: {
      id: true,
      title: true,
      assetType: true,
      storageUrl: true,
      status: true,
    },
  });

  const missingAssets = [];

  for (const asset of assets) {
    const match = asset.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (!match) continue;

    const key = match[1];

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await r2.send(command);
      console.log(`✅ ${asset.assetType}: ${asset.title}`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        missingAssets.push(asset);
        console.log(`❌ ${asset.assetType}: ${asset.title} - MISSING`);
      }
    }
  }

  if (missingAssets.length === 0) {
    console.log('\n✅ No broken assets found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${missingAssets.length} broken asset(s)`);
  console.log('\n🔧 Marking broken assets as upload failed...\n');

  try {
    let marked = 0;
    for (const asset of missingAssets) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          status: 'REJECTED',
          rejectionReason: `Upload failed - ${asset.assetType.toLowerCase()} file missing from storage. Please re-upload this ${asset.assetType.toLowerCase()}.`,
          rejectedAt: new Date(),
        },
      });
      console.log(`   ✅ Marked: ${asset.title} (${asset.assetType})`);
      marked++;
    }

    console.log(`\n✅ Marked ${marked} asset(s) as upload failed`);
    console.log('\n✨ These assets will now show as REJECTED in the UI');
    console.log('   Users can see the rejection reason and re-upload if needed.');
    
    // Group by type for summary
    const byType = missingAssets.reduce((acc, asset) => {
      if (!acc[asset.assetType]) acc[asset.assetType] = [];
      acc[asset.assetType].push(asset);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('\n📋 Broken assets by type:');
    Object.entries(byType).forEach(([type, assets]) => {
      console.log(`   ${type}S: ${assets.length}`);
      assets.forEach((a, i) => {
        console.log(`      ${i + 1}. ${a.title} (ID: ${a.id})`);
      });
    });
  } catch (error: any) {
    console.error('❌ Error marking records:', error.message);
  }

  await prisma.$disconnect();
}

markAllBrokenAssets().catch(console.error);
