/**
 * Lazy Image Component
 * Image component with intersection observer for lazy loading
 */

'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { useLazyLoad } from '@/lib/hooks/useIntersectionObserver';
import { getShimmerDataURL } from '@/lib/utils/imageUtils';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  /**
   * Fallback component while loading
   */
  fallback?: React.ReactNode;
  /**
   * Root margin for intersection observer
   */
  rootMargin?: string;
  /**
   * Callback when image loads
   */
  onLoad?: () => void;
}

/**
 * LazyImage component with intersection observer
 * Only loads image when it enters viewport
 */
export function LazyImage({
  src,
  alt,
  fallback,
  rootMargin = '50px',
  onLoad,
  placeholder = 'blur',
  blurDataURL,
  ...props
}: LazyImageProps) {
  const { ref, shouldLoad } = useLazyLoad<HTMLDivElement>({ rootMargin });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Generate blur placeholder if not provided
  const finalBlurDataURL = placeholder === 'blur' && !blurDataURL
    ? getShimmerDataURL(
        typeof props.width === 'number' ? props.width : 700,
        typeof props.height === 'number' ? props.height : 475
      )
    : blurDataURL;

  return (
    <div ref={ref} className="relative">
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          placeholder={placeholder}
          blurDataURL={finalBlurDataURL}
          onLoad={handleLoad}
          {...props}
        />
      ) : (
        fallback || (
          <div
            className="bg-neutral-200 dark:bg-neutral-700 animate-pulse"
            style={{
              width: props.width,
              height: props.height,
            }}
          />
        )
      )}
    </div>
  );
}
