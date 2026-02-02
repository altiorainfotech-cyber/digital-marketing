/**
 * Image Utilities
 * Helper functions for image optimization and blur placeholders
 */

/**
 * Generate a simple blur data URL for placeholder
 * This creates a tiny 1x1 pixel blur placeholder
 */
export function generateBlurDataURL(color: string = '#e5e7eb'): string {
  // Create a simple SVG blur placeholder
  const svg = `
    <svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="1" fill="${color}"/>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get responsive image sizes string based on breakpoints
 */
export function getResponsiveSizes(
  type: 'full' | 'half' | 'third' | 'quarter' | 'thumbnail' = 'full'
): string {
  const sizeMap = {
    full: '100vw',
    half: '(max-width: 768px) 100vw, 50vw',
    third: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    quarter: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw',
    thumbnail: '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 200px',
  };
  
  return sizeMap[type];
}

/**
 * Check if image should be loaded with priority
 * Priority should be used for above-the-fold images
 */
export function shouldUsePriority(index: number, maxPriority: number = 2): boolean {
  return index < maxPriority;
}

/**
 * Get optimal image quality based on image type
 */
export function getOptimalQuality(type: 'thumbnail' | 'preview' | 'full'): number {
  const qualityMap = {
    thumbnail: 60,
    preview: 75,
    full: 85,
  };
  
  return qualityMap[type];
}

/**
 * Generate shimmer effect for loading placeholder
 */
export function shimmer(w: number, h: number): string {
  return `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#e5e7eb" offset="20%" />
          <stop stop-color="#f3f4f6" offset="50%" />
          <stop stop-color="#e5e7eb" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#e5e7eb" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `;
}

/**
 * Convert shimmer SVG to base64 data URL
 */
export function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);
}

/**
 * Generate shimmer placeholder data URL
 */
export function getShimmerDataURL(w: number = 700, h: number = 475): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
}
