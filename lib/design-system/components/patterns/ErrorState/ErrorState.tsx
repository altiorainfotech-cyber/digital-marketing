import React from 'react';
import { Button } from '../../primitives/Button';

export interface ErrorStateProps {
  /**
   * Error icon or illustration
   */
  icon?: React.ReactNode;
  /**
   * Error title
   */
  title?: string;
  /**
   * Error message
   */
  message: string;
  /**
   * Retry action configuration
   */
  retry?: {
    label?: string;
    onClick: () => void;
  };
  /**
   * Additional action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  /**
   * Error severity level
   */
  severity?: 'error' | 'warning';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ErrorState component displays when an error occurs.
 * Provides clear error messaging and retry/action options.
 */
export function ErrorState({
  icon,
  title = 'Something went wrong',
  message,
  retry,
  action,
  severity = 'error',
  className = '',
}: ErrorStateProps) {
  const iconColor = severity === 'error' 
    ? 'text-error-500 dark:text-error-400' 
    : 'text-warning-500 dark:text-warning-400';

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {icon && (
        <div className={`mb-4 ${iconColor}`} aria-hidden="true">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mb-6">
        {message}
      </p>
      
      <div className="flex gap-3">
        {retry && (
          <Button
            variant="primary"
            onClick={retry.onClick}
          >
            {retry.label || 'Try Again'}
          </Button>
        )}
        
        {action && (
          <Button
            variant={action.variant || 'outline'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * InlineError component - compact error display for forms and inline contexts
 */
export interface InlineErrorProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export function InlineError({ message, icon, className = '' }: InlineErrorProps) {
  return (
    <div
      className={`flex items-start gap-2 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg ${className}`}
      role="alert"
    >
      {icon && (
        <div className="flex-shrink-0 text-error-500 dark:text-error-400 mt-0.5" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm text-error-700 dark:text-error-300">
        {message}
      </p>
    </div>
  );
}

/**
 * InlineWarning component - compact warning display
 */
export interface InlineWarningProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export function InlineWarning({ message, icon, className = '' }: InlineWarningProps) {
  return (
    <div
      className={`flex items-start gap-2 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg ${className}`}
      role="alert"
    >
      {icon && (
        <div className="flex-shrink-0 text-warning-500 dark:text-warning-400 mt-0.5" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm text-warning-700 dark:text-warning-300">
        {message}
      </p>
    </div>
  );
}
