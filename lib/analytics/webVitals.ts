/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and performance metrics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Web Vitals thresholds (in milliseconds or score)
 * Based on Google's Core Web Vitals recommendations
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
} as const;

/**
 * Rating for a metric value
 */
export type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  name: Metric['name'],
  value: number
): MetricRating {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  
  if (!thresholds) {
    return 'good';
  }

  if (value <= thresholds.good) {
    return 'good';
  } else if (value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Format metric value for display
 */
export function formatMetricValue(name: Metric['name'], value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Web Vitals event handler
 */
export type WebVitalsHandler = (metric: Metric) => void;

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  const url = '/api/analytics/web-vitals';
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send web vitals:', error);
    });
  }
}

/**
 * Log metric to console (development only)
 */
function logToConsole(metric: Metric) {
  const rating = getMetricRating(metric.name, metric.value);
  const formattedValue = formatMetricValue(metric.name, metric.value);
  
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
  
  console.log(
    `${emoji} ${metric.name}: ${formattedValue} (${rating})`,
    metric
  );
}

/**
 * Report Web Vitals
 * Call this function to start monitoring Core Web Vitals
 */
export function reportWebVitals(handler?: WebVitalsHandler) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const onMetric = (metric: Metric) => {
    // Log to console in development
    if (isDevelopment) {
      logToConsole(metric);
    }
    
    // Send to analytics in production
    if (!isDevelopment) {
      sendToAnalytics(metric);
    }
    
    // Call custom handler if provided
    if (handler) {
      handler(metric);
    }
  };

  // Register all Core Web Vitals
  onCLS(onMetric);
  onINP(onMetric);
  onLCP(onMetric);
  onFCP(onMetric);
  onTTFB(onMetric);
}

/**
 * Performance observer for custom metrics
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure time since mark
   */
  measure(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);
    
    return duration;
  }

  /**
   * Measure and log time since mark
   */
  measureAndLog(name: string, label?: string) {
    const duration = this.measure(name);
    if (duration !== null) {
      console.log(`⏱️ ${label || name}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }

  /**
   * Clear all marks
   */
  clear() {
    this.marks.clear();
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for measuring component render time
 */
export function measureRenderTime(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    performanceMonitor.mark(`${componentName}-render-start`);
    
    return () => {
      performanceMonitor.measureAndLog(
        `${componentName}-render-start`,
        `${componentName} render time`
      );
    };
  }
  
  return () => {};
}
