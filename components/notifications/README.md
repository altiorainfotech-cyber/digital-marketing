# Notification System

This directory contains the notification system components for DASCMS, implementing Requirements 10.1-10.10.

## Components

### NotificationBell

A bell icon component that displays unread notification count and opens a dropdown menu.

**Features:**
- Unread count badge with red background
- Pulse animation when new notifications arrive
- Shake animation on bell icon for new notifications
- Dropdown menu with recent notifications
- Automatic polling every 30 seconds

**Usage:**
```tsx
import { NotificationBell } from '@/components/notifications';

<NotificationBell />
```

### NotificationDropdown

A dropdown menu displaying recent notifications with smooth animations.

**Features:**
- Smooth slide-in animation
- Display up to 5 recent notifications
- Icons based on notification type
- Unread notifications highlighted with background color
- Mark as read functionality
- View all link to full notifications page
- Empty state when no notifications

**Props:**
- `isOpen`: boolean - Controls dropdown visibility
- `onClose`: () => void - Callback when dropdown should close
- `onUnreadCountChange`: (count: number) => void - Callback when unread count changes

## Toast Notifications

Toast notifications are available globally through the `useToast` hook.

**Usage:**
```tsx
import { useToast } from '@/lib/design-system';

function MyComponent() {
  const { showToast } = useToast();
  
  const handleSuccess = () => {
    showToast({
      type: 'success',
      title: 'Success!',
      message: 'Your action was completed successfully.',
      duration: 5000, // Auto-dismiss after 5 seconds
    });
  };
  
  const handleError = () => {
    showToast({
      type: 'error',
      title: 'Error',
      message: 'Something went wrong. Please try again.',
    });
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

**Toast Types:**
- `success` - Green with checkmark icon
- `error` - Red with X icon
- `warning` - Yellow with warning triangle icon
- `info` - Blue with info icon

**Toast Features:**
- Appears in top-right corner
- Slide-in animation from right
- Auto-dismiss after configurable duration (default: 5000ms)
- Manual close button
- Stacking support for multiple toasts
- Respects dark mode

## Notifications Page

Full-page view of all notifications with filtering and pagination.

**Features:**
- Filter tabs: All, Unread, Read
- Mark all as read button
- Mark individual notifications as read
- Pagination support
- Empty states for each filter
- Links to related resources (e.g., assets)
- Responsive design

**Route:** `/notifications`

## API Integration

The notification components integrate with the following API endpoints:

- `GET /api/notifications` - Fetch notifications with optional filters
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read

## Notification Types

The system supports the following notification types:

- `ASSET_UPLOADED` - Blue upload icon
- `ASSET_APPROVED` - Green checkmark icon
- `ASSET_REJECTED` - Red X icon
- `ASSET_SHARED` - Blue share icon
- `COMMENT_ADDED` - Blue message icon
- `SYSTEM_ALERT` - Yellow warning icon

## Styling

All components use the design system tokens and follow the DASCMS design guidelines:

- Colors from design system palette
- Consistent spacing and typography
- Smooth animations (150ms-300ms)
- Dark mode support
- Accessible focus states
- WCAG 2.1 AA compliant

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Color contrast compliance
- Semantic HTML structure
