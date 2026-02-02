# Notification System Integration Guide

This guide explains how to integrate the notification components into your DASCMS application.

## Components Created

1. **NotificationBell** - Bell icon with dropdown menu (`components/notifications/NotificationBell.tsx`)
2. **Notifications Page** - Full notifications page (`app/notifications/page.tsx`)

## Integration Steps

### Step 1: Add NotificationBell to Navigation

Add the NotificationBell component to your navigation bar or header. Here's an example:

```tsx
// Example: app/dashboard/page.tsx or any layout component
'use client';

import { NotificationBell } from '@/components/notifications';
import { useUser } from '@/lib/auth/hooks';

function Navigation() {
  const user = useUser();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">DASCMS</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Add NotificationBell here */}
            {user && <NotificationBell userId={user.id} />}
            
            <span className="text-sm text-gray-700">
              {user?.name} ({user?.role})
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Step 2: Update Admin Layout

For the admin dashboard, add the NotificationBell to the AdminLayout component:

```tsx
// components/admin/AdminLayout.tsx
import { NotificationBell } from '@/components/notifications';
import { useUser } from '@/lib/auth/hooks';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              {/* Navigation links */}
            </div>
            <div className="flex items-center space-x-4">
              {/* Add NotificationBell */}
              {user && <NotificationBell userId={user.id} />}
              
              <span className="text-sm text-gray-700">
                {user?.name}
              </span>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

### Step 3: Add Link to Notifications Page

The NotificationBell component already includes a "View all notifications" link that navigates to `/notifications`. The full notifications page is automatically available at this route.

## Features

### NotificationBell Component

- **Unread Count Badge**: Shows number of unread notifications (up to 99+)
- **Dropdown Menu**: Displays 5 most recent notifications
- **Mark as Read**: Click "Mark read" on individual notifications
- **Auto-refresh**: Fetches latest notifications when dropdown opens
- **Click Outside**: Closes dropdown when clicking outside

### Notifications Page

- **Full List**: View all notifications with pagination
- **Filters**:
  - Status: All / Unread / Read
  - Type: All types or specific notification types
  - Date Range: From/To date filters
- **Actions**:
  - Mark all as read
  - Mark individual notifications as read
  - Delete individual notifications
- **Links**: Navigate to related resources (e.g., assets)

## Notification Types

The system supports these notification types:

- `ASSET_UPLOADED` - New asset submitted for review (Admin only)
- `ASSET_APPROVED` - Asset approved by Admin
- `ASSET_REJECTED` - Asset rejected by Admin
- `ASSET_SHARED` - Asset shared with user
- `COMMENT_ADDED` - Comment added to asset
- `SYSTEM_ALERT` - System-wide alert

## API Endpoints Used

The components use these API endpoints:

- `GET /api/notifications` - Fetch notifications with filtering
- `PATCH /api/notifications/[id]/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/[id]` - Delete notification

## Styling

The components use Tailwind CSS and match the existing DASCMS design:

- Blue theme for primary actions
- Red badges for unread counts
- Responsive design
- Hover states and transitions
- Accessible with ARIA labels

## Testing

To test the notification system:

1. **Create a notification**: Upload an SEO asset for review (creates notification for Admins)
2. **View notifications**: Click the bell icon to see the dropdown
3. **Mark as read**: Click "Mark read" on a notification
4. **View all**: Click "View all notifications" to see the full page
5. **Filter**: Use the filters on the notifications page
6. **Mark all as read**: Click "Mark all as read" button

## Requirements Implemented

This implementation satisfies requirements 16.1-16.6:

- ✅ 16.1: Notify Admins when SEO asset is uploaded for review
- ✅ 16.2: Notify uploader when asset is approved or rejected
- ✅ 16.3: Notify user when Doc asset is shared
- ✅ 16.4: Display unread notifications prominently
- ✅ 16.5: Mark notifications as read
- ✅ 16.6: Filter notifications by read/unread status and date range
