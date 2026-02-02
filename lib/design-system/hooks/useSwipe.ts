import { useRef, useCallback } from 'react';

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeOptions {
  /**
   * Minimum distance in pixels to trigger a swipe (default: 50)
   */
  minSwipeDistance?: number;
  /**
   * Maximum time in ms for a swipe gesture (default: 300)
   */
  maxSwipeTime?: number;
}

/**
 * Hook for detecting swipe gestures on touch devices
 * @param callbacks - Callbacks for each swipe direction
 * @param options - Configuration options
 * @returns Touch event handlers to attach to an element
 */
export function useSwipe(
  callbacks: SwipeCallbacks,
  options: SwipeOptions = {}
): SwipeHandlers {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while swiping
    // Only if we have a touch start
    if (touchStartRef.current) {
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Check if swipe was fast enough
      if (deltaTime > maxSwipeTime) {
        touchStartRef.current = null;
        return;
      }

      // Determine swipe direction based on larger delta
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (absX >= minSwipeDistance) {
          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (absY >= minSwipeDistance) {
          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      }

      touchStartRef.current = null;
    },
    [callbacks, minSwipeDistance, maxSwipeTime]
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
