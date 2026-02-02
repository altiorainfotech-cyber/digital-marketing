# Design Tokens Reference

## Overview

Design tokens are the foundational building blocks of the DASCMS design system. They store visual design attributes as named entities, ensuring consistency across the application.

## Token Categories

### Colors (`colors.ts`)

#### Primary Colors
Brand colors for main actions and identity.

```typescript
primary: {
  50: '#eff6ff',   // Lightest
  500: '#3b82f6',  // Main
  900: '#1e3a8a',  // Darkest
}
```

**Usage:**
- `primary-500`: Main CTAs, links, brand elements
- `primary-600`: Hover states
- `primary-700`: Active states

#### Neutral Colors
Grays for text, borders, and backgrounds.

```typescript
neutral: {
  50: '#fafafa',   // Lightest backgrounds
  500: '#737373',  // Secondary text
  900: '#171717',  // Primary text
}
```

**Usage:**
- `neutral-900`: Headings, primary text
- `neutral-600`: Body text
- `neutral-400`: Placeholder text
- `neutral-200`: Borders
- `neutral-50`: Backgrounds

#### Semantic Colors

**Success (Green)**
```typescript
success: {
  50: '#f0fdf4',
  500: '#22c55e',
  700: '#15803d',
}
```

**Warning (Yellow/Orange)**
```typescript
warning: {
  50: '#fffbeb',
  500: '#f59e0b',
  700: '#b45309',
}
```

**Error (Red)**
```typescript
error: {
  50: '#fef2f2',
  500: '#ef4444',
  700: '#b91c1c',
}
```

**Info (Blue)**
```typescript
info: {
  50: '#eff6ff',
  500: '#3b82f6',
  700: '#1d4ed8',
}
```

### Typography (`typography.ts`)

#### Font Families

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'monospace'],
}
```

#### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 12px | Small labels, captions |
| `sm` | 14px | Secondary text, helper text |
| `base` | 16px | Body text (default) |
| `lg` | 18px | Large body text |
| `xl` | 20px | Small headings |
| `2xl` | 24px | H3 headings |
| `3xl` | 30px | H2 headings |
| `4xl` | 36px | H1 headings |
| `5xl` | 48px | Hero text |

#### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `normal` | 400 | Body text |
| `medium` | 500 | Emphasized text |
| `semibold` | 600 | Subheadings |
| `bold` | 700 | Headings |

#### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | 1.2 | Headings |
| `normal` | 1.5 | Body text |
| `relaxed` | 1.75 | Long-form content |

### Spacing (`spacing.ts`)

Based on 4px base unit.

| Token | Size | Usage |
|-------|------|-------|
| `1` | 4px | Tight spacing |
| `2` | 8px | Small gaps |
| `3` | 12px | Default gaps |
| `4` | 16px | Standard spacing |
| `6` | 24px | Section spacing |
| `8` | 32px | Large spacing |
| `12` | 48px | Extra large spacing |
| `16` | 64px | Section dividers |

**Common Patterns:**
- Component padding: `p-4` (16px)
- Card padding: `p-6` (24px)
- Section spacing: `mb-8` (32px)
- Page margins: `mx-4` or `mx-6`

### Shadows (`shadows.ts`)

Used for elevation and depth.

| Token | Usage |
|-------|-------|
| `sm` | Subtle elevation (dropdowns) |
| `base` | Default cards |
| `md` | Elevated cards |
| `lg` | Modals, popovers |
| `xl` | Maximum elevation |

**Examples:**
```tsx
<div className="shadow-sm">Subtle</div>
<div className="shadow-md">Elevated</div>
<div className="shadow-xl">Modal</div>
```

### Animations (`animations.ts`)

#### Durations

| Token | Duration | Usage |
|-------|----------|-------|
| `fast` | 150ms | Quick interactions (hover) |
| `normal` | 300ms | Standard transitions |
| `slow` | 500ms | Complex animations |

#### Easing Functions

| Token | Function | Usage |
|-------|----------|-------|
| `easeIn` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |
| `easeOut` | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements |
| `easeInOut` | `cubic-bezier(0.4, 0, 0.2, 1)` | Both directions |

**Examples:**
```tsx
<div className="transition-all duration-300 ease-out">
  Smooth transition
</div>
```

### Breakpoints (`breakpoints.ts`)

Responsive design breakpoints.

| Token | Size | Device |
|-------|------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

**Usage:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

## Using Tokens

### In Tailwind Classes

```tsx
// Colors
<div className="bg-primary-500 text-white">

// Typography
<h1 className="text-4xl font-bold">

// Spacing
<div className="p-4 mb-6">

// Shadows
<div className="shadow-md">

// Animations
<div className="transition-all duration-300">
```

### In Custom CSS

```css
.custom-component {
  color: var(--color-primary-500);
  font-size: var(--font-size-base);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) var(--easing-ease-out);
}
```

### In JavaScript

```typescript
import { colors, typography, spacing } from '@/lib/design-system/tokens';

const styles = {
  color: colors.primary[500],
  fontSize: typography.fontSize.base,
  padding: spacing[4],
};
```

## Token Naming Convention

### Pattern
`{category}-{variant}-{shade}`

### Examples
- `primary-500` - Primary color, main shade
- `neutral-900` - Neutral color, darkest shade
- `success-50` - Success color, lightest shade
- `text-base` - Base font size
- `p-4` - Padding, 16px
- `shadow-md` - Medium shadow

## Best Practices

### ✅ Do

- Use tokens consistently across the application
- Reference tokens instead of hardcoding values
- Use semantic color names (success, error, warning)
- Follow the spacing scale (4px increments)
- Use appropriate font sizes for hierarchy
- Apply shadows for elevation

### ❌ Don't

- Hardcode color values (`#3b82f6`)
- Use arbitrary spacing (`padding: 13px`)
- Mix token systems
- Skip shades in the scale
- Use too many different font sizes
- Overuse shadows

## Common Patterns

### Card Component
```tsx
<div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
    Title
  </h3>
  <p className="text-base text-neutral-600 dark:text-neutral-400">
    Description
  </p>
</div>
```

### Button Component
```tsx
<button className="
  bg-primary-500 hover:bg-primary-600 active:bg-primary-700
  text-white font-medium
  px-4 py-2 rounded-lg
  shadow-sm hover:shadow-md
  transition-all duration-300
">
  Click Me
</button>
```

### Form Input
```tsx
<input className="
  w-full px-4 py-2
  text-base text-neutral-900
  border border-neutral-300
  rounded-lg
  focus:border-primary-500 focus:ring-2 focus:ring-primary-200
  transition-all duration-300
" />
```

## Dark Mode

Tokens automatically support dark mode using Tailwind's `dark:` prefix:

```tsx
<div className="
  bg-white dark:bg-neutral-800
  text-neutral-900 dark:text-neutral-100
  border-neutral-200 dark:border-neutral-700
">
  Content adapts to theme
</div>
```

## Responsive Design

Use breakpoint prefixes for responsive values:

```tsx
<div className="
  text-base md:text-lg lg:text-xl
  p-4 md:p-6 lg:p-8
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
  Responsive content
</div>
```

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design System Guide](../../docs/design-system.md)
- [Component Documentation](../components/)

---

*For questions or updates, refer to the main design system documentation.*
