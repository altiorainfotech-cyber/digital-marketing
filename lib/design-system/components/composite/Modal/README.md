# Modal Component

## Purpose

The Modal component provides a dialog overlay for displaying content that requires user attention or interaction. It includes backdrop, animations, focus management, and keyboard navigation.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls modal visibility |
| `onClose` | `() => void` | required | Callback when modal closes |
| `title` | `string` | `undefined` | Modal title in header |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal width |
| `children` | `React.ReactNode` | required | Modal content |
| `footer` | `React.ReactNode` | `undefined` | Footer content (actions) |
| `closeOnBackdropClick` | `boolean` | `true` | Close when clicking backdrop |
| `closeOnEscape` | `boolean` | `true` | Close when pressing Escape |
| `className` | `string` | `''` | Additional CSS classes |

## Sizes

```tsx
<Modal size="sm">Small modal (max-width: 384px)</Modal>
<Modal size="md">Medium modal (max-width: 448px)</Modal>
<Modal size="lg">Large modal (max-width: 512px)</Modal>
<Modal size="xl">Extra large modal (max-width: 576px)</Modal>
<Modal size="full">Full width modal with margins</Modal>
```

## Features

### Backdrop
- Semi-transparent black overlay
- Backdrop blur effect
- Fade-in animation
- Optional click-to-close

### Animations
- Backdrop fades in
- Content slides in from center
- Smooth transitions

### Focus Management
- Traps focus within modal
- Restores focus on close
- Tab cycles through focusable elements

### Keyboard Navigation
- **Escape**: Closes modal (if enabled)
- **Tab**: Cycles through focusable elements
- **Shift+Tab**: Cycles backwards

### Body Scroll Lock
Prevents background scrolling when modal is open.

## Usage Examples

### Basic Modal
```tsx
import { Modal } from '@/lib/design-system/components/composite/Modal';
import { Button } from '@/lib/design-system/components/primitives/Button';

const [isOpen, setIsOpen] = useState(false);

<>
  <Button onClick={() => setIsOpen(true)}>
    Open Modal
  </Button>
  
  <Modal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Modal Title"
  >
    <p>Modal content goes here.</p>
  </Modal>
</>
```

### Modal with Footer Actions
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### Confirmation Dialog
```tsx
<Modal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  title="Delete Asset"
  size="sm"
  footer={
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  }
>
  <p>This action cannot be undone. Are you sure you want to delete this asset?</p>
</Modal>
```

### Form Modal
```tsx
<Modal
  isOpen={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  title="Create New Asset"
  size="lg"
  closeOnBackdropClick={false}
  footer={
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => setIsFormOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
        Create
      </Button>
    </div>
  }
>
  <form onSubmit={handleSubmit}>
    <Input label="Title" required />
    <Input label="Description" />
    <Select label="Type" options={assetTypes} />
  </form>
</Modal>
```

### Modal without Title
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  size="md"
>
  <div className="text-center">
    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
    <h3 className="text-xl font-semibold mb-2">Success!</h3>
    <p>Your changes have been saved.</p>
  </div>
</Modal>
```

### Scrollable Content
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Terms and Conditions"
  size="lg"
>
  <div className="space-y-4">
    {/* Long content that scrolls */}
    <p>Lorem ipsum dolor sit amet...</p>
    <p>Consectetur adipiscing elit...</p>
    {/* More content */}
  </div>
</Modal>
```

## Accessibility Guidelines

- **ARIA Roles**: Uses `role="dialog"` and `aria-modal="true"`
- **Focus Management**: Traps focus within modal
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Properly labeled with `aria-labelledby`
- **Focus Restoration**: Returns focus to trigger element on close
- **Escape Key**: Closes modal (configurable)

### Best Practices

✅ **Do:**
- Provide a clear title for context
- Use appropriate size for content
- Include clear action buttons in footer
- Use for important user decisions
- Provide a way to close (X button, Cancel, Escape)
- Keep content focused and concise

❌ **Don't:**
- Use for non-critical information (use Toast instead)
- Nest modals (use sequential modals instead)
- Make modals too large (consider a full page instead)
- Disable close options without good reason
- Use for long forms (consider a dedicated page)
- Auto-open modals on page load

## Modal Patterns

### Confirmation Pattern
```tsx
// For destructive actions
<Modal title="Confirm Delete" size="sm">
  <p>Warning message</p>
  <Footer>
    <Button variant="outline">Cancel</Button>
    <Button variant="danger">Delete</Button>
  </Footer>
</Modal>
```

### Form Pattern
```tsx
// For data entry
<Modal title="Create Item" size="lg" closeOnBackdropClick={false}>
  <Form />
  <Footer>
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Save</Button>
  </Footer>
</Modal>
```

### Info Pattern
```tsx
// For displaying information
<Modal title="Details" size="md">
  <Content />
  <Footer>
    <Button variant="primary">Close</Button>
  </Footer>
</Modal>
```

## Responsive Behavior

- Adapts to viewport height (max 90vh)
- Scrollable content area
- Maintains padding on mobile
- Full-width option for mobile
- Touch-friendly close button

## Dark Mode Support

Automatically adapts to dark mode:
- Background color inverts
- Border colors adjust
- Text colors remain readable

## Related Components

- **Button**: For modal actions
- **Icon**: For close button
- **Alert**: For in-modal notifications
- **Form Components**: For modal forms
