import React from 'react';

export interface ResponsiveGridProps {
  /**
   * Grid items
   */
  children: React.ReactNode;
  /**
   * Number of columns on mobile (default: 1)
   */
  mobileColumns?: 1 | 2;
  /**
   * Number of columns on tablet (default: 2)
   */
  tabletColumns?: 2 | 3 | 4;
  /**
   * Number of columns on desktop (default: 3)
   */
  desktopColumns?: 2 | 3 | 4 | 5 | 6;
  /**
   * Gap between items (default: 4)
   */
  gap?: 2 | 3 | 4 | 6 | 8;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ResponsiveGrid component provides a responsive grid layout that adapts
 * to different screen sizes. Automatically converts to single column on mobile.
 */
export function ResponsiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 4,
  className = '',
}: ResponsiveGridProps) {
  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  const mobileColClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
  };

  const tabletColClasses = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };

  const desktopColClasses = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  };

  return (
    <div
      className={`
        grid
        ${mobileColClasses[mobileColumns]}
        ${tabletColClasses[tabletColumns]}
        ${desktopColClasses[desktopColumns]}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveStack component stacks items vertically on mobile
 * and horizontally on larger screens.
 */
export interface ResponsiveStackProps {
  /**
   * Stack items
   */
  children: React.ReactNode;
  /**
   * Direction on desktop (default: 'horizontal')
   */
  desktopDirection?: 'horizontal' | 'vertical';
  /**
   * Gap between items (default: 4)
   */
  gap?: 2 | 3 | 4 | 6 | 8;
  /**
   * Alignment of items
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ResponsiveStack({
  children,
  desktopDirection = 'horizontal',
  gap = 4,
  align = 'stretch',
  className = '',
}: ResponsiveStackProps) {
  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const directionClasses =
    desktopDirection === 'horizontal'
      ? 'flex-col md:flex-row'
      : 'flex-col';

  return (
    <div
      className={`
        flex
        ${directionClasses}
        ${gapClasses[gap]}
        ${alignClasses[align]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveContainer component provides consistent padding and max-width
 * that adapts to different screen sizes.
 */
export interface ResponsiveContainerProps {
  /**
   * Container content
   */
  children: React.ReactNode;
  /**
   * Maximum width (default: '7xl')
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
  /**
   * Padding size (default: 'default')
   */
  padding?: 'none' | 'sm' | 'default' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ResponsiveContainer({
  children,
  maxWidth = '7xl',
  padding = 'default',
  className = '',
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    default: 'px-4 py-4 sm:px-6 lg:px-8',
    lg: 'px-6 py-6 sm:px-8 lg:px-12',
  };

  return (
    <div
      className={`
        mx-auto w-full
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
