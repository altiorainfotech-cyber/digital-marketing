# Private Asset Visibility Fix

## Problem
Private assets (marked as "Private - For personal documents, this file will be private to you only") were appearing in the admin user's asset list, even though they shouldn't be visible.

## Root Cause
In `lib/services/VisibilityChecker.ts`, the `filterAssetsByRole()` method had an overly broad admin bypass:

```typescript
// Admin can see ALL assets (full access)
if (user.role === UserRole.ADMIN) {
  filteredAssets.push(asset);
  continue;
}
```

This meant admins would see EVERY asset in their list, including private (UPLOADER_ONLY) assets uploaded by other users.

## Solution
Modified the admin filtering logic to exclude private assets unless:
1. The admin is the uploader of the asset, OR
2. The asset is explicitly shared with the admin

### Updated Logic
```typescript
// Users can ALWAYS see their own uploads regardless of status
if (asset.uploaderId === user.id) {
  filteredAssets.push(asset);
  continue;
}

// Admin can see all assets EXCEPT private (UPLOADER_ONLY) assets uploaded by others
if (user.role === UserRole.ADMIN) {
  // Skip private assets that don't belong to the admin
  if (asset.visibility === VisibilityLevel.UPLOADER_ONLY) {
    // Check if explicitly shared with admin
    const canView = await this.canView(user, asset);
    if (canView) {
      filteredAssets.push(asset);
    }
    continue;
  }
  // All other assets are visible to admin
  filteredAssets.push(asset);
  continue;
}
```

## What Changed
- Moved the "own uploads" check BEFORE the admin check (more efficient)
- Added explicit filtering for UPLOADER_ONLY visibility level
- Private assets now only appear if explicitly shared with the admin
- All other visibility levels (PUBLIC, COMPANY, ADMIN_ONLY, etc.) remain visible to admins

## Expected Behavior After Fix
1. Admin uploads a private doc → Appears in admin's list ✓
2. User uploads a private doc → Does NOT appear in admin's list ✓
3. User uploads a private doc and shares with admin → Appears in admin's list ✓
4. User uploads a public/company/admin-only doc → Appears in admin's list ✓

## Files Modified
- `lib/services/VisibilityChecker.ts` - Updated `filterAssetsByRole()` method

## Testing
To verify the fix:
1. Log in as a regular user (Content Creator)
2. Upload a document with "Private" visibility
3. Log in as an admin user
4. Navigate to the admin assets page
5. Verify the private document does NOT appear in the list
6. Log back in as the regular user and share the document with the admin
7. Log in as admin again
8. Verify the document NOW appears in the list
