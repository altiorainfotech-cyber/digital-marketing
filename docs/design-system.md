# DASCMS Design System Documentation

## Overview

The DASCMS Design System is a comprehensive collection of reusable components, design tokens, patterns, and guidelines that ensure consistency, accessibility, and maintainability across the Digital Asset & SEO Content Management System.

### Design Philosophy

1. **Consistency**: Unified design language across all pages and components
2. **Accessibility**: WCAG 2.1 AA compliance as a baseline requirement
3. **Performance**: Optimized for Core Web Vitals and fast interactions
4. **Scalability**: Component-based architecture for easy maintenance
5. **User-Centric**: Role-based interfaces that adapt to user needs

### Technology Stack

- **Framework**: Next.js 16.1.6 with React 19.2.3
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: Custom component library built with React
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization
- **Testing**: Vitest with React Testing Library
- **Property Testing**: fast-check for correctness validation

---

## Design Tokens

Design tokens are the foundational building blocks of the design system. They store visual design attributes as named entities, ensuring consistency across the application.

### Color System

#### Primary Colors
Used for brand identity and main actions.

```typescript
primary: {
  50: '#eff6ff',   // Lightest
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',  // Main primary
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',  // Darkest
}
```

#### Neutral Colors
Used for text, borders, and backgrounds.

```typescript
neutral: {
  50: '#fafafa',   // Lightest
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',  // Darkest
}
```

#### Semantic Colors
Used for status and feedback.

- **Success**: Green shades for positive actions and states
- **Warning**: Yellow/orange shades for caution
- **Error**: Red shades for errors and destructive actions
- **Info**: Blue shades for informational messages

#### Usage Guidelines

✅ **Do:**
- Use primary colors for main CTAs and brand elements
- Use neutral colors for text hierarchy (900 for headings, 600 for body)
- Use semantic colors consistently (green = success, red = error)
- Maintain sufficient contrast ratios (4.5:1 for normal text)

❌ **Don't:**
- Mix color scales (e.g., primary-500 with success-600)
- Use colors inconsistently across similar components
- Rely solely on color to convey information
- Use too many colors on a single page

### Typography System

