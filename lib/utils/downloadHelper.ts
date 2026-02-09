/**
 * Download Helper Utilities
 * 
 * Helper functions for triggering asset downloads
 */

/**
 * Trigger a download using a URL
 * Creates a temporary anchor element to initiate the download
 * 
 * @param url - The download URL (signed URL from R2)
 * @param filename - Suggested filename for the download
 */
export function triggerDownload(url: string, filename?: string): void {
  console.log('[DownloadHelper] Triggering download', { url, filename });
  
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  
  if (filename) {
    link.download = filename; // Suggest filename
  }
  
  // Don't use target="_blank" - it opens in new tab instead of downloading
  // The download attribute will trigger a download instead
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('[DownloadHelper] Download triggered successfully');
}

/**
 * Initiate asset download with platform tracking
 * 
 * @param assetId - The asset ID to download
 * @param platforms - Array of platforms where the asset will be used
 * @param assetTitle - Optional asset title for filename suggestion
 * @returns Promise with download URL and expiration
 */
export async function initiateAssetDownload(
  assetId: string,
  platforms: string[],
  assetTitle?: string
): Promise<{ downloadUrl: string; expiresAt: Date }> {
  console.log('[DownloadHelper] Initiating asset download', { assetId, platforms, assetTitle });
  
  const response = await fetch(`/api/assets/${assetId}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platforms }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: 'Failed to generate download URL' 
    }));
    console.error('[DownloadHelper] Download failed', errorData);
    throw new Error(errorData.error || errorData.details || 'Failed to generate download URL');
  }

  const data = await response.json();
  console.log('[DownloadHelper] Download URL received', { downloadUrl: data.downloadUrl });
  
  if (!data.downloadUrl) {
    throw new Error('No download URL received from server');
  }

  // Trigger the download
  triggerDownload(data.downloadUrl, assetTitle);

  return data;
}
