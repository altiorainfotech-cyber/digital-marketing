/**
 * API Error Handling Utilities
 * 
 * Provides utilities for handling API errors with user-friendly messages
 * and retry functionality.
 */

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * HTTP status code to user-friendly message mapping
 */
const statusMessages: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'You need to sign in to continue.',
  403: "You don't have permission to perform this action.",
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'The data provided is invalid.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service temporarily unavailable. Please try again.',
  504: 'Request timeout. Please try again.',
};

/**
 * Get user-friendly error message for HTTP status code
 * 
 * @param status - HTTP status code
 * @param defaultMessage - Default message if status not found
 * @returns User-friendly error message
 */
export function getErrorMessage(status: number, defaultMessage?: string): string {
  return statusMessages[status] || defaultMessage || 'An unexpected error occurred.';
}

/**
 * Handle API error and return user-friendly message
 * 
 * @param error - Error object
 * @returns User-friendly error message
 */
export function handleApiError(error: unknown): string {
  // Handle ApiError
  if (error instanceof ApiError) {
    return error.message || getErrorMessage(error.status);
  }

  // Handle Response object
  if (error instanceof Response) {
    return getErrorMessage(error.status);
  }

  // Handle Error object
  if (error instanceof Error) {
    return error.message;
  }

  // Handle error object with status
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    if (err.status && typeof err.status === 'number') {
      return err.message || getErrorMessage(err.status);
    }
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }
  }

  // Default error message
  return 'An unexpected error occurred.';
}

/**
 * Parse error response from API
 * 
 * @param response - Response object
 * @returns ApiError
 */
export async function parseErrorResponse(response: Response): Promise<ApiError> {
  let message = getErrorMessage(response.status);
  let code: string | undefined;
  let details: Record<string, any> | undefined;

  try {
    const data = await response.json();
    if (data.message) {
      message = data.message;
    }
    if (data.error) {
      message = data.error;
    }
    if (data.code) {
      code = data.code;
    }
    if (data.details) {
      details = data.details;
    }
    if (data.fields) {
      details = { fields: data.fields };
    }
  } catch {
    // If response is not JSON, use default message
  }

  return new ApiError(response.status, message, code, details);
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: ApiError) => void;
}

/**
 * Default retryable HTTP status codes
 */
const DEFAULT_RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * Fetch with retry functionality
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryConfig - Retry configuration
 * @returns Response
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    onRetry,
  } = retryConfig || {};

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is ok, return it
      if (response.ok) {
        return response;
      }

      // Parse error response
      const error = await parseErrorResponse(response);
      lastError = error;

      // Check if error is retryable
      const isRetryable = retryableStatuses.includes(response.status);
      const hasRetriesLeft = attempt < maxRetries;

      if (isRetryable && hasRetriesLeft) {
        // Call onRetry callback
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        // Wait before retrying (exponential backoff)
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Not retryable or no retries left, throw error
      throw error;
    } catch (error) {
      // If it's not an ApiError, wrap it
      if (!(error instanceof ApiError)) {
        lastError = new ApiError(0, handleApiError(error));
      } else {
        lastError = error;
      }

      // If no retries left, throw error
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // Call onRetry callback
      if (onRetry && lastError) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but throw last error just in case
  throw lastError || new ApiError(0, 'Request failed after retries');
}

/**
 * Check if error is retryable
 * 
 * @param error - Error object
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return DEFAULT_RETRYABLE_STATUSES.includes(error.status);
  }
  if (error instanceof Response) {
    return DEFAULT_RETRYABLE_STATUSES.includes(error.status);
  }
  return false;
}

/**
 * Format error for display
 * 
 * @param error - Error object
 * @returns Formatted error object
 */
export function formatError(error: unknown): {
  title: string;
  message: string;
  details?: Record<string, any>;
} {
  if (error instanceof ApiError) {
    return {
      title: `Error ${error.status}`,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message,
    };
  }

  return {
    title: 'Error',
    message: handleApiError(error),
  };
}

/**
 * Extract field errors from API error
 * 
 * @param error - Error object
 * @returns Field errors object
 */
export function extractFieldErrors(error: unknown): Record<string, string> | null {
  if (error instanceof ApiError && error.details?.fields) {
    return error.details.fields;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    if (err.details?.fields) {
      return err.details.fields;
    }
    if (err.fields) {
      return err.fields;
    }
  }

  return null;
}
