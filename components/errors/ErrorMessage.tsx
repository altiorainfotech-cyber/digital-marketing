'use client';

/**
 * Error Message Component
 * 
 * Displays error messages in a consistent format across the application.
 * Supports different error types and field-level validation errors.
 */

import React from 'react';

interface ErrorMessageProps {
  error?: string | null;
  fields?: Record<string, string>;
  className?: string;
}

export function ErrorMessage({ error, fields, className = '' }: ErrorMessageProps) {
  if (!error && !fields) {
    return null;
  }

  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          {error && (
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          )}
          {fields && Object.keys(fields).length > 0 && (
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(fields).map(([field, message]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span> {message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Field Error Component
 * 
 * Displays error message for a specific form field
 */
interface FieldErrorProps {
  error?: string | null;
  className?: string;
}

export function FieldError({ error, className = '' }: FieldErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <p className={`mt-1 text-sm text-red-600 ${className}`}>
      {error}
    </p>
  );
}
