import prisma from '../lib/prisma';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

async function markBrokenVideos() {
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
      status: true,
    },
  });

  const missingVideos = [];

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
      console.log(`✅ ${video.title} - File exists`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        missingVideos.push(video);
        console.log(`❌ ${video.title} - File MISSING`);
      }
    }
  }

  if (missingVideos.length === 0) {
    console.log('\n✅ No broken videos found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${missingVideos.length} broken video(s)`);
  console.log('\n🔧 Marking broken videos as upload failed...\n');

  try {
    for (const video of missingVideos) {
      await prisma.asset.update({
        where: { id: video.id },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Upload failed - file missing from storage. Please re-upload this video.',
          rejectedAt: new Date(),
        },
      });
      console.log(`   ✅ Marked: ${video.title}`);
    }

    console.log(`\n✅ Marked ${missingVideos.length} video(s) as upload failed`);
    console.log('\n✨ These videos will now show as REJECTED in the UI');
    console.log('   Users can see the rejection reason and re-upload if needed.');
    console.log('\n📋 Broken videos:');
    missingVideos.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.title} (ID: ${v.id})`);
    });
  } catch (error: any) {
    console.error('❌ Error marking records:', error.message);
  }

  await prisma.$disconnect();
}

markBrokenVideos().catch(console.error);
