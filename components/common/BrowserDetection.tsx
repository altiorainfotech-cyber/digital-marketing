'use client';

import { useEffect } from 'react';
import { applyBrowserClasses, applyIOSViewportFix } from '@/lib/utils/browserDetection';

/**
 * BrowserDetection Component
 * 
 * Applies browser-specific classes and fixes on mount.
 * Should be included in the root layout.
 */
export function BrowserDetection() {
  useEffect(() => {
    // Apply browser detection classes
    applyBrowserClasses();

    // Apply iOS viewport height fix
    applyIOSViewportFix();

    // Log browser info in development
    if (process.env.NODE_ENV === 'development') {
      const { detectBrowser } = require('@/lib/utils/browserDetection');
      const browserInfo = detectBrowser();
      console.log('Browser detected:', browserInfo);
    }
  }, []);

  // This component doesn't render anything
  return null;
}
