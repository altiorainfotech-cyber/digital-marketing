/**
 * Prefetch Link Component
 * Link component with hover prefetching
 */

'use client';

import Link, { LinkProps } from 'next/link';
import { useHoverPrefetch } from '@/lib/hooks/usePrefetch';

interface PrefetchLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Enable prefetch on hover (default: true)
   */
  prefetchOnHover?: boolean;
}

/**
 * Link component that prefetches on hover
 * Improves perceived performance for navigation
 */
export function PrefetchLink({
  href,
  children,
  className,
  prefetchOnHover = true,
  ...props
}: PrefetchLinkProps) {
  const { getPrefetchProps } = useHoverPrefetch();

  const hrefString = typeof href === 'string' ? href : href.pathname || '/';
  const prefetchProps = prefetchOnHover ? getPrefetchProps(hrefString) : {};

  return (
    <Link href={href} className={className} {...prefetchProps} {...props}>
      {children}
    </Link>
  );
}
