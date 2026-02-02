'use client';

/**
 * React Hook for API Error Handling
 * 
 * Provides utilities for handling API errors in React components.
 */

import { useState, useCallback } from 'react';
import { ApiError, handleApiError, formatError, extractFieldErrors } from './errorHandling';

/**
 * API error state
 */
export interface ApiErrorState {
  error: string | null;
  fieldErrors: Record<string, string> | null;
  isError: boolean;
}

/**
 * Hook for managing API errors
 * 
 * @returns API error utilities
 */
export function useApiError() {
  const [state, setState] = useState<ApiErrorState>({
    error: null,
    fieldErrors: null,
    isError: false,
  });

  /**
   * Set error from API response
   */
  const setError = useCallback((error: unknown) => {
    const message = handleApiError(error);
    const fieldErrors = extractFieldErrors(error);

    setState({
      error: message,
      fieldErrors,
      isError: true,
    });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState({
      error: null,
      fieldErrors: null,
      isError: false,
    });
  }, []);

  /**
   * Clear field error
   */
  const clearFieldError = useCallback((field: string) => {
    setState((prev) => {
      if (!prev.fieldErrors) return prev;

      const fieldErrors = { ...prev.fieldErrors };
      delete fieldErrors[field];

      return {
        ...prev,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
      };
    });
  }, []);

  /**
   * Get field error
   */
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return state.fieldErrors?.[field];
    },
    [state.fieldErrors]
  );

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback(
    (field: string): boolean => {
      return !!state.fieldErrors?.[field];
    },
    [state.fieldErrors]
  );

  return {
    // State
    error: state.error,
    fieldErrors: state.fieldErrors,
    isError: state.isError,

    // Actions
    setError,
    clearError,
    clearFieldError,
    getFieldError,
    hasFieldError,
  };
}

/**
 * Hook for API requests with error handling
 * 
 * @returns API request utilities
 */
export function useApiRequest<T = any>() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { error, fieldErrors, isError, setError, clearError } = useApiError();

  /**
   * Execute API request
   */
  const execute = useCallback(
    async (requestFn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      clearError();

      try {
        const result = await requestFn();
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setError, clearError]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setData(null);
    clearError();
  }, [clearError]);

  return {
    // State
    loading,
    data,
    error,
    fieldErrors,
    isError,

    // Actions
    execute,
    reset,
    clearError,
  };
}
