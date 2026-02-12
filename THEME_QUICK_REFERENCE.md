# Dark Theme Quick Reference

## Color Palette

### Primary Colors
| Usage | Color | Hex Code |
|-------|-------|----------|
| Main Background | Black | `#000000` |
| Navigation Bar | Dark Gray | `#1f1f1f` |
| Cards/Panels | Dark Gray | `#1f1f1f` |
| Hover State | Lighter Gray | `#2a2a2a` |
| Primary Button | Blue | `#2663eb` |
| Primary Button Hover | Darker Blue | `#1d4ed8` |

### Text Colors
| Usage | Color | Hex Code |
|-------|-------|----------|
| Primary Text | White | `#ffffff` |
| Secondary Text | Light Gray | `#e5e5e5` |
| Tertiary Text | Medium Gray | `#a3a3a3` |
| Links | Light Blue | `#60a5fa` |
| Links Hover | Lighter Blue | `#93c5fd` |

### Border Colors
| Usage | Color | Hex Code |
|-------|-------|----------|
| Default Border | Medium Gray | `#404040` |
| Focus Border | Blue | `#2663eb` |

### Status Colors
| Status | Background | Hex Code |
|--------|------------|----------|
| Success | Dark Green | `#15803d` |
| Warning | Dark Orange | `#b45309` |
| Error | Dark Red | `#b91c1c` |
| Info | Dark Blue | `#1d4ed8` |

## Component Styling

### Buttons
```tsx
// Primary Button (Blue)
<Button variant="primary">Click Me</Button>
// Background: #2663eb, Text: #ffffff

// Secondary Button (Dark Gray)
<Button variant="secondary">Click Me</Button>
// Background: #1f1f1f, Text: #ffffff

// Outline Button
<Button variant="outline">Click Me</Button>
// Background: transparent, Border: #2663eb, Text: #ffffff
```

### Navigation
```tsx
// TopNav - automatically styled with dark gray background
<TopNav items={[...]} />
// Background: #1f1f1f, Text: #ffffff

// Sidebar - automatically styled with dark gray background
<Sidebar items={[...]} />
// Background: #1f1f1f, Text: #ffffff
```

### Forms
```tsx
// Input fields
<Input placeholder="Enter text" />
// Background: #1f1f1f, Text: #ffffff, Border: #404040

// Select dropdowns
<Select options={[...]} />
// Background: #1f1f1f, Text: #ffffff, Border: #404040
```

### Cards
```tsx
// Card component
<Card>Content</Card>
// Background: #1f1f1f, Border: #404040
```

### Modals
```tsx
// Modal component
<Modal isOpen={true}>Content</Modal>
// Background: #1f1f1f, Text: #ffffff
```

## CSS Classes

### Background Classes
All these classes are overridden to use dark theme:
- `.bg-white` → `#1f1f1f`
- `.bg-gray-50` → `#1f1f1f`
- `.bg-gray-100` → `#1f1f1f`
- `.min-h-screen` → `#000000`

### Text Classes
All these classes are overridden to white:
- `.text-gray-900` → `#ffffff`
- `.text-gray-800` → `#ffffff`
- `.text-gray-700` → `#ffffff`
- `.text-gray-600` → `#ffffff`

### Border Classes
All these classes use dark borders:
- `.border-gray-200` → `#404040`
- `.border-gray-300` → `#404040`
- `.border-neutral-200` → `#404040`

## How to Use

### For New Components
When creating new components, you can use either:

1. **Design System Components** (Recommended)
   ```tsx
   import { Button, Input, Card } from '@/lib/design-system/components';
   // These are already themed
   ```

2. **Custom Styling**
   ```tsx
   // Use semantic class names - they're automatically overridden
   <div className="bg-white text-gray-900">
     Content
   </div>
   // Will render as: background: #1f1f1f, color: #ffffff
   ```

### For Existing Pages
No changes needed! The global CSS overrides handle everything automatically.

## Testing Checklist

- [ ] All pages have black background
- [ ] Navigation bars are dark gray (#1f1f1f)
- [ ] All text is white and readable
- [ ] Primary buttons are blue (#2663eb)
- [ ] Dropdown menus are dark gray
- [ ] Forms (inputs, selects) are dark gray with white text
- [ ] Hover states work correctly (lighter gray)
- [ ] Links are visible (light blue)
- [ ] Modals and overlays use dark theme
- [ ] Tables use dark theme
- [ ] Cards and panels are dark gray

## Troubleshooting

### Text Not Visible
If text is not visible, check:
1. Is the element using an SVG? SVGs inherit color.
2. Is there an inline style overriding the color?
3. Check browser dev tools for conflicting styles.

### Background Not Dark
If background is not dark, check:
1. Is there an inline style?
2. Is the element using a very specific class not covered by overrides?
3. Add `!important` to the specific element if needed.

### Button Not Blue
If primary button is not blue:
1. Ensure it has `variant="primary"` prop
2. Check if there's a conflicting class
3. Verify the Button component is from the design system

## Browser Support

The dark theme works in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

The theme uses:
- CSS variables for easy updates
- Global overrides for consistency
- No JavaScript for theme switching (pure CSS)
- Minimal performance impact
