/**
 * Test Download Functionality
 * 
 * This script tests the download URL generation for assets
 */

import { StorageService } from '../lib/services/StorageService';
import { getStorageConfig } from '../lib/config';

async function testDownload() {
  console.log('Testing download functionality...\n');

  // Check storage configuration
  const config = getStorageConfig();
  console.log('Storage Configuration:');
  console.log('- R2 Account ID:', config.r2AccountId ? '✓ Set' : '✗ Missing');
  console.log('- R2 Access Key ID:', config.r2AccessKeyId ? '✓ Set' : '✗ Missing');
  console.log('- R2 Secret Access Key:', config.r2SecretAccessKey ? '✓ Set' : '✗ Missing');
  console.log('- R2 Bucket Name:', config.r2BucketName ? '✓ Set' : '✗ Missing');
  console.log('- R2 Public URL:', config.r2PublicUrl || 'Not set');
  console.log();

  try {
    // Initialize storage service
    const storageService = new StorageService(config);
    console.log('✓ Storage service initialized successfully\n');

    // Validate configuration
    const validation = storageService.validateConfig();
    if (!validation.valid) {
      console.error('✗ Configuration validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    console.log('✓ Configuration is valid\n');

    // Test signed URL generation with a sample storage URL
    const testStorageUrl = `r2://${config.r2BucketName}/assets/test-asset/sample-file.jpg`;
    console.log(`Testing signed URL generation for: ${testStorageUrl}`);
    
    const signedUrlResponse = await storageService.generateSignedUrl({
      storageUrl: testStorageUrl,
      expiresIn: 3600,
    });

    console.log('✓ Signed URL generated successfully');
    console.log('  - URL:', signedUrlResponse.signedUrl.substring(0, 100) + '...');
    console.log('  - Expires at:', signedUrlResponse.expiresAt.toISOString());
    console.log();

    console.log('✓ All tests passed!');
  } catch (error: any) {
    console.error('✗ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDownload();
