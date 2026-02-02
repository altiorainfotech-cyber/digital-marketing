# Alert Component

## Purpose

The Alert component displays important messages to users with color-coded styling based on message type. It's used for success confirmations, error messages, warnings, and informational notices.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | required | Alert type/severity |
| `title` | `string` | `undefined` | Optional alert title |
| `message` | `string` | required | Alert message text |
| `dismissible` | `boolean` | `true` | Shows dismiss button |
| `onDismiss` | `() => void` | `undefined` | Dismiss callback |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `React.ReactNode` | `undefined` | Additional content |

## Alert Types

### Success
Used for positive confirmations and successful operations.

```tsx
<Alert
  type="success"
  title="Success!"
  message="Your changes have been saved."
/>
```

**Visual**: Green background, checkmark icon

### Error
Used for errors and failed operations.

```tsx
<Alert
  type="error"
  title="Error"
  message="Failed to save changes. Please try again."
/>
```

**Visual**: Red background, X circle icon

### Warning
Used for caution messages and potential issues.

```tsx
<Alert
  type="warning"
  title="Warning"
  message="This action cannot be undone."
/>
```

**Visual**: Yellow/orange background, triangle icon

### Info
Used for informational messages and tips.

```tsx
<Alert
  type="info"
  title="Tip"
  message="You can use keyboard shortcuts to navigate faster."
/>
```

**Visual**: Blue background, info icon

## Usage Examples

### Basic Alert
```tsx
import { Alert } from '@/lib/design-system/components/composite/Alert';

<Alert
  type="success"
  message="Operation completed successfully."
/>
```

### Alert with Title
```tsx
<Alert
  type="error"
  title="Upload Failed"
  message="The file size exceeds the maximum limit of 10MB."
/>
```

### Non-Dismissible Alert
```tsx
<Alert
  type="warning"
  message="Maintenance scheduled for tonight at 2 AM."
  dismissible={false}
/>
```

### Alert with Dismiss Handler
```tsx
const [showAlert, setShowAlert] = useState(true);

{showAlert && (
  <Alert
    type="info"
    message="New features are available!"
    onDismiss={() => setShowAlert(false)}
  />
)}
```

### Alert with Additional Content
```tsx
<Alert
  type="warning"
  title="Account Expiring"
  message="Your trial period ends in 3 days."
>
  <Button size="sm" variant="outline" className="mt-2">
    Upgrade Now
  </Button>
</Alert>
```

### Form Validation Alert
```tsx
<Alert
  type="error"
  title="Form Validation Failed"
  message="Please correct the following errors:"
>
  <ul className="mt-2 list-disc list-inside text-sm">
    <li>Email is required</li>
    <li>Password must be at least 8 characters</li>
  </ul>
</Alert>
```

### Multiple Alerts
```tsx
<div className="space-y-4">
  <Alert type="success" message="Profile updated successfully." />
  <Alert type="info" message="Remember to verify your email." />
</div>
```

## Accessibility Guidelines

- **ARIA Role**: Uses `role="alert"` for screen readers
- **Live Region**: Uses `aria-live="polite"` for announcements
- **Color Independence**: Uses icons in addition to color
- **Keyboard Navigation**: Dismiss button is keyboard accessible
- **Focus Management**: Dismiss button receives focus

### Best Practices

✅ **Do:**
- Use appropriate type for the message context
- Provide clear, actionable messages
- Include a title for complex alerts
- Use dismissible alerts for non-critical messages
- Place alerts near related content
- Use icons to reinforce message type

❌ **Don't:**
- Use alerts for every minor message (use Toast instead)
- Make critical alerts dismissible
- Use vague messages like "Error occurred"
- Stack too many alerts (max 2-3 visible)
- Use alerts for loading states
- Rely solely on color to convey meaning

## Alert Patterns

### Success Pattern
```tsx
// After successful form submission
<Alert
  type="success"
  title="Saved!"
  message="Your changes have been saved successfully."
  onDismiss={() => setShowSuccess(false)}
/>
```

### Error Pattern
```tsx
// After failed operation
<Alert
  type="error"
  title="Error"
  message="Failed to process your request. Please try again."
  dismissible={false}
>
  <Button size="sm" variant="outline" className="mt-2" onClick={retry}>
    Retry
  </Button>
</Alert>
```

### Warning Pattern
```tsx
// Before destructive action
<Alert
  type="warning"
  title="Confirm Deletion"
  message="This action cannot be undone. Are you sure?"
  dismissible={false}
>
  <div className="flex gap-2 mt-3">
    <Button size="sm" variant="danger" onClick={handleDelete}>
      Delete
    </Button>
    <Button size="sm" variant="outline" onClick={handleCancel}>
      Cancel
    </Button>
  </div>
</Alert>
```

### Info Pattern
```tsx
// Helpful information
<Alert
  type="info"
  message="You can drag and drop files to upload them."
/>
```

## Positioning

### Page-Level Alert
```tsx
<div className="container mx-auto p-4">
  <Alert type="info" message="System maintenance tonight." />
  {/* Page content */}
</div>
```

### Form-Level Alert
```tsx
<form>
  {error && (
    <Alert type="error" message={error} className="mb-4" />
  )}
  <Input label="Email" />
  <Button type="submit">Submit</Button>
</form>
```

### Inline Alert
```tsx
<div className="space-y-4">
  <Input label="Password" error={passwordError} />
  {passwordError && (
    <Alert
      type="error"
      message="Password must meet security requirements."
      className="mt-2"
    />
  )}
</div>
```

## Responsive Behavior

- Maintains padding on mobile
- Text wraps appropriately
- Icons scale with content
- Dismiss button remains accessible
- Stacks content vertically on narrow screens

## Dark Mode Support

Automatically adapts to dark mode:
- Background colors adjust for visibility
- Text colors remain readable
- Icons maintain contrast
- Border colors adapt

## Related Components

- **Toast**: For temporary notifications
- **Modal**: For important messages requiring action
- **Banner**: For persistent page-level messages
- **Icon**: For alert icons
- **Button**: For alert actions
