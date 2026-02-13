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
  
  // For cross-origin URLs (like R2), we need to fetch and create a blob
  // to force download instead of navigation
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      return response.blob();
    })
    .then(blob => {
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download'; // Force download with filename
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      console.log('[DownloadHelper] Download triggered successfully');
    })
    .catch(error => {
      console.error('[DownloadHelper] Download failed, falling back to direct link', error);
      
      // Fallback: open in new tab if blob download fails
      window.open(url, '_blank');
    });
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

/**
 * Initiate carousel bulk download (all items as ZIP)
 * 
 * @param assetId - The carousel asset ID to download
 * @param platforms - Array of platforms where the assets will be used
 * @param assetTitle - Optional asset title for filename suggestion
 */
export async function initiateCarouselDownload(
  assetId: string,
  platforms: string[],
  assetTitle?: string
): Promise<void> {
  console.log('[DownloadHelper] Initiating carousel bulk download', { assetId, platforms, assetTitle });
  
  const response = await fetch(`/api/assets/${assetId}/download-carousel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platforms }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: 'Failed to download carousel' 
    }));
    console.error('[DownloadHelper] Carousel download failed', errorData);
    throw new Error(errorData.error || errorData.details || 'Failed to download carousel');
  }

  // Get the ZIP file as a blob
  const blob = await response.blob();
  
  // Create a download link
  const url = window.URL.createObjectURL(blob);
  const filename = `${assetTitle?.replace(/[^a-z0-9]/gi, '_') || 'carousel'}_carousel.zip`;
  
  triggerDownload(url, filename);
  
  // Clean up
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
  
  console.log('[DownloadHelper] Carousel download completed');
}