#### Font Families

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],  // UI elements
  mono: ['JetBrains Mono', 'Consolas', 'monospace'],  // Code
}
```

#### Font Sizes

```typescript
fontSize: {
  xs: '0.75rem',      // 12px - Small labels
  sm: '0.875rem',     // 14px - Secondary text
  base: '1rem',       // 16px - Body text
  lg: '1.125rem',     // 18px - Large body
  xl: '1.25rem',      // 20px - Small headings
  '2xl': '1.5rem',    // 24px - H3
  '3xl': '1.875rem',  // 30px - H2
  '4xl': '2.25rem',   // 36px - H1
  '5xl': '3rem',      // 48px - Hero text
}
```

#### Font Weights

- **Normal (400)**: Body text
- **Medium (500)**: Emphasized text
- **Semibold (600)**: Subheadings
- **Bold (700)**: Headings

#### Line Heights

- **Tight (1.2)**: Headings
- **Normal (1.5)**: Body text
- **Relaxed (1.75)**: Long-form content

#### Usage Guidelines

✅ **Do:**
- Use Inter for all UI elements
- Maintain optimal line length (45-75 characters)
- Use appropriate line heights for readability
- Scale font sizes for responsive design

❌ **Don't:**
- Mix multiple font families
- Use font sizes smaller than 12px
- Use tight line height for body text
- Use all caps for long text

### Spacing System

Based on a 4px base unit for mathematical consistency.

```typescript
spacing: {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}
```

#### Usage Guidelines

✅ **Do:**
- Use consistent spacing values from the scale
- Use larger spacing for visual hierarchy
- Maintain consistent spacing within components
- Use responsive spacing (smaller on mobile)

❌ **Don't:**
- Use arbitrary spacing values
- Use inconsistent spacing for similar elements
- Overcrowd elements with insufficient spacing

### Shadow System

Used for elevation and depth.

```typescript
shadows: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}
```

### Animation System

```typescript
animations: {
  duration: {
    fast: '150ms',    // Quick interactions
    normal: '300ms',  // Standard transitions
    slow: '500ms',    // Complex animations
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
```

#### Usage Guidelines

✅ **Do:**
- Use consistent animation durations
- Use easeOut for entering elements
- Use easeIn for exiting elements
- Respect prefers-reduced-motion setting

❌ **Don't:**
- Use animations longer than 500ms
- Animate layout-shifting properties
- Use animations for critical interactions
- Ignore accessibility preferences

### Breakpoints

```typescript
breakpoints: {
  sm: '640px',    // Mobile landscape
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop
  xl: '1280px',   // Large desktop
  '2xl': '1536px', // Extra large
}
```

---

## Component Architecture

### Component Hierarchy

The design system follows atomic design principles:

```
Design Tokens (Raw values)
    ↓
Primitives (Basic UI elements)
    ↓
Composite (Combinations of primitives)
    ↓
Patterns (Page-level components)
    ↓
Pages (Full page implementations)
```

### Component Categories

#### 1. Primitives
Basic building blocks that cannot be broken down further.

**Examples:**
- Button
- Input
- Select
- Checkbox
- Radio
- Switch
- Label
- Icon
- Badge
- Chip
- Avatar

**Location:** `lib/design-system/components/primitives/`

#### 2. Composite
Complex components built from primitives.

**Examples:**
- Card
- Modal
- Dropdown
- Tooltip
- DataTable
- Toast
- Pagination
- Breadcrumb
- Alert
- Calendar

**Location:** `lib/design-system/components/composite/`

#### 3. Patterns
Page-level patterns and layouts.

**Examples:**
- EmptyState
- LoadingState
- ErrorState
- PageHeader
- PageContainer
- Sidebar
- TopNav
- MobileNav

**Location:** `lib/design-system/components/patterns/`

### Component Structure

Each component follows a consistent structure:

```
ComponentName/
├── ComponentName.tsx      # Component implementation
├── README.md             # Documentation
├── index.ts              # Exports
└── __tests__/            # Tests (optional)
    └── ComponentName.test.tsx
```

### Component Props Pattern

All components follow consistent prop patterns:

```typescript
interface ComponentProps {
  // Visual variants
  variant?: 'primary' | 'secondary' | ...;
  size?: 'sm' | 'md' | 'lg';
  
  // State
  disabled?: boolean;
  loading?: boolean;
  
  // Content
  children: React.ReactNode;
  
  // Styling
  className?: string;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
  
  // Handlers
  onClick?: () => void;
  onChange?: (value: any) => void;
}
```

---

## Usage Guidelines

### Importing Components

```typescript
// Primitives
import { Button } from '@/lib/design-system/components/primitives/Button';
import { Input } from '@/lib/design-system/components/primitives/Input';

// Composite
import { Card } from '@/lib/design-system/components/composite/Card';
import { Modal } from '@/lib/design-system/components/composite/Modal';

// Patterns
import { EmptyState } from '@/lib/design-system/components/patterns/EmptyState';
import { LoadingState } from '@/lib/design-system/components/patterns/LoadingState';

// Tokens
import { colors, typography, spacing } from '@/lib/design-system/tokens';
```

### Component Composition

Build complex UIs by composing simple components:

```tsx
<Card variant="elevated" padding="lg">
  <div className="flex items-center gap-4 mb-4">
    <Avatar src={user.avatar} size="lg" />
    <div>
      <h3 className="text-lg font-semibold">{user.name}</h3>
      <Badge variant="success">Active</Badge>
    </div>
  </div>
  
  <p className="text-gray-600 mb-4">{user.bio}</p>
  
  <div className="flex gap-2">
    <Button variant="primary" size="sm">
      Follow
    </Button>
    <Button variant="outline" size="sm">
      Message
    </Button>
  </div>
</Card>
```

### Responsive Design

Use Tailwind's responsive prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Stacks on mobile, 2 columns on tablet, 3 on desktop */}
</div>

<Button mobileFullWidth>
  {/* Full width on mobile, auto on desktop */}
</Button>
```

### Dark Mode

Components automatically support dark mode:

```tsx
<div className="bg-white dark:bg-neutral-800">
  <p className="text-neutral-900 dark:text-neutral-100">
    Text adapts to theme
  </p>
</div>
```

---

## Accessibility

### WCAG 2.1 AA Compliance

All components meet WCAG 2.1 Level AA standards:

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Indicators**: Visible focus rings for keyboard users
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Form Labels**: All inputs have associated labels
- **Error Messages**: Clearly associated with form fields

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Activate button or link |
| Space | Toggle checkbox, radio, or button |
| Escape | Close modal or dropdown |
| Arrow Keys | Navigate within components (dropdowns, calendars) |

### Screen Reader Support

- Use semantic HTML elements
- Provide ARIA labels for icon-only buttons
- Announce dynamic content changes
- Maintain logical heading hierarchy
- Use landmarks for page structure

### Reduced Motion

Respect user preferences:

```typescript
const prefersReducedMotion = usePrefersReducedMotion();

<div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
  Content
</div>
```

---

## Testing Strategy

### Unit Tests

Test specific component behavior:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Property-Based Tests

Test universal properties:

```typescript
import fc from 'fast-check';

it('should maintain contrast ratio for all color combinations', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...textColors),
      fc.constantFrom(...backgroundColors),
      (textColor, bgColor) => {
        const ratio = calculateContrastRatio(textColor, bgColor);
        return ratio >= 4.5; // WCAG AA
      }
    )
  );
});
```

### Accessibility Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Button>Click</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Migration Guide

### From Old UI to Design System

#### Step 1: Identify Components

Map existing components to design system equivalents:

| Old | New |
|-----|-----|
| `<button className="btn-primary">` | `<Button variant="primary">` |
| `<input className="form-input">` | `<Input />` |
| `<div className="card">` | `<Card>` |

#### Step 2: Update Imports

```typescript
// Old
import Button from '@/components/Button';

// New
import { Button } from '@/lib/design-system/components/primitives/Button';
```

#### Step 3: Update Props

```typescript
// Old
<Button className="primary" size="large" onClick={handleClick}>
  Save
</Button>

// New
<Button variant="primary" size="lg" onClick={handleClick}>
  Save
</Button>
```

#### Step 4: Update Styling

Replace custom classes with design system tokens:

```typescript
// Old
<div className="p-4 bg-blue-500 text-white rounded">

// New
<div className="p-4 bg-primary-500 text-white rounded-lg">
```

#### Step 5: Test Thoroughly

- Run unit tests
- Test keyboard navigation
- Test screen reader compatibility
- Verify responsive behavior
- Check dark mode

### Incremental Migration

You can migrate incrementally:

1. Start with new pages using design system
2. Migrate high-traffic pages
3. Update shared components
4. Gradually replace old components
5. Remove old code once fully migrated

---

## Best Practices

### Component Development

✅ **Do:**
- Follow the component structure pattern
- Use TypeScript for type safety
- Write comprehensive documentation
- Include accessibility features
- Test thoroughly
- Use design tokens consistently
- Support dark mode
- Respect reduced motion preferences

❌ **Don't:**
- Create one-off components
- Hardcode colors or spacing
- Skip accessibility testing
- Ignore responsive design
- Use inline styles
- Duplicate component logic

### Performance

✅ **Do:**
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images
- Minimize bundle size
- Use CSS animations over JavaScript

❌ **Don't:**
- Render unnecessary components
- Use large dependencies
- Animate layout-shifting properties
- Load all components upfront

### Maintenance

✅ **Do:**
- Keep documentation up to date
- Version components properly
- Communicate breaking changes
- Gather user feedback
- Monitor usage analytics

❌ **Don't:**
- Make breaking changes without notice
- Remove components without deprecation
- Ignore bug reports
- Skip changelog updates

---

## Resources

### Documentation

- [Button Component](../lib/design-system/components/primitives/Button/README.md)
- [Input Component](../lib/design-system/components/primitives/Input/README.md)
- [Card Component](../lib/design-system/components/composite/Card/README.md)
- [Modal Component](../lib/design-system/components/composite/Modal/README.md)

### External Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

### Tools

- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## Support

For questions, issues, or contributions:

1. Check component documentation
2. Review this design system guide
3. Search existing issues
4. Create a new issue with details
5. Contact the design system team

---

## Changelog

### Version 1.0.0 (Current)

- Initial design system implementation
- 30+ reusable components
- Complete design token system
- Comprehensive documentation
- WCAG 2.1 AA compliance
- Dark mode support
- Responsive design
- Property-based testing

---

*Last updated: January 2026*
