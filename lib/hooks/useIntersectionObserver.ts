/**
 * Intersection Observer Hook
 * Provides lazy loading capabilities using Intersection Observer API
 */

import { useEffect, useRef, useState, RefObject } from 'react';

export interface UseIntersectionObserverOptions {
  /**
   * Root element for intersection (null = viewport)
   */
  root?: Element | null;
  /**
   * Margin around root (e.g., '50px')
   */
  rootMargin?: string;
  /**
   * Threshold for triggering (0-1)
   */
  threshold?: number | number[];
  /**
   * Whether to freeze after first intersection
   */
  freezeOnceVisible?: boolean;
}

/**
 * Hook for observing element visibility
 * Useful for lazy loading images, infinite scroll, etc.
 */
export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, boolean] {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    freezeOnceVisible = false,
  } = options;

  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If already visible and frozen, don't observe
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);

        // Unobserve if frozen after becoming visible
        if (freezeOnceVisible && isIntersecting) {
          observer.unobserve(element);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, freezeOnceVisible, isVisible]);

  return [elementRef, isVisible];
}

/**
 * Hook for lazy loading content
 * Returns a ref and loading state
 */
export function useLazyLoad<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
) {
  const [ref, isVisible] = useIntersectionObserver<T>({
    ...options,
    freezeOnceVisible: true,
  });

  return { ref, shouldLoad: isVisible };
}

/**
 * Hook for infinite scroll
 * Triggers callback when element becomes visible
 */
export function useInfiniteScroll<T extends Element = Element>(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
) {
  const [ref, isVisible] = useIntersectionObserver<T>({
    ...options,
    rootMargin: options.rootMargin || '100px', // Load before reaching bottom
  });

  useEffect(() => {
    if (isVisible) {
      callback();
    }
  }, [isVisible, callback]);

  return ref;
}
