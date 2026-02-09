import React from 'react';
import { Button } from '../../primitives/Button';

export interface EmptyStateProps {
  /**
   * Icon or illustration to display
   */
  icon?: React.ReactNode;
  /**
   * Title of the empty state
   */
  title: string;
  /**
   * Description message
   */
  message?: string;
  /**
   * Action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * EmptyState component displays when no data or content is available.
 * Provides clear messaging and optional action to help users proceed.
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className="mb-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      
      {message && (
        <p className="text-sm text-neutral-700 dark:text-neutral-300 max-w-md mb-6">
          {message}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
