'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Icon } from '../../primitives/Icon';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  className?: string;
  'data-testid'?: string;
}

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className = '',
  'data-testid': testId,
}: ToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
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
        border-l-4 rounded-lg shadow-lg p-4
        flex items-start gap-3
        min-w-[320px] max-w-md
        animate-slide-in-right
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
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        {message && <p className="text-sm opacity-90">{message}</p>}
      </div>
      
      {/* Close button */}
      <button
        onClick={onClose}
        className={`
          flex-shrink-0 p-1 rounded-lg
          hover:bg-black/5 dark:hover:bg-white/5
          transition-colors duration-150
        `}
        aria-label="Close notification"
      >
        <Icon size={16}>
          <X />
        </Icon>
      </button>
    </div>
  );
}
