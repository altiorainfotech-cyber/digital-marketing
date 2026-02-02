import { useRef, useCallback, useState } from 'react';

export interface PullToRefreshOptions {
  /**
   * Callback when refresh is triggered
   */
  onRefresh: () => Promise<void> | void;
  /**
   * Distance in pixels to trigger refresh (default: 80)
   */
  pullDistance?: number;
  /**
   * Maximum pull distance (default: 120)
   */
  maxPullDistance?: number;
  /**
   * Whether pull-to-refresh is enabled (default: true)
   */
  enabled?: boolean;
}

export interface PullToRefreshState {
  /**
   * Current pull distance
   */
  pullDistance: number;
  /**
   * Whether refresh is in progress
   */
  isRefreshing: boolean;
  /**
   * Whether pull threshold has been reached
   */
  isThresholdReached: boolean;
}

export interface PullToRefreshHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Hook for implementing pull-to-refresh functionality on mobile
 * @param options - Configuration options
 * @returns State and handlers for pull-to-refresh
 */
export function usePullToRefresh(
  options: PullToRefreshOptions
): [PullToRefreshState, PullToRefreshHandlers] {
  const {
    onRefresh,
    pullDistance: triggerDistance = 80,
    maxPullDistance = 120,
    enabled = true,
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number>(0);
  const scrollTopRef = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;

    const target = e.currentTarget as HTMLElement;
    scrollTopRef.current = target.scrollTop;
    startYRef.current = e.touches[0].clientY;
  }, [enabled, isRefreshing]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing) return;

      const target = e.currentTarget as HTMLElement;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      // Only trigger pull-to-refresh if at the top of the scroll container
      if (scrollTopRef.current === 0 && deltaY > 0) {
        e.preventDefault();

        // Calculate pull distance with resistance
        const resistance = 0.5;
        const distance = Math.min(deltaY * resistance, maxPullDistance);
        setPullDistance(distance);
      }
    },
    [enabled, isRefreshing, maxPullDistance]
  );

  const onTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return;

    if (pullDistance >= triggerDistance) {
      setIsRefreshing(true);
      setPullDistance(triggerDistance);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    startYRef.current = 0;
    scrollTopRef.current = 0;
  }, [enabled, isRefreshing, pullDistance, triggerDistance, onRefresh]);

  const state: PullToRefreshState = {
    pullDistance,
    isRefreshing,
    isThresholdReached: pullDistance >= triggerDistance,
  };

  const handlers: PullToRefreshHandlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  return [state, handlers];
}
