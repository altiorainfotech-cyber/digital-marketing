# Button Component

## Purpose

The Button component is a fundamental interactive element used throughout the application for user actions. It provides consistent styling, multiple variants, and built-in accessibility features.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Shows loading spinner and disables button |
| `icon` | `React.ReactNode` | `undefined` | Icon to display alongside text |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Position of the icon |
| `fullWidth` | `boolean` | `false` | Makes button full width |
| `mobileFullWidth` | `boolean` | `false` | Makes button full width on mobile only |
| `disabled` | `boolean` | `false` | Disables the button |
| `children` | `React.ReactNode` | required | Button text content |

All standard HTML button attributes are also supported.

## Variants

### Primary
Used for primary actions and main CTAs.
```tsx
<Button variant="primary">Save Changes</Button>
```

### Secondary
Used for secondary actions.
```tsx
<Button variant="secondary">Cancel</Button>
```

### Outline
Used for tertiary actions with emphasis.
```tsx
<Button variant="outline">Learn More</Button>
```

### Ghost
Used for subtle actions without visual weight.
```tsx
<Button variant="ghost">Skip</Button>
```

### Danger
Used for destructive actions.
```tsx
<Button variant="danger">Delete</Button>
```

## Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

## States

### Default
Normal interactive state.

### Hover
Scales up slightly (unless reduced motion is preferred).

### Active
Scales down slightly when pressed.

### Focus
Shows focus ring for keyboard navigation.

### Disabled
Reduced opacity and non-interactive.

### Loading
Shows spinner and is non-interactive.

## Usage Examples

### Basic Button
```tsx
import { Button } from '@/lib/design-system/components/primitives/Button';

<Button onClick={handleClick}>
  Click Me
</Button>
```

### Button with Icon
```tsx
import { Download } from 'lucide-react';

<Button icon={<Download size={16} />} iconPosition="left">
  Download
</Button>
```

### Loading Button
```tsx
<Button loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

### Full Width Button
```tsx
<Button fullWidth variant="primary">
  Sign In
</Button>
```

### Mobile Full Width
```tsx
<Button mobileFullWidth variant="primary">
  Continue
</Button>
```

## Accessibility Guidelines

- **Keyboard Navigation**: Fully accessible via Tab key
- **Focus Indicators**: Clear focus ring visible for keyboard users
- **Screen Readers**: Use descriptive text for button content
- **Loading State**: Button is disabled during loading to prevent duplicate submissions
- **Disabled State**: Properly marked with `disabled` attribute
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

### Best Practices

✅ **Do:**
- Use descriptive button text that clearly indicates the action
- Use primary variant for the main action on a page
- Use danger variant for destructive actions
- Provide loading state for async operations
- Use icons to enhance clarity (not replace text)

❌ **Don't:**
- Use multiple primary buttons in the same context
- Use vague text like "Click Here" or "Submit"
- Rely solely on icons without text for important actions
- Disable buttons without explanation
- Use danger variant for non-destructive actions

## Responsive Behavior

- Maintains consistent padding and sizing across breakpoints
- `mobileFullWidth` prop makes button full width on mobile (<768px)
- Touch targets meet minimum 44x44px requirement on mobile
- Hover effects are disabled on touch devices

## Related Components

- **Icon**: For button icons
- **LoadingSpinner**: Internal loading indicator
