/**
 * URL Utilities
 * 
 * Helper functions for converting storage URLs to public URLs
 */

/**
 * Convert R2 storage URL to public HTTP URL
 * Converts r2://bucket-name/path to https://public-url/path
 */
export function convertToPublicUrl(storageUrl: string, r2PublicUrl?: string): string {
  if (!storageUrl) return '';
  
  // If already a public URL, return as-is
  if (storageUrl.startsWith('http://') || storageUrl.startsWith('https://')) {
    return storageUrl;
  }
  
  // Convert r2:// to public URL
  if (storageUrl.startsWith('r2://')) {
    const publicUrl = r2PublicUrl || process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
      console.warn('R2_PUBLIC_URL not configured, cannot generate public URL');
      return '';
    }
    
    // Extract the key from r2://bucket-name/key
    const match = storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (match) {
      const key = match[1];
      return `${publicUrl}/${key}`;
    }
  }
  
  // For link:// URLs, return empty (these are handled separately)
  if (storageUrl.startsWith('link://')) {
    return '';
  }
  
  return storageUrl;
}

/**
 * Check if a URL is a storage URL that needs conversion
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith('r2://') || url.startsWith('stream://') || url.startsWith('images://');
}

/**
 * Get thumbnail URL for an asset
 * For images, returns the public URL
 * For videos, returns empty (could be enhanced with video thumbnails)
 * For documents, returns empty
 */
export function getThumbnailUrl(storageUrl: string, assetType: string, r2PublicUrl?: string): string | undefined {
  if (assetType === 'IMAGE') {
    return convertToPublicUrl(storageUrl, r2PublicUrl) || undefined;
  }
  
  // Could add video thumbnail generation here
  return undefined;
}
