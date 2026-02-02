/**
 * Prefetch Hook
 * Provides utilities for prefetching resources and next-page navigation
 */

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for prefetching pages and resources
 */
export function usePrefetch() {
  const router = useRouter();

  /**
   * Prefetch a page route
   */
  const prefetchRoute = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  /**
   * Prefetch multiple routes
   */
  const prefetchRoutes = useCallback((hrefs: string[]) => {
    hrefs.forEach((href) => router.prefetch(href));
  }, [router]);

  return {
    prefetchRoute,
    prefetchRoutes,
  };
}

/**
 * Hook for prefetching on hover
 * Usage: <Link {...getPrefetchProps('/path')} />
 */
export function useHoverPrefetch() {
  const { prefetchRoute } = usePrefetch();

  const getPrefetchProps = useCallback((href: string) => {
    return {
      onMouseEnter: () => prefetchRoute(href),
      onTouchStart: () => prefetchRoute(href),
    };
  }, [prefetchRoute]);

  return { getPrefetchProps };
}
