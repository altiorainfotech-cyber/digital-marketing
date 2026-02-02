/**
 * Validation Utilities
 * 
 * Helper functions for validating API inputs using Zod schemas.
 * Provides consistent error handling and formatting.
 */

import { z, ZodError } from 'zod';
import { ValidationError } from '@/lib/errors';
import { NextRequest } from 'next/server';

/**
 * Validate request body against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validateBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert Zod errors to field-level errors
      const fields: Record<string, string> = {};
      const errors = error.issues || [];
      errors.forEach((err) => {
        const path = err.path.join('.');
        fields[path] = err.message;
      });
      throw new ValidationError('Validation failed', fields);
    }
    throw error;
  }
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param searchParams - URLSearchParams from request
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validateQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      // Handle array parameters (e.g., tags[]=value1&tags[]=value2)
      if (key.endsWith('[]')) {
        const arrayKey = key.slice(0, -2);
        if (!params[arrayKey]) {
          params[arrayKey] = [];
        }
        params[arrayKey].push(value);
      } else {
        params[key] = value;
      }
    });

    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert Zod errors to field-level errors
      const fields: Record<string, string> = {};
      const errors = error.issues || [];
      errors.forEach((err) => {
        const path = err.path.join('.');
        fields[path] = err.message;
      });
      throw new ValidationError('Validation failed', fields);
    }
    throw error;
  }
}

/**
 * Parse and validate JSON request body
 * 
 * @param request - NextRequest object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export async function parseAndValidateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return validateBody(schema, body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Parse and validate query parameters
 * 
 * @param request - NextRequest object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function parseAndValidateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const { searchParams } = new URL(request.url);
  return validateQuery(schema, searchParams);
}

/**
 * Safe parse - returns result object instead of throwing
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result object with success flag and data or error
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: ValidationError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const fields: Record<string, string> = {};
      if (error.issues && Array.isArray(error.issues)) {
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          fields[path] = err.message;
        });
      }
      return { success: false, error: new ValidationError('Validation failed', fields) };
    }
    return { success: false, error: new ValidationError('Validation failed') };
  }
}

// Re-export all schemas for convenience
export * from './schemas';

// Re-export client-side validation utilities (avoiding conflicts)
export type { FormErrors, ValidationResult } from './client-validation';
export { validateForm, validateField, validationRules } from './client-validation';

// Re-export enhanced form validation utilities (the main useFormValidation hook)
export type { FormValidationState, FormValidationOptions } from './form-validation';
export { 
  useFormValidation,
  formatValidationError,
  extractFieldErrors 
} from './form-validation';
