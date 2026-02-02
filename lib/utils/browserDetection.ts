/**
 * Browser Detection Utilities
 * 
 * Provides utilities for detecting browser type and applying browser-specific fixes.
 * Use sparingly - prefer feature detection over browser detection when possible.
 */

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  version: string;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

/**
 * Detect the current browser
 * Note: This runs on the client side only
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      version: '',
      isMobile: false,
      isIOS: false,
      isAndroid: false,
    };
  }

  const userAgent = window.navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  let name: BrowserInfo['name'] = 'unknown';
  let version = '';

  // Edge (Chromium-based)
  if (userAgent.includes('Edg/')) {
    name = 'edge';
    version = userAgent.match(/Edg\/(\d+)/)?.[1] || '';
  }
  // Chrome
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    name = 'chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '';
  }
  // Safari
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    name = 'safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || '';
  }
  // Firefox
  else if (userAgent.includes('Firefox/')) {
    name = 'firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '';
  }

  return {
    name,
    version,
    isMobile,
    isIOS,
    isAndroid,
  };
}

/**
 * Check if the browser supports a specific CSS feature
 */
export function supportsCSSFeature(property: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.CSS?.supports) {
    return false;
  }
  return window.CSS.supports(property, value);
}

/**
 * Check if backdrop-filter is supported
 * Safari requires -webkit- prefix in some versions
 */
export function supportsBackdropFilter(): boolean {
  return (
    supportsCSSFeature('backdrop-filter', 'blur(10px)') ||
    supportsCSSFeature('-webkit-backdrop-filter', 'blur(10px)')
  );
}

/**
 * Check if CSS Grid gap is supported
 */
export function supportsGridGap(): boolean {
  return supportsCSSFeature('gap', '10px');
}

/**
 * Check if smooth scrolling is supported
 */
export function supportsSmoothScroll(): boolean {
  return supportsCSSFeature('scroll-behavior', 'smooth');
}

/**
 * Get browser-specific CSS class names
 * Add these to the document element for browser-specific styling
 */
export function getBrowserClasses(): string[] {
  const browser = detectBrowser();
  const classes: string[] = [];

  classes.push(`browser-${browser.name}`);
  
  if (browser.isMobile) {
    classes.push('is-mobile');
  }
  
  if (browser.isIOS) {
    classes.push('is-ios');
  }
  
  if (browser.isAndroid) {
    classes.push('is-android');
  }

  // Feature detection classes
  if (!supportsBackdropFilter()) {
    classes.push('no-backdrop-filter');
  }
  
  if (!supportsGridGap()) {
    classes.push('no-grid-gap');
  }
  
  if (!supportsSmoothScroll()) {
    classes.push('no-smooth-scroll');
  }

  return classes;
}

/**
 * Apply browser-specific classes to document element
 * Call this in your root layout or _app.tsx
 */
export function applyBrowserClasses(): void {
  if (typeof document === 'undefined') return;

  const classes = getBrowserClasses();
  document.documentElement.classList.add(...classes);
}

/**
 * iOS-specific viewport height fix
 * iOS Safari has issues with 100vh when the address bar is visible
 */
export function applyIOSViewportFix(): void {
  if (typeof window === 'undefined') return;

  const browser = detectBrowser();
  if (!browser.isIOS) return;

  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
}

/**
 * Disable zoom on input focus for mobile
 * Prevents iOS Safari from zooming when focusing inputs
 */
export function preventInputZoom(): void {
  if (typeof document === 'undefined') return;

  const browser = detectBrowser();
  if (!browser.isMobile) return;

  // Check if viewport meta tag exists
  let viewport = document.querySelector('meta[name="viewport"]');
  
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }

  // Set viewport to prevent zoom while maintaining accessibility
  viewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
  );
}
