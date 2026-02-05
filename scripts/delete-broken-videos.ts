import prisma from '../lib/prisma';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

async function deleteBrokenVideos() {
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME!;

  console.log('🔍 Finding videos with missing files in R2...\n');

  // Get all video assets
  const videos = await prisma.asset.findMany({
    where: {
      assetType: 'VIDEO',
    },
    select: {
      id: true,
      title: true,
      storageUrl: true,
    },
  });

  const missingVideoIds = [];

  for (const video of videos) {
    const match = video.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (!match) continue;

    const key = match[1];

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await r2.send(command);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        missingVideoIds.push(video.id);
        console.log(`❌ Will delete: ${video.title} (ID: ${video.id})`);
      }
    }
  }

  if (missingVideoIds.length === 0) {
    console.log('\n✅ No broken videos found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${missingVideoIds.length} broken video(s)`);
  console.log('\n🗑️  Deleting broken video records from database...\n');

  try {
    // First, delete related audit logs
    const auditResult = await prisma.auditLog.deleteMany({
      where: {
        assetId: {
          in: missingVideoIds,
        },
      },
    });
    console.log(`   Deleted ${auditResult.count} related audit log(s)`);

    // Then delete the assets
    const result = await prisma.asset.deleteMany({
      where: {
        id: {
          in: missingVideoIds,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} broken video record(s)`);
    console.log('\n✨ Database cleaned up successfully!');
    console.log('\nUsers can now re-upload these videos if needed.');
  } catch (error: any) {
    console.error('❌ Error deleting records:', error.message);
  }

  await prisma.$disconnect();
}

deleteBrokenVideos().catch(console.error);
