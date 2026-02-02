import { StorageConfig } from '@/types';
import { StorageService } from '@/lib/services';

export const storageConfig: StorageConfig = {
  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || 'dascms-documents',
  streamAccountId: process.env.STREAM_ACCOUNT_ID || '',
  streamApiToken: process.env.STREAM_API_TOKEN || '',
  imagesAccountId: process.env.IMAGES_ACCOUNT_ID || '',
  imagesApiToken: process.env.IMAGES_API_TOKEN || '',
};

// Helper function to get storage config
export function getStorageConfig(): StorageConfig {
  return storageConfig;
}

// Singleton instance of StorageService
export const storageService = new StorageService(storageConfig);

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = {
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
};
