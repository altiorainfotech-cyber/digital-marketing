# Card Component

## Purpose

The Card component is a versatile container used to group related content and actions. It provides consistent styling, elevation effects, and interactive states for displaying information in a structured format.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outlined' \| 'elevated'` | `'default'` | Visual style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `mobilePadding` | `'none' \| 'sm' \| 'md' \| 'lg'` | same as `padding` | Mobile-specific padding |
| `hoverable` | `boolean` | `false` | Enables hover elevation effect |
| `clickable` | `boolean` | `false` | Makes card interactive |
| `onClick` | `() => void` | `undefined` | Click handler |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `React.ReactNode` | required | Card content |

## Variants

### Default
Standard card with white background and subtle border.
```tsx
<Card variant="default">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</Card>
```

### Outlined
Transparent background with prominent border.
```tsx
<Card variant="outlined">
  <h3>Outlined Card</h3>
  <p>Emphasizes the border.</p>
</Card>
```

### Elevated
Card with shadow for depth and hierarchy.
```tsx
<Card variant="elevated">
  <h3>Elevated Card</h3>
  <p>Appears to float above the page.</p>
</Card>
```

## Padding Options

```tsx
<Card padding="none">No padding</Card>
<Card padding="sm">Small padding (8px/12px)</Card>
<Card padding="md">Medium padding (12px/16px)</Card>
<Card padding="lg">Large padding (16px/24px)</Card>
```

### Mobile-Specific Padding
```tsx
<Card padding="lg" mobilePadding="sm">
  Larger padding on desktop, smaller on mobile
</Card>
```

## Interactive States

### Hoverable Card
Elevates on hover with smooth animation.
```tsx
<Card hoverable>
  <h3>Hover over me</h3>
  <p>I'll lift up!</p>
</Card>
```

### Clickable Card
Makes entire card interactive.
```tsx
<Card clickable onClick={() => navigate('/details')}>
  <h3>Click anywhere</h3>
  <p>The entire card is clickable.</p>
</Card>
```

## Usage Examples

### Basic Content Card
```tsx
import { Card } from '@/lib/design-system/components/composite/Card';

<Card>
  <h2 className="text-xl font-semibold mb-2">Welcome</h2>
  <p className="text-gray-600">
    This is a basic card with default styling.
  </p>
</Card>
```

### Stat Card
```tsx
<Card variant="elevated" padding="lg">
  <div className="flex items-center gap-4">
    <div className="p-3 bg-blue-100 rounded-lg">
      <Users size={24} className="text-blue-600" />
    </div>
    <div>
      <p className="text-sm text-gray-600">Total Users</p>
      <p className="text-2xl font-bold">1,234</p>
    </div>
  </div>
</Card>
```

### Interactive Asset Card
```tsx
<Card
  hoverable
  clickable
  onClick={() => handleAssetClick(asset.id)}
  className="overflow-hidden"
>
  <img
    src={asset.thumbnail}
    alt={asset.title}
    className="w-full h-48 object-cover"
  />
  <div className="p-4">
    <h3 className="font-semibold">{asset.title}</h3>
    <p className="text-sm text-gray-600">{asset.description}</p>
  </div>
</Card>
```

### Card with Actions
```tsx
<Card variant="outlined">
  <div className="flex justify-between items-start mb-4">
    <h3 className="text-lg font-semibold">Project Name</h3>
    <Badge variant="success">Active</Badge>
  </div>
  <p className="text-gray-600 mb-4">
    Project description and details.
  </p>
  <div className="flex gap-2">
    <Button size="sm" variant="primary">Edit</Button>
    <Button size="sm" variant="outline">View</Button>
  </div>
</Card>
```

### Grid of Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} hoverable>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </Card>
  ))}
</div>
```

## Accessibility Guidelines

- **Keyboard Navigation**: Clickable cards are focusable via Tab key
- **Focus Indicators**: Visible focus ring for keyboard users
- **Semantic HTML**: Uses appropriate ARIA role when clickable
- **Screen Readers**: Properly announces interactive state
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

### Best Practices

✅ **Do:**
- Use cards to group related content
- Use elevated variant for important content
- Use hoverable for interactive cards
- Provide clear visual hierarchy within cards
- Use consistent padding across similar cards
- Make entire card clickable for better UX

❌ **Don't:**
- Nest cards too deeply (max 2 levels)
- Use cards for single pieces of text
- Make cards too wide (max-width recommended)
- Use hoverable without clickable for interactive cards
- Overuse elevated variant (reduces impact)
- Mix too many variants on the same page

## Responsive Behavior

- Padding adjusts between mobile and desktop
- Hover effects disabled on touch devices
- Stacks vertically on mobile in grid layouts
- Maintains consistent border radius across breakpoints

## Dark Mode Support

All card variants automatically adapt to dark mode:
- Background colors invert appropriately
- Borders adjust for visibility
- Shadows remain visible in dark mode

## Related Components

- **Badge**: For status indicators in cards
- **Button**: For card actions
- **Avatar**: For user cards
- **Icon**: For card icons
