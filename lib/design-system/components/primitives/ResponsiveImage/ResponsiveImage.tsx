import React from 'react';
import Image from 'next/image';
import { getShimmerDataURL } from '@/lib/utils/imageUtils';

export interface ResponsiveImageProps {
  /**
   * Image source URL
   */
  src: string;
  /**
   * Alt text for accessibility
   */
  alt: string;
  /**
   * Image width (required for static images)
   */
  width?: number;
  /**
   * Image height (required for static images)
   */
  height?: number;
  /**
   * Whether the image should fill its container
   */
  fill?: boolean;
  /**
   * Object fit style when using fill
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /**
   * Object position when using fill
   */
  objectPosition?: string;
  /**
   * Sizes attribute for responsive images
   * Example: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
   */
  sizes?: string;
  /**
   * Priority loading (for above-the-fold images)
   */
  priority?: boolean;
  /**
   * Loading strategy
   */
  loading?: 'lazy' | 'eager';
  /**
   * Quality of the optimized image (1-100)
   */
  quality?: number;
  /**
   * Placeholder type
   */
  placeholder?: 'blur' | 'empty';
  /**
   * Blur data URL for placeholder
   */
  blurDataURL?: string;
  /**
   * Additional CSS classes for the image
   */
  className?: string;
  /**
   * Additional CSS classes for the wrapper (when using fill)
   */
  wrapperClassName?: string;
  /**
   * Callback when image loads
   */
  onLoad?: () => void;
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
}

/**
 * ResponsiveImage component provides optimized, responsive images using Next.js Image.
 * Automatically handles lazy loading, responsive sizing, and image optimization.
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  sizes,
  priority = false,
  loading = 'lazy',
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  className = '',
  wrapperClassName = '',
  onLoad,
  onError,
}: ResponsiveImageProps) {
  // Default sizes if not provided
  const defaultSizes = fill
    ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : undefined;

  // Use shimmer placeholder if blur is enabled but no custom blurDataURL provided
  const finalBlurDataURL = placeholder === 'blur' 
    ? (blurDataURL || getShimmerDataURL(width, height))
    : undefined;

  const imageProps = {
    src,
    alt,
    quality,
    priority,
    loading: priority ? undefined : loading,
    placeholder,
    blurDataURL: finalBlurDataURL,
    onLoad,
    onError,
    className,
  };

  if (fill) {
    return (
      <div className={`relative ${wrapperClassName}`}>
        <Image
          {...imageProps}
          fill
          sizes={sizes || defaultSizes}
          style={{
            objectFit,
            objectPosition,
          }}
        />
      </div>
    );
  }

  if (!width || !height) {
    console.warn('ResponsiveImage: width and height are required when fill is false');
    return null;
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
      sizes={sizes}
    />
  );
}

/**
 * AspectRatioImage component maintains a specific aspect ratio
 * while being responsive.
 */
export interface AspectRatioImageProps extends Omit<ResponsiveImageProps, 'fill' | 'width' | 'height'> {
  /**
   * Aspect ratio (e.g., '16/9', '4/3', '1/1')
   */
  aspectRatio: '16/9' | '4/3' | '3/2' | '1/1' | '21/9';
}

export function AspectRatioImage({
  aspectRatio,
  wrapperClassName = '',
  ...props
}: AspectRatioImageProps) {
  const aspectRatioClasses = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '1/1': 'aspect-square',
    '21/9': 'aspect-[21/9]',
  };

  return (
    <div className={`relative ${aspectRatioClasses[aspectRatio]} ${wrapperClassName}`}>
      <ResponsiveImage
        {...props}
        fill
        wrapperClassName="w-full h-full"
      />
    </div>
  );
}

/**
 * Avatar image component with fallback
 */
export interface AvatarImageProps {
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Alt text (usually user name)
   */
  alt: string;
  /**
   * Size of the avatar
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Fallback content (initials or icon)
   */
  fallback?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallback,
  className = '',
}: AvatarImageProps) {
  const [hasError, setHasError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const sizePx = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  if (!src || hasError) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full bg-neutral-200 dark:bg-neutral-700
          flex items-center justify-center
          text-neutral-600 dark:text-neutral-300
          font-medium
          ${className}
        `}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={sizePx[size]}
        height={sizePx[size]}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
