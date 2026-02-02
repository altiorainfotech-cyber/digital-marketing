# Input Component

## Purpose

The Input component provides a flexible and accessible text input field with support for labels, icons, validation, and various input types. It's the foundation for all form inputs in the application.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `undefined` | Label text for the input |
| `error` | `string` | `undefined` | Error message to display |
| `helperText` | `string` | `undefined` | Helper text below input |
| `icon` | `React.ReactNode` | `undefined` | Icon to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Position of the icon |
| `fullWidth` | `boolean` | `false` | Makes input full width |
| `labelType` | `'floating' \| 'fixed'` | `'fixed'` | Label style |
| `type` | `string` | `'text'` | HTML input type |
| `disabled` | `boolean` | `false` | Disables the input |
| `required` | `boolean` | `false` | Marks field as required |

All standard HTML input attributes are also supported.

## Input Types

- `text` - Standard text input
- `email` - Email address input
- `password` - Password input with visibility toggle
- `number` - Numeric input
- `date` - Date picker
- `search` - Search input
- `tel` - Telephone number
- `url` - URL input

## Label Types

### Fixed Label
Label appears above the input field.
```tsx
<Input label="Email" labelType="fixed" />
```

### Floating Label
Label floats up when input is focused or has value.
```tsx
<Input label="Email" labelType="floating" />
```

## States

### Default
Normal interactive state with gray border.

### Focus
Blue border and ring when focused.

### Error
Red border and error message displayed.

### Disabled
Reduced opacity with gray background.

### With Value
Floating label stays in raised position.

## Usage Examples

### Basic Input
```tsx
import { Input } from '@/lib/design-system/components/primitives/Input';

<Input
  label="Full Name"
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

### Input with Icon
```tsx
import { Search } from 'lucide-react';

<Input
  label="Search"
  icon={<Search size={20} />}
  iconPosition="left"
  placeholder="Search assets..."
/>
```

### Password Input
```tsx
<Input
  type="password"
  label="Password"
  required
/>
```
*Note: Password inputs automatically include a visibility toggle button.*

### Input with Error
```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
/>
```

### Input with Helper Text
```tsx
<Input
  label="Username"
  helperText="Must be 3-20 characters"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

### Floating Label Input
```tsx
<Input
  label="Email Address"
  labelType="floating"
  type="email"
/>
```

### Full Width Input
```tsx
<Input
  label="Description"
  fullWidth
  placeholder="Enter description"
/>
```

## Accessibility Guidelines

- **Labels**: Always provide a label for screen readers
- **Required Fields**: Marked with asterisk (*) and `required` attribute
- **Error Messages**: Associated with input via ARIA
- **Focus Indicators**: Clear blue ring on focus
- **Keyboard Navigation**: Fully accessible via Tab key
- **Password Toggle**: Includes ARIA label for screen readers

### Best Practices

✅ **Do:**
- Always provide a label (visible or aria-label)
- Use appropriate input types (email, tel, url, etc.)
- Provide clear error messages
- Use helper text for format requirements
- Mark required fields with asterisk
- Use floating labels for modern, compact forms

❌ **Don't:**
- Use placeholder as the only label
- Disable inputs without explanation
- Use vague error messages like "Invalid input"
- Rely on color alone to indicate errors
- Make inputs too narrow for expected content

## Validation

The Input component supports both client-side and server-side validation:

```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const validateEmail = (value: string) => {
  if (!value) {
    setError('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(value)) {
    setError('Please enter a valid email');
  } else {
    setError('');
  }
};

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  }}
  error={error}
  required
/>
```

## Responsive Behavior

- Maintains consistent sizing across breakpoints
- Touch targets meet minimum 44x44px on mobile
- Full width option for mobile-first layouts
- Icons scale appropriately

## Related Components

- **Label**: Standalone label component
- **ErrorMessage**: Standalone error message component
- **HelperText**: Standalone helper text component
- **Icon**: For input icons
