# Admin Visibility Control for Approved Assets

## Overview

This implementation adds visibility control functionality for admin users on approved assets. Admins can now:

1. View all approved assets regardless of their visibility settings
2. Change the visibility level of any approved asset from the asset detail page

## Changes Made

### 1. New API Endpoint: `/api/assets/[id]/visibility`

**File**: `app/api/assets/[id]/visibility/route.ts`

A new PATCH endpoint that allows admin users to update the visibility level of any asset.

**Features**:
- Admin-only access (403 error for non-admin users)
- Validates visibility level and required fields
- Supports role-based visibility (ROLE visibility with allowedRole)
- Logs visibility changes to audit log
- Returns updated visibility information

**Request Body**:
```json
{
  "visibility": "PUBLIC" | "UPLOADER_ONLY" | "ADMIN_ONLY" | "COMPANY" | "ROLE" | "SELECTED_USERS",
  "allowedRole": "ADMIN" | "CONTENT_CREATOR" | "SEO_SPECIALIST" // Required when visibility is ROLE
}
```

**Response**:
```json
{
  "id": "asset-id",
  "visibility": "PUBLIC",
  "allowedRole": null,
  "message": "Visibility updated successfully"
}
```

### 2. Fixed Admin View All Assets Permission

**File**: `lib/services/VisibilityService.ts`

**Critical Fix**: Added admin bypass to the `canUserViewAsset` method to ensure admins can view ALL assets regardless of visibility level.

**Before**:
```typescript
async canUserViewAsset(user: User, asset: Asset): Promise<boolean> {
  // Users can ALWAYS see their own uploads
  if (user.id === asset.uploaderId) {
    return true;
  }
  // ... visibility checks
}
```

**After**:
```typescript
async canUserViewAsset(user: User, asset: Asset): Promise<boolean> {
  // ADMIN users can ALWAYS view ALL assets regardless of visibility
  if (user.role === UserRole.ADMIN) {
    return true;
  }
  
  // Users can ALWAYS see their own uploads
  if (user.id === asset.uploaderId) {
    return true;
  }
  // ... visibility checks
}
```

