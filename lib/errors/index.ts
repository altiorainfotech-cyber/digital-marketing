/**
 * Error Classes and Error Handling Utilities
 * 
 * Provides standardized error classes and error response formatting
 * for consistent error handling across the application.
 * 
 * Error Categories:
 * - ValidationError: Invalid input data
 * - AuthenticationError: Invalid credentials, expired sessions
 * - AuthorizationError: Insufficient permissions
 * - StorageError: Upload/download failures
 * - DatabaseError: Database operation failures
 * - ExternalServiceError: External service failures
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error for invalid input data
 * HTTP Status: 400 Bad Request
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400);
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error for invalid credentials or expired sessions
 * HTTP Status: 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error for insufficient permissions
 * HTTP Status: 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error for missing resources
 * HTTP Status: 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error for duplicate resources
 * HTTP Status: 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Payload too large error for file size violations
 * HTTP Status: 413 Payload Too Large
 */
export class PayloadTooLargeError extends AppError {
  constructor(message: string = 'File size exceeds maximum allowed') {
    super(message, 413);
    Object.setPrototypeOf(this, PayloadTooLargeError.prototype);
  }
}

/**
 * Storage error for upload/download failures
 * HTTP Status: 500 Internal Server Error (or 503 for service unavailability)
 */
export class StorageError extends AppError {
  public readonly retryable: boolean;

  constructor(message: string, retryable: boolean = true, statusCode: number = 500) {
    super(message, statusCode);
    this.retryable = retryable;
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Database error for database operation failures
 * HTTP Status: 500 Internal Server Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, false); // Not operational - indicates system issue
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * External service error for third-party service failures
 * HTTP Status: 503 Service Unavailable
 */
export class ExternalServiceError extends AppError {
  public readonly serviceName: string;
  public readonly retryable: boolean;

  constructor(serviceName: string, message: string, retryable: boolean = true) {
    super(message, 503);
    this.serviceName = serviceName;
    this.retryable = retryable;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * Format error response for API
 */
export interface ErrorResponse {
  error: string;
  fields?: Record<string, string>;
  retryable?: boolean;
  serviceName?: string;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error): { response: ErrorResponse; statusCode: number } {
  // Handle known application errors
  if (error instanceof ValidationError) {
    return {
      response: {
        error: error.message,
        fields: error.fields,
      },
      statusCode: error.statusCode,
    };
  }

  if (error instanceof StorageError) {
    return {
      response: {
        error: error.message,
        retryable: error.retryable,
      },
      statusCode: error.statusCode,
    };
  }

  if (error instanceof ExternalServiceError) {
    return {
      response: {
        error: error.message,
        serviceName: error.serviceName,
        retryable: error.retryable,
      },
      statusCode: error.statusCode,
    };
  }

  if (error instanceof AppError) {
    return {
      response: {
        error: error.message,
      },
      statusCode: error.statusCode,
    };
  }

  // Handle unknown errors
  console.error('Unhandled error:', error);
  return {
    response: {
      error: 'An unexpected error occurred',
    },
    statusCode: 500,
  };
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): void {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // In production, this would send to a logging service (e.g., Sentry, CloudWatch)
  console.error('Error logged:', JSON.stringify(errorLog, null, 2));
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
