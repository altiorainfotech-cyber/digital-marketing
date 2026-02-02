# DASCMS Design System

A comprehensive design system for the Digital Asset & SEO Content Management System.

## 📚 Documentation

### Main Guide
- **[Design System Documentation](../../docs/design-system.md)** - Complete guide covering philosophy, architecture, tokens, components, accessibility, testing, and migration

### Design Tokens
- **[Tokens Reference](./tokens/README.md)** - Colors, typography, spacing, shadows, animations, and breakpoints

### Component Documentation

#### Primitives
Basic building blocks that cannot be broken down further.

- **[Button](./components/primitives/Button/README.md)** - Interactive button component with variants and states
- **[Input](./components/primitives/Input/README.md)** - Text input with labels, validation, and icons
- Checkbox - Checkbox input component
- Radio - Radio button component
- Select - Dropdown select component
- Switch - Toggle switch component
- Label - Form label component
- Icon - Icon wrapper component
- Badge - Status badge component
- Chip - Removable chip component
- Avatar - User avatar component

#### Composite
Complex components built from primitives.

- **[Alert](./components/composite/Alert/README.md)** - Color-coded alert messages
- **[Card](./components/composite/Card/README.md)** - Container for grouped content
- **[Modal](./components/composite/Modal/README.md)** - Dialog overlay with backdrop
- Calendar - Date picker component
- DataTable - Sortable data table
- Dropdown - Dropdown menu
- Tooltip - Hover tooltip
- Toast - Temporary notification
- Pagination - Page navigation
- Breadcrumb - Navigation breadcrumb

#### Patterns
Page-level patterns and layouts.

- **[EmptyState](./components/patterns/EmptyState/README.md)** - No data state display
- LoadingState - Loading skeleton screens
- ErrorState - Error display component
- PageHeader - Page header with title and actions
- PageContainer - Page layout container
- Sidebar - Navigation sidebar
- TopNav - Top navigation bar
- MobileNav - Mobile navigation menu

## 🚀 Quick Start

### Installation

The design system is already integrated into the DASCMS project. No additional installation required.

### Basic Usage

```tsx
import { Button } from '@/lib/design-system/components/primitives/Button';
import { Card } from '@/lib/design-system/components/composite/Card';
import { EmptyState } from '@/lib/design-system/components/patterns/EmptyState';

function MyComponent() {
  return (
    <Card variant="elevated" padding="lg">
      <h2>Welcome</h2>
      <Button variant="primary" onClick={handleClick}>
        Get Started
      </Button>
    </Card>
  );
}
```

### Using Design Tokens

```tsx
// In Tailwind classes
<div className="bg-primary-500 text-white p-4 rounded-lg shadow-md">
  Content
</div>

// In JavaScript
import { colors, spacing } from '@/lib/design-system/tokens';

const styles = {
  color: colors.primary[500],
  padding: spacing[4],
};
```

## 🎨 Design Principles

1. **Consistency** - Unified design language across all pages
2. **Accessibility** - WCAG 2.1 AA compliance baseline
3. **Performance** - Optimized for Core Web Vitals
4. **Scalability** - Component-based architecture
5. **User-Centric** - Role-based adaptive interfaces

## 📦 Component Structure

```
lib/design-system/
├── tokens/              # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── shadows.ts
│   ├── animations.ts
│   ├── breakpoints.ts
│   └── README.md
├── components/
│   ├── primitives/      # Basic components
│   ├── composite/       # Complex components
│   └── patterns/        # Page patterns
├── hooks/               # Custom React hooks
├── providers/           # Context providers
└── utils/               # Helper functions
```

## ♿ Accessibility

All components meet WCAG 2.1 Level AA standards:

- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Color contrast compliance
- ✅ Focus indicators
- ✅ ARIA labels and roles
- ✅ Reduced motion support

## 🧪 Testing

The design system includes:

- **Unit Tests** - Component behavior and interactions
- **Property Tests** - Universal correctness properties
- **Accessibility Tests** - WCAG compliance validation
- **Visual Tests** - Component appearance (optional)

## 🌙 Dark Mode

All components automatically support dark mode using Tailwind's `dark:` prefix:

```tsx
<div className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
  Adapts to theme
</div>
```

## 📱 Responsive Design

Components are mobile-first and responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## 🔧 Technology Stack

- **Framework**: Next.js 16.1.6 with React 19.2.3
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library
- **Property Testing**: fast-check

## 📖 Resources

### Documentation
- [Complete Design System Guide](../../docs/design-system.md)
- [Design Tokens Reference](./tokens/README.md)
- [Component Documentation](./components/)

### External Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

### Tools
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## 🤝 Contributing

When adding new components:

1. Follow the component structure pattern
2. Use design tokens consistently
3. Include comprehensive documentation
4. Write tests (unit + property)
5. Ensure accessibility compliance
6. Support dark mode
7. Make it responsive

## 📝 Changelog

### Version 1.0.0 (Current)

- ✅ Initial design system implementation
- ✅ 30+ reusable components
- ✅ Complete design token system
- ✅ Comprehensive documentation
- ✅ WCAG 2.1 AA compliance
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Property-based testing

---

**Need help?** Check the [main documentation](../../docs/design-system.md) or component-specific README files.

*Last updated: January 2026*