This ensures that:
- Admins can view assets with ANY visibility level (UPLOADER_ONLY, ADMIN_ONLY, COMPANY, ROLE, SELECTED_USERS, PUBLIC)
- Admins can view assets in ANY status (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- Admins bypass all visibility restrictions

### 3. Asset Detail Page Updates

**File**: `app/assets/[id]/page.tsx`

Added visibility control UI for admin users on approved assets.

**New Features**:

#### Visibility Display with Change Button
- Shows current visibility level in the Details section
- "Change" button appears for admins on approved assets
- Opens a modal to select new visibility level

#### Visibility Change Modal
- Clean modal interface for changing visibility
- Dropdown with all visibility options:
  - Private (Uploader Only)
  - Admin Only
  - Public (Everyone)
  - Company
  - SEO Specialist Role
  - Content Creator Role
  - Selected Users
- Handles role-based visibility correctly
- Shows loading state during update
- Displays success/error messages

#### New State Variables
```typescript
const canChangeVisibility = isAdmin && asset?.status === AssetStatus.APPROVED;
const [showVisibilityModal, setShowVisibilityModal] = useState(false);
const [selectedVisibility, setSelectedVisibility] = useState<VisibilityLevel | 'SEO_SPECIALIST' | 'CONTENT_CREATOR'>(VisibilityLevel.COMPANY);
const [updatingVisibility, setUpdatingVisibility] = useState(false);
```

#### New Handler Function
```typescript
const handleVisibilityChange = async () => {
  // Prepares request body based on visibility selection
  // Handles role-based visibility (SEO_SPECIALIST, CONTENT_CREATOR)
  // Calls the new API endpoint
  // Updates local state and shows feedback
}
```

### 3. Admin Asset Visibility

**Critical Fix Applied**: The `VisibilityService.canUserViewAsset` method now includes an admin bypass at the very beginning:

```typescript
// ADMIN users can ALWAYS view ALL assets regardless of visibility
if (user.role === UserRole.ADMIN) {
  return true;
}
```

This ensures:
- ✅ Admins see ALL assets (draft, pending, approved, rejected)
- ✅ Admins see assets with ANY visibility level
- ✅ Admins bypass all visibility restrictions
- ✅ No "You do not have permission to view this asset" errors for admins

**Previous Issue**: The admin check was missing from the visibility service, causing admins to be blocked from viewing assets with certain visibility levels (like UPLOADER_ONLY, COMPANY, ROLE, SELECTED_USERS).

**Resolution**: Added the admin role check as the first condition in `canUserViewAsset`, ensuring admins always have full access.

## User Experience

### For Admin Users

1. **Viewing Assets**:
   - Admins can see all approved assets in the asset list, regardless of visibility
   - No filtering or restrictions apply

2. **Changing Visibility**:
   - Navigate to any approved asset's detail page
   - In the "Details" section, find the "Visibility" field
   - Click the "Change" button next to the current visibility level
   - Select the new visibility level from the dropdown
   - Click "Update Visibility"
   - The change is applied immediately and logged to the audit trail

3. **Visibility Options**:
   - **Private (Uploader Only)**: Only the uploader can see the asset
   - **Admin Only**: Only admins and the uploader can see the asset
   - **Public (Everyone)**: All authenticated users can see the asset
   - **Company**: All users in the asset's company can see it
   - **SEO Specialist Role**: Only SEO Specialists can see it
   - **Content Creator Role**: Only Content Creators can see it
   - **Selected Users**: Only explicitly shared users can see it

### For Non-Admin Users

- No changes to existing behavior
- Visibility rules continue to apply as before
- Cannot change visibility of any assets

## Technical Details

### Visibility Levels

The system supports 7 visibility levels (from `types/index.ts`):

```typescript
export enum VisibilityLevel {
  UPLOADER_ONLY = 'UPLOADER_ONLY',
  ADMIN_ONLY = 'ADMIN_ONLY',
  COMPANY = 'COMPANY',
  TEAM = 'TEAM',
  ROLE = 'ROLE',
  SELECTED_USERS = 'SELECTED_USERS',
  PUBLIC = 'PUBLIC'
}
```

### Role-Based Visibility

When visibility is set to `ROLE`, the `allowedRole` field specifies which role can view the asset:

```typescript
// In the database (Prisma schema)
model Asset {
  visibility  VisibilityLevel @default(UPLOADER_ONLY)
  allowedRole UserRole?
  // ...
}
```

### Audit Logging

All visibility changes are logged using the `AuditService`:

```typescript
await auditService.logVisibilityChange(
  assetId,
  user.id,
  previousVisibility,
  newVisibility,
  ipAddress,
  userAgent
);
```

This creates an audit trail showing:
- Who changed the visibility
- When it was changed
- What the previous and new values were
- IP address and user agent for security

## Security Considerations

1. **Admin-Only Access**: Only users with `UserRole.ADMIN` can change visibility
2. **Approved Assets Only**: Visibility can only be changed on approved assets
3. **Validation**: All inputs are validated before processing
4. **Audit Trail**: All changes are logged for compliance and security
5. **Permission Checks**: The API endpoint verifies admin role before allowing changes

## Testing

To test the implementation:

1. **As Admin**:
   - Log in as an admin user
   - Navigate to any approved asset
   - Verify you can see the "Change" button next to Visibility
   - Click "Change" and select a new visibility level
   - Verify the change is applied successfully
   - Check the audit logs to confirm the change was logged

2. **As Non-Admin**:
   - Log in as a content creator or SEO specialist
   - Navigate to an asset
   - Verify the "Change" button does NOT appear
   - Attempt to call the API directly (should return 403 Forbidden)

3. **Visibility Filtering**:
   - Create assets with different visibility levels
   - Verify admins can see all of them
   - Verify non-admin users only see assets they have permission to view

## Future Enhancements

Potential improvements for future iterations:

1. **Bulk Visibility Changes**: Allow admins to change visibility for multiple assets at once
2. **Visibility History**: Show a history of visibility changes in the asset detail page
3. **Visibility Templates**: Create preset visibility configurations for common scenarios
4. **Scheduled Visibility**: Allow setting visibility to change at a specific date/time
5. **Visibility Notifications**: Notify affected users when visibility changes

## Related Files

- `app/api/assets/[id]/visibility/route.ts` - New API endpoint
- `app/assets/[id]/page.tsx` - Asset detail page with visibility controls
- `lib/services/SearchService.ts` - Asset filtering logic (already supports admin view-all)
- `lib/services/VisibilityService.ts` - Visibility rule evaluation
- `lib/services/AuditService.ts` - Audit logging for visibility changes
- `types/index.ts` - Type definitions for visibility levels
