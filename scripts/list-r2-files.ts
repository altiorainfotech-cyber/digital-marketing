/**
 * List R2 Files Script
 * 
 * Lists all files in the R2 bucket to understand the current structure
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

async function listR2Files() {
  console.log('🔍 Listing files in R2 bucket...\n');

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
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 50,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log('📭 No files found in bucket\n');
      return;
    }

    console.log(`Found ${response.Contents.length} files:\n`);

    for (const obj of response.Contents) {
      const size = obj.Size ? `${(obj.Size / 1024 / 1024).toFixed(2)} MB` : 'Unknown';
      console.log(`📄 ${obj.Key}`);
      console.log(`   Size: ${size}`);
      console.log(`   Modified: ${obj.LastModified?.toISOString()}\n`);
    }

    if (response.IsTruncated) {
      console.log('⚠️  More files exist (showing first 50)\n');
    }

  } catch (error: any) {
    console.error('❌ Error listing R2 files:', error.message);
    throw error;
  }
}

listR2Files()
  .then(() => {
    console.log('✅ List complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ List failed:', error);
    process.exit(1);
  });
