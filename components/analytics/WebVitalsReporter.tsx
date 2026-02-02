/**
 * Web Vitals Reporter Component
 * Client component that reports Core Web Vitals
 */

'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/analytics/webVitals';

/**
 * Component that initializes Web Vitals reporting
 * Should be included in the root layout
 */
export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return null;
}
