'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '../Alert';

export interface FormErrorBannerProps {
  error?: string;
  errors?: string[];
  onDismiss?: () => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * FormErrorBanner component for displaying form-level errors
 * 
 * Displays a single error message or multiple error messages in a banner format.
 * Used at the top of forms to show validation or submission errors.
 */
export function FormErrorBanner({
  error,
  errors,
  onDismiss,
  className = '',
  'data-testid': testId,
}: FormErrorBannerProps) {
  // Don't render if no errors
  if (!error && (!errors || errors.length === 0)) {
    return null;
  }

  // Single error message
  if (error && !errors) {
    return (
      <Alert
        type="error"
        title="Error"
        message={error}
        dismissible={!!onDismiss}
        onDismiss={onDismiss}
        className={className}
        data-testid={testId}
      />
    );
  }

  // Multiple error messages
  if (errors && errors.length > 0) {
    return (
      <Alert
        type="error"
        title={errors.length === 1 ? 'Error' : `${errors.length} Errors`}
        message={
          errors.length === 1
            ? errors[0]
            : ''
        }
        dismissible={!!onDismiss}
        onDismiss={onDismiss}
        className={className}
        data-testid={testId}
      >
        {errors.length > 1 && (
          <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        )}
      </Alert>
    );
  }

  return null;
}
