# Form Validation System

Comprehensive form validation utilities with field-level and form-level error display, real-time validation, and error handling.

## Features

- Zod schema-based validation
- Field-level error display
- Form-level error banner
- Real-time validation (onChange, onBlur)
- Touch tracking
- Field error management
- Integration with API error handling

## Usage

### Basic Form Validation

```tsx
import { useFormValidation } from '@/lib/validation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const validation = useFormValidation(loginSchema, {
    validateOnBlur: true,
    validateOnChange: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = validation.validateForm(formData);
    if (!result.success) {
      return;
    }

    // Submit form
    await submitLogin(result.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {validation.formError && (
        <FormErrorBanner error={validation.formError} />
      )}

      <Input
        label="Email"
        value={formData.email}
        onChange={(value) => {
          setFormData({ ...formData, email: value });
          validation.handleFieldChange('email', value, { ...formData, email: value });
        }}
        onBlur={() => validation.handleFieldBlur('email', formData.email, formData)}
        error={validation.getFieldError('email')}
      />

      <Input
        type="password"
        label="Password"
        value={formData.password}
        onChange={(value) => {
          setFormData({ ...formData, password: value });
          validation.handleFieldChange('password', value, { ...formData, password: value });
        }}
        onBlur={() => validation.handleFieldBlur('password', formData.password, formData)}
        error={validation.getFieldError('password')}
      />

      <Button type="submit" disabled={validation.hasErrors}>
        Sign In
      </Button>
    </form>
  );
}
```

### Form with API Error Handling

```tsx
import { useFormValidation } from '@/lib/validation';
import { useApiRequest } from '@/lib/utils';
import { FormErrorBanner } from '@/lib/design-system/components/composite';

function CreateUserForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const validation = useFormValidation(createUserSchema);
  const api = useApiRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const result = validation.validateForm(formData);
    if (!result.success) {
      return;
    }

    // Submit to API
    const response = await api.execute(async () => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const error = await parseErrorResponse(res);
        throw error;
      }

      return res.json();
    });

    if (response) {
      // Success
      console.log('User created:', response);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Show API errors */}
      {api.error && <FormErrorBanner error={api.error} />}

      {/* Show validation errors */}
      {validation.formError && <FormErrorBanner error={validation.formError} />}

      <Input
        label="Name"
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        error={validation.getFieldError('name') || api.fieldErrors?.name}
      />

      <Input
        label="Email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        error={validation.getFieldError('email') || api.fieldErrors?.email}
      />

      <Button type="submit" loading={api.loading}>
        Create User
      </Button>
    </form>
  );
}
```

### API Error Handling with Retry

```tsx
import { fetchWithRetry, ApiError } from '@/lib/utils';

async function fetchData() {
  try {
    const response = await fetchWithRetry('/api/data', {
      method: 'GET',
    }, {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error.message);
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.status, error.message);
    }
    throw error;
  }
}
```

## API Reference

### useFormValidation

Hook for form validation with real-time feedback.

**Options:**
- `validateOnChange`: Validate field on change (default: false)
- `validateOnBlur`: Validate field on blur (default: true)
- `validateOnSubmit`: Validate form on submit (default: true)
- `debounceMs`: Debounce delay for validation (default: 300)

**Returns:**
- `errors`: Field errors object
- `touched`: Set of touched fields
- `isValidating`: Validation in progress
- `isValid`: Form is valid
- `hasErrors`: Form has errors
- `formError`: Form-level error
- `validateForm(data)`: Validate entire form
- `validateField(field, value, formData?)`: Validate single field
- `handleFieldChange(field, value, formData?)`: Handle field change
- `handleFieldBlur(field, value, formData?)`: Handle field blur
- `clearErrors()`: Clear all errors
- `clearFieldError(field)`: Clear field error
- `setFieldError(field, error)`: Set field error
- `setFormError(error)`: Set form-level error
- `getFieldError(field)`: Get field error
- `hasFieldError(field)`: Check if field has error
- `isFieldTouched(field)`: Check if field is touched
- `reset()`: Reset validation state

### useApiError

Hook for managing API errors.

**Returns:**
- `error`: Error message
- `fieldErrors`: Field errors object
- `isError`: Has error
- `setError(error)`: Set error
- `clearError()`: Clear error
- `clearFieldError(field)`: Clear field error
- `getFieldError(field)`: Get field error
- `hasFieldError(field)`: Check if field has error

### useApiRequest

Hook for API requests with error handling.

**Returns:**
- `loading`: Request in progress
- `data`: Response data
- `error`: Error message
- `fieldErrors`: Field errors object
- `isError`: Has error
- `execute(requestFn)`: Execute request
- `reset()`: Reset state
- `clearError()`: Clear error

### Error Handling Functions

- `handleApiError(error)`: Get user-friendly error message
- `getErrorMessage(status, defaultMessage?)`: Get message for status code
- `parseErrorResponse(response)`: Parse error from Response
- `fetchWithRetry(url, options?, retryConfig?)`: Fetch with retry
- `isRetryableError(error)`: Check if error is retryable
- `formatError(error)`: Format error for display
- `extractFieldErrors(error)`: Extract field errors from error

## Components

### FormErrorBanner

Displays form-level errors in a banner format.

```tsx
<FormErrorBanner
  error="Form submission failed"
  onDismiss={() => clearError()}
/>

// Multiple errors
<FormErrorBanner
  errors={['Email is required', 'Password is too short']}
/>
```

### Alert

Displays important messages with color-coded styling.

```tsx
<Alert
  type="error"
  title="Error"
  message="Something went wrong"
  dismissible
  onDismiss={() => {}}
/>
```
