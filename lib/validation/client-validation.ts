'use client';

/**
 * Client-Side Validation Utilities
 * 
 * Provides validation helpers for client-side forms.
 * Uses the same Zod schemas as server-side validation for consistency.
 */

import { z, ZodError } from 'zod';
import { useState, useCallback } from 'react';

/**
 * Form validation errors
 */
export interface FormErrors {
  [key: string]: string;
}

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: FormErrors;
}

/**
 * Validate form data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Form data to validate
 * @returns Validation result with data or errors
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: FormErrors = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'Validation failed' } };
  }
}

/**
 * Hook for form validation
 * 
 * @param schema - Zod schema to validate against
 * @returns Validation function and errors state
 */
export function useFormValidation<T extends z.ZodType>(schema: T) {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback(
    (data: unknown): ValidationResult<z.infer<T>> => {
      const result = validateForm(schema, data);
      if (!result.success && result.errors) {
        setErrors(result.errors);
      } else {
        setErrors({});
      }
      return result;
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return {
    validate,
    errors,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}

/**
 * Validate a single field
 * 
 * @param schema - Zod schema to validate against
 * @param field - Field name to validate
 * @param value - Field value
 * @returns Error message or null
 */
export function validateField<T extends z.ZodType>(
  schema: T,
  field: string,
  value: unknown
): string | null {
  try {
    // Create a partial schema for the field
    const fieldPath = field.split('.');
    let fieldSchema: any = schema;
    
    // Navigate to the field schema
    for (const key of fieldPath) {
      if (fieldSchema instanceof z.ZodObject) {
        fieldSchema = fieldSchema.shape[key];
      }
    }

    if (fieldSchema) {
      fieldSchema.parse(value);
    }
    return null;
  } catch (error) {
    if (error instanceof ZodError) {
      return error.issues[0]?.message || 'Invalid value';
    }
    return 'Invalid value';
  }
}

/**
 * Common validation rules for reuse
 */
export const validationRules = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  required: (fieldName: string) => z.string().min(1, `${fieldName} is required`),
  maxLength: (max: number, fieldName: string) =>
    z.string().max(max, `${fieldName} cannot exceed ${max} characters`),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  tags: z.array(z.string()).max(20, 'Cannot have more than 20 tags').optional(),
  url: z.string().url('Invalid URL'),
  uuid: z.string().uuid('Invalid ID'),
};
