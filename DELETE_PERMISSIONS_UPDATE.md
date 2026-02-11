# Delete Permissions Update for CONTENT_CREATOR

## Overview
Updated delete permissions to allow CONTENT_CREATOR users to delete their own DRAFT and PENDING_REVIEW assets, in addition to REJECTED assets.

## Changes Made

### 1. Frontend - Assets Page (app/assets/page.tsx)

#### Updated Delete Handler
Changed the permission check to allow CONTENT_CREATOR users to delete both DRAFT and PENDING_REVIEW assets:

**Before:**
```javascript
// For CONTENT_CREATOR, only allow deleting PENDING assets
if (user?.role === UserRole.CONTENT_CREATOR) {
  const nonPendingAssets = assetsToDelete.filter(a => a.status !== AssetStatus.PENDING_REVIEW);
  if (nonPendingAssets.length > 0) {
    setError('Content creators can only delete pending assets');
    return;
  }
}
```

**After:**
```javascript
// For CONTENT_CREATOR, only allow deleting DRAFT and PENDING_REVIEW assets
if (user?.role === UserRole.CONTENT_CREATOR) {
  const nonDeletableAssets = assetsToDelete.filter(
    a => a.status !== AssetStatus.DRAFT && a.status !== AssetStatus.PENDING_REVIEW
  );
  if (nonDeletableAssets.length > 0) {
    setError('Content creators can only delete draft and pending assets');
    return;
  }
}
```

### 2. Backend - VisibilityChecker (lib/services/VisibilityChecker.ts)

#### Updated canDelete Method
Enhanced the permission logic to allow CONTENT_CREATOR users to delete DRAFT, PENDING_REVIEW, and REJECTED assets:

**Before:**
```typescript
canDelete(user: User, asset: Asset): boolean {
  // Admin can delete any asset
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // Uploader can delete their own assets if status is DRAFT or REJECTED
  if (user.id === asset.uploaderId) {
    return asset.status === AssetStatus.DRAFT || asset.status === AssetStatus.REJECTED;
  }

  // No one else can delete
  return false;
}
```

**After:**
```typescript
canDelete(user: User, asset: Asset): boolean {
  // Admin can delete any asset
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // Uploader can delete their own assets based on role and status
  if (user.id === asset.uploaderId) {
    // CONTENT_CREATOR can delete DRAFT, PENDING_REVIEW, or REJECTED assets
    if (user.role === UserRole.CONTENT_CREATOR) {
      return (
        asset.status === AssetStatus.DRAFT ||
        asset.status === AssetStatus.PENDING_REVIEW ||
        asset.status === AssetStatus.REJECTED
      );
    }
    
    // Other roles can only delete DRAFT or REJECTED assets
    return asset.status === AssetStatus.DRAFT || asset.status === AssetStatus.REJECTED;
  }

  // No one else can delete
  return false;
}
```

## Permission Matrix

### CONTENT_CREATOR Delete Permissions

| Asset Status | Can Delete? | Notes |
|-------------|-------------|-------|
| DRAFT | ✅ Yes | Own uploads only |
| PENDING_REVIEW | ✅ Yes | Own uploads only |
| APPROVED | ❌ No | Cannot delete approved assets |
| REJECTED | ✅ Yes | Own uploads only |

### ADMIN Delete Permissions

| Asset Status | Can Delete? | Notes |
|-------------|-------------|-------|
| DRAFT | ✅ Yes | Any asset |
| PENDING_REVIEW | ✅ Yes | Any asset |
| APPROVED | ✅ Yes | Any asset |
| REJECTED | ✅ Yes | Any asset |

### SEO_SPECIALIST Delete Permissions

| Asset Status | Can Delete? | Notes |
|-------------|-------------|-------|
| DRAFT | ✅ Yes | Own uploads only |
| PENDING_REVIEW | ❌ No | Cannot delete pending assets |
| APPROVED | ❌ No | Cannot delete approved assets |
| REJECTED | ✅ Yes | Own uploads only |

## User Workflows

### CONTENT_CREATOR Deleting Assets

1. Navigate to /assets page
2. Select one or more assets using checkboxes
3. Click "Delete Selected" button
4. System validates:
   - User is the uploader of all selected assets
   - All selected assets are DRAFT or PENDING_REVIEW status
5. Confirmation dialog appears
6. User confirms deletion
7. Assets are deleted from database
8. UI updates to remove deleted assets

**Error Scenarios:**
- Selecting APPROVED assets: "Content creators can only delete draft and pending assets"
- Selecting someone else's assets: "Insufficient permissions to delete this asset"

### Bulk Delete with Mixed Statuses

**Scenario:** CONTENT_CREATOR selects 3 DRAFT assets and 1 APPROVED asset

**Result:**
- Error message: "Content creators can only delete draft and pending assets"
- No assets are deleted
- User must deselect APPROVED asset and try again

**Scenario:** CONTENT_CREATOR selects 2 DRAFT assets and 2 PENDING_REVIEW assets

**Result:**
- Confirmation dialog appears
- All 4 assets are deleted successfully
- UI updates to show remaining assets

## API Endpoint

### DELETE /api/assets/[id]

**Permission Checks:**
1. User must be authenticated
2. Asset must exist
3. User must have delete permission (via `canDelete` method)

**Response:**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

**Error Responses:**
- 401: Unauthorized (not logged in)
- 403: Forbidden (no permission to delete)
- 404: Asset not found
- 500: Internal server error

## Testing Checklist

### CONTENT_CREATOR Tests
- [ ] Can delete own DRAFT asset
- [ ] Can delete own PENDING_REVIEW asset
- [ ] Can delete own REJECTED asset
- [ ] Cannot delete own APPROVED asset
- [ ] Cannot delete someone else's DRAFT asset
- [ ] Cannot delete someone else's PENDING_REVIEW asset
- [ ] Can bulk delete multiple DRAFT assets
- [ ] Can bulk delete multiple PENDING_REVIEW assets
- [ ] Can bulk delete mix of DRAFT and PENDING_REVIEW assets
- [ ] Error shown when trying to delete APPROVED asset
- [ ] Error shown when trying to delete someone else's asset

### ADMIN Tests
- [ ] Can delete any DRAFT asset
- [ ] Can delete any PENDING_REVIEW asset
- [ ] Can delete any APPROVED asset
- [ ] Can delete any REJECTED asset
- [ ] Can bulk delete assets with any status
- [ ] Can delete assets from any user

### SEO_SPECIALIST Tests
- [ ] Can delete own DRAFT asset
- [ ] Cannot delete own PENDING_REVIEW asset
- [ ] Can delete own REJECTED asset
- [ ] Cannot delete own APPROVED asset
- [ ] Error shown when trying to delete PENDING_REVIEW asset

## Security Considerations

1. **Ownership Validation**: Backend validates user is the uploader
2. **Status Validation**: Backend validates asset status before deletion
3. **Role-Based Logic**: Different rules for different user roles
4. **Audit Logging**: All deletions are logged with user, IP, and timestamp
5. **Cascade Deletion**: Related records (downloads, shares, etc.) are deleted automatically
6. **No Soft Delete**: Assets are permanently deleted (consider adding soft delete in future)

## Future Enhancements

1. **Soft Delete**: Mark assets as deleted instead of permanent deletion
2. **Restore Functionality**: Allow admins to restore deleted assets
3. **Bulk Delete Limit**: Limit number of assets that can be deleted at once
4. **Delete Confirmation**: Require typing asset title for important assets
5. **Delete Reason**: Require reason for deleting PENDING_REVIEW assets
6. **Notification**: Notify admins when PENDING_REVIEW assets are deleted
