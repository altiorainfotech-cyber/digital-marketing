'use client';

import React from 'react';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  mobilePadding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  'data-testid'?: string;
}

export function Card({
  variant = 'default',
  padding = 'md',
  mobilePadding,
  hoverable = false,
  clickable = false,
  children,
  onClick,
  className = '',
  'data-testid': testId,
}: CardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Base styles with smooth transitions
  const baseStyles = 'rounded-lg transition-all duration-300 ease-out';
  
  // Variant styles
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
    outlined: 'bg-transparent border-2 border-neutral-300 dark:border-neutral-600',
    elevated: 'bg-white dark:bg-neutral-800 shadow-md',
  };
  
  // Padding styles - responsive
  const paddingMap = {
    none: { mobile: '', desktop: '' },
    sm: { mobile: 'p-2', desktop: 'md:p-3' },
    md: { mobile: 'p-3', desktop: 'md:p-4' },
    lg: { mobile: 'p-4', desktop: 'md:p-6' },
  };
  
  const effectiveMobilePadding = mobilePadding || padding;
  const paddingStyles = `${paddingMap[effectiveMobilePadding].mobile} ${paddingMap[padding].desktop}`;
  
  // Hover styles with elevation animation (disabled if reduced motion)
  const hoverStyles = hoverable
    ? prefersReducedMotion
      ? 'hover:shadow-xl'
      : 'hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]'
    : '';
  
  // Clickable styles
  const clickableStyles = clickable || onClick
    ? 'cursor-pointer'
    : '';
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    paddingStyles,
    hoverStyles,
    clickableStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((clickable || onClick) && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };
  
  return (
    <div
      className={combinedClassName}
      onClick={clickable || onClick ? handleClick : undefined}
      onKeyDown={clickable || onClick ? handleKeyDown : undefined}
      role={clickable || onClick ? 'button' : undefined}
      tabIndex={clickable || onClick ? 0 : undefined}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
