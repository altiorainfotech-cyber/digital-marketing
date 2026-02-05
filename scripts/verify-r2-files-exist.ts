import { S3Client, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyR2FilesExist() {
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME!;

  console.log('Checking R2 bucket:', bucketName);
  console.log('');

  // Check specific video files
  const filesToCheck = [
    'videos/cml96cni70000i6ouw6r79uhx',
    'videos/cml952hel0000k2ouoisb8lsj',
    'assets/cml6j3yn40000ntou6entofg9/1770118934024-852f1be1-0ad3-4cc8-a5e0-6e32e23aa181_hd.mp4',
  ];

  console.log('Checking if files exist in R2...\n');

  for (const key of filesToCheck) {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await r2.send(command);
      console.log(`✅ EXISTS: ${key}`);
      console.log(`   Size: ${(response.ContentLength! / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Type: ${response.ContentType}`);
      console.log(`   Last Modified: ${response.LastModified}`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`❌ NOT FOUND: ${key}`);
      } else {
        console.log(`⚠️  ERROR checking ${key}:`, error.message);
      }
    }
    console.log('');
  }

  // List all files in videos/ directory
  console.log('\n📁 Listing all files in videos/ directory...\n');
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'videos/',
      MaxKeys: 10,
    });

    const listResponse = await r2.send(listCommand);
    
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log(`Found ${listResponse.Contents.length} file(s):`);
      listResponse.Contents.forEach((obj, index) => {
        console.log(`${index + 1}. ${obj.Key}`);
        console.log(`   Size: ${(obj.Size! / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Modified: ${obj.LastModified}`);
      });
    } else {
      console.log('❌ No files found in videos/ directory');
      console.log('   This explains why videos return 404!');
    }
  } catch (error: any) {
    console.log('⚠️  Error listing files:', error.message);
  }
}

verifyR2FilesExist().catch(console.error);
