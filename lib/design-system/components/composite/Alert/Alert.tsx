'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Icon } from '../../primitives/Icon';

export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
}

export function Alert({
  type,
  title,
  message,
  dismissible = true,
  onDismiss,
  className = '',
  'data-testid': testId,
  children,
}: AlertProps) {
  // Type-specific styles
  const typeStyles = {
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-500',
      text: 'text-success-900 dark:text-success-100',
      icon: CheckCircle,
      iconColor: 'text-success-500',
    },
    error: {
      bg: 'bg-error-50 dark:bg-error-900/20',
      border: 'border-error-500',
      text: 'text-error-900 dark:text-error-100',
      icon: XCircle,
      iconColor: 'text-error-500',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-500',
      text: 'text-warning-900 dark:text-warning-100',
      icon: AlertTriangle,
      iconColor: 'text-warning-500',
    },
    info: {
      bg: 'bg-info-50 dark:bg-info-900/20',
      border: 'border-info-500',
      text: 'text-info-900 dark:text-info-100',
      icon: Info,
      iconColor: 'text-info-500',
    },
  };
  
  const style = typeStyles[type];
  const IconComponent = style.icon;
  
  return (
    <div
      className={`
        ${style.bg} ${style.border} ${style.text}
        border-l-4 rounded-lg p-4
        flex items-start gap-3
        ${className}
      `}
      role="alert"
      aria-live="polite"
      data-testid={testId}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${style.iconColor}`}>
        <Icon size={24}>
          <IconComponent />
        </Icon>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
        {children}
      </div>
      
      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={onDismiss}
          className={`
            flex-shrink-0 p-1 rounded-lg
            hover:bg-black/5 dark:hover:bg-white/5
            transition-colors duration-150
          `}
          aria-label="Dismiss alert"
        >
          <Icon size={16}>
            <X />
          </Icon>
        </button>
      )}
    </div>
  );
}
