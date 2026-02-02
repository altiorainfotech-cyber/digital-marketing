'use client';

import React from 'react';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

export interface LoadingStateProps {
  /**
   * Type of loading state to display
   */
  variant?: 'spinner' | 'skeleton' | 'dots';
  /**
   * Number of skeleton rows to display (only for skeleton variant)
   */
  rows?: number;
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * LoadingState component displays while content is being fetched or processed.
 * Supports spinner, skeleton screens, and dots animations.
 */
export function LoadingState({
  variant = 'spinner',
  rows = 3,
  message,
  className = '',
}: LoadingStateProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-4 ${className}`} role="status" aria-live="polite" aria-label="Loading content">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonRow key={index} prefersReducedMotion={prefersReducedMotion} />
        ))}
        {message && <span className="sr-only">{message}</span>}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`} role="status" aria-live="polite">
        <div className="flex space-x-2">
          <div 
            className={`w-2 h-2 bg-primary-500 rounded-full ${prefersReducedMotion ? '' : 'animate-bounce'}`} 
            style={prefersReducedMotion ? {} : { animationDelay: '0ms' }} 
          />
          <div 
            className={`w-2 h-2 bg-primary-500 rounded-full ${prefersReducedMotion ? '' : 'animate-bounce'}`} 
            style={prefersReducedMotion ? {} : { animationDelay: '150ms' }} 
          />
          <div 
            className={`w-2 h-2 bg-primary-500 rounded-full ${prefersReducedMotion ? '' : 'animate-bounce'}`} 
            style={prefersReducedMotion ? {} : { animationDelay: '300ms' }} 
          />
        </div>
        {message && (
          <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-400">
            {message}
          </span>
        )}
      </div>
    );
  }

  // Default: spinner
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`} role="status" aria-live="polite">
      <Spinner prefersReducedMotion={prefersReducedMotion} />
      {message && (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Spinner component - circular loading indicator
 * Uses fixed dimensions to prevent layout shift
 */
function Spinner({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <div
      className={`w-8 h-8 border-4 border-neutral-200 dark:border-neutral-700 border-t-primary-500 rounded-full flex-shrink-0 ${
        prefersReducedMotion ? '' : 'animate-spin'
      }`}
      aria-label="Loading"
    />
  );
}

/**
 * SkeletonRow component - shimmer loading placeholder
 * Uses fixed heights to prevent layout shift
 */
function SkeletonRow({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <div className={prefersReducedMotion ? '' : 'animate-pulse'}>
      <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
      <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
    </div>
  );
}

/**
 * SkeletonCard component - card-shaped loading placeholder
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <div className={`${prefersReducedMotion ? '' : 'animate-pulse'} ${className}`} role="status" aria-label="Loading">
      <div className={`h-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
      <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
      <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
    </div>
  );
}

/**
 * SkeletonTable component - table-shaped loading placeholder
 */
export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading table">
      {/* Header */}
      <div className="flex space-x-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
        <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
        <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
        <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
        <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={`flex space-x-4 ${prefersReducedMotion ? '' : 'animate-pulse'}`}>
          <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
          <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
          <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
          <div className={`h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 ${prefersReducedMotion ? '' : 'skeleton-shimmer'}`} />
        </div>
      ))}
    </div>
  );
}
