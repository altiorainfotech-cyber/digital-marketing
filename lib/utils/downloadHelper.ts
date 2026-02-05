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
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  
  if (filename) {
    link.download = filename; // Suggest filename
  }
  
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  const response = await fetch(`/api/assets/${assetId}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platforms }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: 'Failed to generate download URL' 
    }));
    throw new Error(errorData.error || errorData.details || 'Failed to generate download URL');
  }

  const data = await response.json();
  
  if (!data.downloadUrl) {
    throw new Error('No download URL received from server');
  }

  // Trigger the download
  triggerDownload(data.downloadUrl, assetTitle);

  return data;
}
