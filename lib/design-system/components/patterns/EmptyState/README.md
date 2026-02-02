# EmptyState Component

## Purpose

The EmptyState component displays when no data or content is available. It provides clear messaging and optional actions to help users understand the situation and proceed with next steps.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | `undefined` | Icon or illustration |
| `title` | `string` | required | Empty state title |
| `message` | `string` | `undefined` | Description message |
| `action` | `ActionConfig` | `undefined` | Action button config |
| `className` | `string` | `''` | Additional CSS classes |

### ActionConfig

```typescript
interface ActionConfig {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}
```

## Usage Examples

### Basic Empty State
```tsx
import { EmptyState } from '@/lib/design-system/components/patterns/EmptyState';
import { Inbox } from 'lucide-react';

<EmptyState
  icon={<Inbox size={64} />}
  title="No messages"
  message="You don't have any messages yet."
/>
```

### Empty State with Action
```tsx
import { FolderOpen } from 'lucide-react';

<EmptyState
  icon={<FolderOpen size={64} />}
  title="No assets found"
  message="Get started by uploading your first asset."
  action={{
    label: "Upload Asset",
    onClick: () => navigate('/assets/upload'),
    variant: "primary"
  }}
/>
```

### Search Results Empty State
```tsx
import { Search } from 'lucide-react';

<EmptyState
  icon={<Search size={64} />}
  title="No results found"
  message={`No assets match "${searchQuery}". Try adjusting your search.`}
  action={{
    label: "Clear Search",
    onClick: () => setSearchQuery(''),
    variant: "outline"
  }}
/>
```

### Filtered Results Empty State
```tsx
import { Filter } from 'lucide-react';

<EmptyState
  icon={<Filter size={64} />}
  title="No matching assets"
  message="No assets match your current filters. Try removing some filters."
  action={{
    label: "Clear Filters",
    onClick: handleClearFilters,
    variant: "outline"
  }}
/>
```

### Permission Denied Empty State
```tsx
import { Lock } from 'lucide-react';

<EmptyState
  icon={<Lock size={64} />}
  title="Access Restricted"
  message="You don't have permission to view this content."
/>
```

### New User Empty State
```tsx
import { Sparkles } from 'lucide-react';

<EmptyState
  icon={<Sparkles size={64} />}
  title="Welcome to DASCMS!"
  message="Start by creating your first project or uploading assets."
  action={{
    label: "Get Started",
    onClick: handleGetStarted,
    variant: "primary"
  }}
/>
```

### Deleted Items Empty State
```tsx
import { Trash2 } from 'lucide-react';

<EmptyState
  icon={<Trash2 size={64} />}
  title="Trash is empty"
  message="Deleted items will appear here."
/>
```

## Common Use Cases

### No Data Yet
When a user hasn't created any content.

```tsx
<EmptyState
  icon={<FileText size={64} />}
  title="No documents yet"
  message="Create your first document to get started."
  action={{
    label: "Create Document",
    onClick: handleCreate
  }}
/>
```

### No Search Results
When a search returns no results.

```tsx
<EmptyState
  icon={<Search size={64} />}
  title="No results"
  message="Try different keywords or check your spelling."
  action={{
    label: "Clear Search",
    onClick: handleClearSearch,
    variant: "outline"
  }}
/>
```

### No Filtered Results
When filters exclude all items.

```tsx
<EmptyState
  icon={<Filter size={64} />}
  title="No matches"
  message="Try adjusting your filters."
  action={{
    label: "Reset Filters",
    onClick: handleResetFilters,
    variant: "outline"
  }}
/>
```

### Error State
When data failed to load.

```tsx
<EmptyState
  icon={<AlertCircle size={64} />}
  title="Failed to load"
  message="Something went wrong. Please try again."
  action={{
    label: "Retry",
    onClick: handleRetry,
    variant: "primary"
  }}
/>
```

### Permission Denied
When user lacks access.

```tsx
<EmptyState
  icon={<Lock size={64} />}
  title="Access Denied"
  message="You don't have permission to view this content."
/>
```

## Accessibility Guidelines

- **ARIA Role**: Uses `role="status"` for screen readers
- **Live Region**: Uses `aria-live="polite"` for announcements
- **Icon Hidden**: Icon is decorative and hidden from screen readers
- **Clear Messaging**: Title and message provide context
- **Actionable**: Action button is keyboard accessible

### Best Practices

✅ **Do:**
- Use clear, friendly language
- Provide helpful context in the message
- Include an action when appropriate
- Use relevant icons that match the context
- Keep messages concise
- Explain why the state is empty
- Suggest next steps

❌ **Don't:**
- Use technical jargon
- Blame the user ("You have no items")
- Use generic messages ("No data")
- Omit helpful actions
- Use scary or negative language
- Show empty states for loading data
- Make empty states look like errors

## Icon Guidelines

Choose icons that match the context:

- **Inbox**: Messages, notifications
- **FolderOpen**: Files, documents, assets
- **Search**: Search results
- **Filter**: Filtered results
- **Lock**: Permission denied
- **Trash**: Deleted items
- **Sparkles**: New user, getting started
- **AlertCircle**: Errors
- **Calendar**: Events, schedules
- **Users**: Team members, contacts

## Message Guidelines

### Good Messages

✅ "No assets found. Upload your first asset to get started."
✅ "Your search didn't match any results. Try different keywords."
✅ "No notifications yet. We'll notify you when something happens."

### Poor Messages

❌ "No data"
❌ "Empty"
❌ "Nothing here"
❌ "Error: 404"

## Responsive Behavior

- Centers content vertically and horizontally
- Maintains padding on mobile
- Icon scales appropriately
- Text remains readable
- Action button adapts to mobile width

## Dark Mode Support

Automatically adapts to dark mode:
- Text colors adjust for readability
- Icon colors remain visible
- Background remains transparent

## Related Components

- **LoadingState**: For loading data
- **ErrorState**: For error conditions
- **Button**: For empty state actions
- **Icon**: For empty state icons

## Examples by Context

### Asset Management
```tsx
<EmptyState
  icon={<Image size={64} />}
  title="No assets yet"
  message="Upload images, videos, or documents to get started."
  action={{
    label: "Upload Asset",
    onClick: () => navigate('/upload')
  }}
/>
```

### User Management
```tsx
<EmptyState
  icon={<Users size={64} />}
  title="No users found"
  message="Invite team members to collaborate."
  action={{
    label: "Invite Users",
    onClick: handleInvite
  }}
/>
```

### Analytics
```tsx
<EmptyState
  icon={<BarChart size={64} />}
  title="No data available"
  message="Analytics will appear here once you have activity."
/>
```

### Notifications
```tsx
<EmptyState
  icon={<Bell size={64} />}
  title="All caught up!"
  message="You have no new notifications."
/>
```
