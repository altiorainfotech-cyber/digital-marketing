'use client';

/**
 * Enhanced Form Validation Utilities
 * 
 * Provides comprehensive form validation with field-level and form-level error display.
 * Supports real-time validation and error handling.
 */

import { z, ZodError } from 'zod';
import { useState, useCallback, useEffect } from 'react';
import type { FormErrors, ValidationResult } from './client-validation';

/**
 * Form validation state
 */
export interface FormValidationState {
  errors: FormErrors;
  touched: Set<string>;
  isValidating: boolean;
  isValid: boolean;
}

/**
 * Form validation options
 */
export interface FormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  debounceMs?: number;
}

/**
 * Enhanced hook for form validation with real-time feedback
 * 
 * @param schema - Zod schema to validate against
 * @param options - Validation options
 * @returns Form validation utilities
 */
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  options: FormValidationOptions = {}
) {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    validateOnSubmit = true,
    debounceMs = 300,
  } = options;

  const [state, setState] = useState<FormValidationState>({
    errors: {},
    touched: new Set(),
    isValidating: false,
    isValid: true,
  });

  // Validate entire form
  const validateForm = useCallback(
    (data: unknown): ValidationResult<z.infer<T>> => {
      try {
        const validated = schema.parse(data);
        setState((prev) => ({
          ...prev,
          errors: {},
          isValid: true,
        }));
        return { success: true, data: validated };
      } catch (error) {
        if (error instanceof ZodError) {
          const errors: FormErrors = {};
          error.issues.forEach((err) => {
            const path = err.path.join('.');
            errors[path] = err.message;
          });
          setState((prev) => ({
            ...prev,
            errors,
            isValid: false,
          }));
          return { success: false, errors };
        }
        const genericError = { _form: 'Validation failed' };
        setState((prev) => ({
          ...prev,
          errors: genericError,
          isValid: false,
        }));
        return { success: false, errors: genericError };
      }
    },
    [schema]
  );

  // Validate a single field
  const validateField = useCallback(
    (field: string, value: unknown, formData?: unknown): string | null => {
      try {
        // If we have full form data, validate the entire form to catch cross-field validations
        if (formData) {
          const result = schema.safeParse(formData);
          if (!result.success) {
            const fieldError = result.error.issues.find((err) => err.path.join('.') === field);
            return fieldError?.message || null;
          }
          return null;
        }

        // Otherwise, validate just the field
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
    },
    [schema]
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (field: string, value: unknown, formData?: unknown) => {
      if (validateOnChange && state.touched.has(field)) {
        const error = validateField(field, value, formData);
        setState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: error || '',
          },
        }));
      }
    },
    [validateOnChange, validateField, state.touched]
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (field: string, value: unknown, formData?: unknown) => {
      setState((prev) => ({
        ...prev,
        touched: new Set(prev.touched).add(field),
      }));

      if (validateOnBlur) {
        const error = validateField(field, value, formData);
        setState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: error || '',
          },
        }));
      }
    },
    [validateOnBlur, validateField]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: string) => {
    setState((prev) => {
      const errors = { ...prev.errors };
      delete errors[field];
      return {
        ...prev,
        errors,
        isValid: Object.keys(errors).length === 0,
      };
    });
  }, []);

  // Set field error manually
  const setFieldError = useCallback((field: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
      isValid: false,
    }));
  }, []);

  // Set form-level error
  const setFormError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        _form: error,
      },
      isValid: false,
    }));
  }, []);

  // Reset form validation state
  const reset = useCallback(() => {
    setState({
      errors: {},
      touched: new Set(),
      isValidating: false,
      isValid: true,
    });
  }, []);

  // Get error for a specific field
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return state.errors[field];
    },
    [state.errors]
  );

  // Check if field has error
  const hasFieldError = useCallback(
    (field: string): boolean => {
      return !!state.errors[field];
    },
    [state.errors]
  );

  // Check if field is touched
  const isFieldTouched = useCallback(
    (field: string): boolean => {
      return state.touched.has(field);
    },
    [state.touched]
  );

  return {
    // State
    errors: state.errors,
    touched: state.touched,
    isValidating: state.isValidating,
    isValid: state.isValid,
    hasErrors: Object.keys(state.errors).length > 0,
    formError: state.errors._form,

    // Validation functions
    validateForm,
    validateField,

    // Event handlers
    handleFieldChange,
    handleFieldBlur,

    // Error management
    clearErrors,
    clearFieldError,
    setFieldError,
    setFormError,
    getFieldError,
    hasFieldError,
    isFieldTouched,

    // Reset
    reset,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message || 'Validation failed';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An error occurred';
}

/**
 * Extract field errors from Zod error
 */
export function extractFieldErrors(error: ZodError): FormErrors {
  const errors: FormErrors = {};
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}
