/**
 * Test New Upload URL Generation
 * Simulates the URL generation for a new upload to verify the fix
 */

import { UploadHandler } from '../lib/services/UploadHandler';
import { AssetType, UploadType } from '@/app/generated/prisma';

async function testNewUploadUrlGeneration() {
  console.log('🧪 Testing new upload URL generation...\n');

  const uploadHandler = new UploadHandler({
    r2AccountId: process.env.R2_ACCOUNT_ID || '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || '',
    r2PublicUrl: process.env.R2_PUBLIC_URL || '',
    streamAccountId: '',
    streamApiToken: '',
    imagesAccountId: '',
    imagesApiToken: '',
  });

  const testCases = [
    {
      assetId: 'test-image-123',
      assetType: AssetType.IMAGE,
      fileName: 'test-image.png',
      contentType: 'image/png',
    },
    {
      assetId: 'test-video-456',
      assetType: AssetType.VIDEO,
      fileName: 'test-video.mp4',
      contentType: 'video/mp4',
    },
    {
      assetId: 'test-doc-789',
      assetType: AssetType.DOCUMENT,
      fileName: 'test-document.pdf',
      contentType: 'application/pdf',
    },
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing ${testCase.assetType}:`);
    console.log(`   Asset ID: ${testCase.assetId}`);
    console.log(`   File: ${testCase.fileName}`);
    
    try {
      const result = await uploadHandler.generatePresignedUploadUrl({
        assetId: testCase.assetId,
        assetType: testCase.assetType,
        uploadType: UploadType.SEO,
        fileName: testCase.fileName,
        contentType: testCase.contentType,
        expiresIn: 3600,
      });

      console.log(`   ✅ Storage URL: ${result.storageUrl}`);
      
      // Check if it uses the correct pattern
      const expectedPattern = `r2://${process.env.R2_BUCKET_NAME}/assets/${testCase.assetId}`;
      if (result.storageUrl.startsWith(expectedPattern)) {
        console.log(`   ✅ Correct pattern! Uses assets/[assetId]/`);
      } else {
        console.log(`   ❌ Wrong pattern! Expected to start with: ${expectedPattern}`);
      }
      
      console.log('');
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('📊 Test complete!');
  console.log('\n💡 Note: The presign endpoint will add the timestamp and filename to create the full path:');
  console.log('   assets/[assetId]/[timestamp]-[sanitized-filename]');
}

testNewUploadUrlGeneration();
