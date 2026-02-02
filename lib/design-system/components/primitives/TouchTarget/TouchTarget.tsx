import React from 'react';

export interface TouchTargetProps {
  /**
   * Content to render
   */
  children: React.ReactNode;
  /**
   * Minimum size for touch target (default: 44)
   */
  minSize?: 44 | 48;
  /**
   * Whether to apply minimum size only on mobile (default: true)
   */
  mobileOnly?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TouchTarget component ensures interactive elements meet minimum
 * touch target size requirements (44x44px) for mobile accessibility.
 */
export function TouchTarget({
  children,
  minSize = 44,
  mobileOnly = true,
  className = '',
}: TouchTargetProps) {
  const sizeClass = minSize === 44 ? 'min-w-[44px] min-h-[44px]' : 'min-w-[48px] min-h-[48px]';
  const responsiveClass = mobileOnly ? `md:min-w-0 md:min-h-0` : '';

  return (
    <div
      className={`inline-flex items-center justify-center ${sizeClass} ${responsiveClass} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * TouchableArea component provides a larger touch area for small interactive elements.
 * Useful for icons, checkboxes, and other small controls.
 */
export interface TouchableAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content to render
   */
  children: React.ReactNode;
  /**
   * Size of the touchable area (default: 44)
   */
  size?: 44 | 48 | 56;
  /**
   * Whether the element is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function TouchableArea({
  children,
  size = 44,
  disabled = false,
  className = '',
  ...props
}: TouchableAreaProps) {
  const sizeClasses = {
    44: 'w-11 h-11',
    48: 'w-12 h-12',
    56: 'w-14 h-14',
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
}
