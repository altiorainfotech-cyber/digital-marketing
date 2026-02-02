/**
 * API Error Handler
 * 
 * Centralized error handling for API routes.
 * Provides consistent error responses and logging.
 */

import { NextResponse } from 'next/server';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  StorageError,
  DatabaseError,
  ExternalServiceError,
  formatErrorResponse,
  logError,
} from './index';

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(
  error: Error,
  context?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): NextResponse {
  // Log the error with context
  logError(error, context);

  // Format error response
  const { response, statusCode } = formatErrorResponse(error);

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof Error) {
        return handleApiError(error) as any;
      }
      return handleApiError(new Error('Unknown error occurred')) as any;
    }
  };
}

/**
 * Parse and validate common error patterns from service layer
 */
export function parseServiceError(error: any): AppError {
  // If it's already an AppError (including ValidationError), return it as-is
  if (error instanceof AppError) {
    return error;
  }

  const message = error.message || 'An error occurred';

  // Check for specific error patterns
  if (message.includes('already exists')) {
    return new ConflictError(message);
  }

  if (message.includes('not found')) {
    return new NotFoundError(message);
  }

  if (
    message.includes('required') ||
    message.includes('Invalid') ||
    message.includes('cannot exceed') ||
    message.includes('Cannot have more than') ||
    message.includes('must be')
  ) {
    return new ValidationError(message);
  }

  if (message.includes('Unauthorized') || message.includes('authentication')) {
    return new AuthenticationError(message);
  }

  if (message.includes('permission') || message.includes('Forbidden')) {
    return new AuthorizationError(message);
  }

  if (message.includes('file size') || message.includes('too large')) {
    return new PayloadTooLargeError(message);
  }

  if (message.includes('storage') || message.includes('upload') || message.includes('download')) {
    return new StorageError(message);
  }

  if (message.includes('database') || message.includes('query')) {
    return new DatabaseError(message);
  }

  // Default to generic app error
  return new AppError(message, 500);
}

// Re-export error classes for convenience
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  StorageError,
  DatabaseError,
  ExternalServiceError,
};
