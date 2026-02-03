import { StorageConfig } from '@/types';
import { StorageService } from '@/lib/services';

export const storageConfig: StorageConfig = {
  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || 'dascms-documents',
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',
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

/**
 * Convert R2 storage URL to public HTTP URL
 * Converts r2://bucket-name/path to https://public-url/path
 */
export function getPublicUrl(storageUrl: string): string {
  if (!storageUrl) return '';
  
  // If already a public URL, return as-is
  if (storageUrl.startsWith('http://') || storageUrl.startsWith('https://')) {
    return storageUrl;
  }
  
  // Convert r2:// to public URL
  if (storageUrl.startsWith('r2://')) {
    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    if (!r2PublicUrl) {
      console.warn('R2_PUBLIC_URL not configured, cannot generate public URL');
      return '';
    }
    
    // Extract the key from r2://bucket-name/key
    const match = storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (match) {
      const key = match[1];
      return `${r2PublicUrl}/${key}`;
    }
  }
  
  return storageUrl;
}
