# Audit Log Viewer

## Overview

The Audit Log Viewer is an admin-only page that provides comprehensive visibility into all system operations for compliance and security tracking.

## Requirements

- **12.3**: Display audit logs with filtering by user, action, and date range
- **12.5**: Display detailed context for sensitive operations (approve, reject, visibility change)

## Features

### Filtering Capabilities

The audit log viewer supports filtering by:

1. **User ID**: Filter logs by specific user
2. **Action**: Filter by audit action type (CREATE, UPDATE, DELETE, APPROVE, REJECT, DOWNLOAD, SHARE, VISIBILITY_CHANGE, LOGIN, LOGOUT)
3. **Resource Type**: Filter by resource type (ASSET, USER, COMPANY, APPROVAL)
4. **Date Range**: Filter logs by start date and end date

### Display Features

1. **Paginated List**: Shows 20 audit logs per page with pagination controls
2. **Color-Coded Badges**: Visual indicators for different action types and resource types
3. **Sensitive Operation Indicator**: Warning icon (⚠️) for sensitive operations
4. **Detailed View Modal**: Click "View Details" to see complete audit log information including:
   - Log ID
   - Timestamp
   - User information (name, email, role)
   - Action type
   - Resource type and ID
   - IP address (if available)
   - User agent (if available)
   - Complete metadata (formatted JSON)

### Sensitive Operations

The following operations are marked as sensitive and include detailed context in their metadata:

- **APPROVE**: Asset approval with visibility changes
- **REJECT**: Asset rejection with reason
- **VISIBILITY_CHANGE**: Changes to asset visibility levels

For these operations, the metadata includes:
- Previous values
- New values
- Reason (for rejections)
- Timestamp
- Operation type

## API Endpoints

### GET /api/audit-logs

List audit logs with filtering and pagination.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `resourceType` (optional): Filter by resource type
- `resourceId` (optional): Filter by specific resource ID
- `startDate` (optional): Filter logs created on or after this date
- `endDate` (optional): Filter logs created on or before this date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "logs": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### GET /api/audit-logs/[id]

Get a specific audit log by ID.

**Response:**
```json
{
  "auditLog": {
    "id": "...",
    "userId": "...",
    "action": "APPROVE",
    "resourceType": "ASSET",
    "resourceId": "...",
    "metadata": {...},
    "ipAddress": "...",
    "userAgent": "...",
    "createdAt": "...",
    "user": {...},
    "asset": {...}
  }
}
```

## Access Control

- **Admin Only**: Only users with the ADMIN role can access the audit log viewer
- **Authentication Required**: Users must be authenticated to access the API endpoints
- **Authorization Checks**: API endpoints verify admin role before returning data

## Navigation

The audit log viewer can be accessed from:

1. **Admin Dashboard**: Click the "Audit Logs" card
2. **Admin Sidebar**: Click "Audit Logs" in the navigation menu
3. **Direct URL**: `/admin/audit-logs`

## Implementation Details

### Components

- **Page**: `app/admin/audit-logs/page.tsx`
- **API Routes**: 
  - `app/api/audit-logs/route.ts`
  - `app/api/audit-logs/[id]/route.ts`

### Services Used

- **AuditRepository**: Data access layer for querying audit logs
- **AuditService**: Service for creating audit log entries (used throughout the system)

### UI Features

- Responsive design with Tailwind CSS
- Color-coded badges for visual clarity
- Modal dialog for detailed view
- Pagination controls
- Filter form with clear filters button
- Loading states
- Error handling

## Usage Example

1. Navigate to `/admin/audit-logs`
2. Use filters to narrow down results:
   - Select an action type (e.g., "APPROVE")
   - Set a date range
   - Enter a user ID
3. Click "View Details" on any log entry to see complete information
4. Use pagination controls to navigate through results
5. Click "Clear Filters" to reset all filters

## Compliance Notes

- All audit logs are immutable (cannot be modified or deleted)
- Sensitive operations include detailed context for compliance tracking
- IP addresses and user agents are recorded when available
- All system operations create audit log entries automatically
