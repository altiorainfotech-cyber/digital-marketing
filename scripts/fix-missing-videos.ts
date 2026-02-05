import prisma from '../lib/prisma';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixMissingVideos() {
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
      uploadedAt: true,
    },
  });

  console.log(`Found ${videos.length} video records in database\n`);

  const missingVideos = [];
  const existingVideos = [];

  for (const video of videos) {
    // Extract the R2 key from storage URL
    const match = video.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (!match) {
      console.log(`⚠️  Invalid storage URL format: ${video.storageUrl}`);
      continue;
    }

    const key = match[1];

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await r2.send(command);
      existingVideos.push({ ...video, key });
      console.log(`✅ ${video.title} - File exists`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        missingVideos.push({ ...video, key });
        console.log(`❌ ${video.title} - File MISSING`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Existing: ${existingVideos.length}`);
  console.log(`   ❌ Missing: ${missingVideos.length}`);

  if (missingVideos.length > 0) {
    console.log(`\n⚠️  Found ${missingVideos.length} video(s) with missing files:\n`);
    
    missingVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   ID: ${video.id}`);
      console.log(`   Expected path: ${video.key}`);
      console.log(`   Uploaded: ${video.uploadedAt.toISOString()}`);
      console.log('');
    });

    console.log('\n🔧 Recommended actions:');
    console.log('1. Delete these broken records from database');
    console.log('2. Ask users to re-upload these videos');
    console.log('3. Or mark them as "upload failed" status');
    console.log('');
    console.log('To delete broken records, run:');
    console.log('  npx tsx scripts/delete-broken-videos.ts');
  } else {
    console.log('\n✅ All video files exist in R2!');
  }

  await prisma.$disconnect();
}

fixMissingVideos().catch(console.error);
