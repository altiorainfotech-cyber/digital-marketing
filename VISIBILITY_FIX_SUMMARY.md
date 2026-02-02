# Visibility Fix Summary

## Issue
Users (CONTENT_CREATOR and SEO_SPECIALIST) were unable to see their own uploaded assets. They could only see approved assets from others, but not their own uploads in any status (DRAFT, PENDING_REVIEW, REJECTED).

## Root Cause
The `filterAssetsByRole` method in `VisibilityChecker` was checking visibility permissions BEFORE checking if the user was the uploader. This meant:
- SEO_SPECIALIST users could only see APPROVED assets
- Their own uploads (DRAFT, PENDING_REVIEW, REJECTED) were filtered out

## Fixes Applied

### 1. VisibilityChecker.ts - `filterAssetsByRole` Method
**Changed:** Users can now ALWAYS see their own uploads regardless of status

**Before:**
```typescript
// Check basic visibility first
const canView = await this.canView(user, asset);
if (!canView) {
  continue;
}

// Apply role-specific rules
if (user.role === UserRole.SEO_SPECIALIST) {
  // Only APPROVED assets
  if (asset.status === AssetStatus.APPROVED) {
    filteredAssets.push(asset);
  }
}
```

**After:**
```typescript
// Users can ALWAYS see their own uploads regardless of status
if (asset.uploaderId === user.id) {
  filteredAssets.push(asset);
  continue;
}

// Check basic visibility for assets uploaded by others
const canView = await this.canView(user, asset);
if (!canView) {
  continue;
}

// Apply role-specific rules for assets uploaded by others
if (user.role === UserRole.SEO_SPECIALIST) {
  // Only APPROVED assets from others
  if (asset.status === AssetStatus.APPROVED) {
    filteredAssets.push(asset);
  }
}
```

### 2. VisibilityService.ts - `canUserViewAsset` Method
**Changed:** Added uploader check at the beginning

**Before:**
```typescript
async canUserViewAsset(user: User, asset: Asset): Promise<boolean> {
  // PUBLIC: All authenticated users can view
  if (asset.visibility === VisibilityLevel.PUBLIC) {
    return true;
  }
  
  // UPLOADER_ONLY: Only the uploader can view
  if (asset.visibility === VisibilityLevel.UPLOADER_ONLY) {
    if (user.id === asset.uploaderId) {
      return true;
    }
    // ...
  }
}
```

**After:**
```typescript
async canUserViewAsset(user: User, asset: Asset): Promise<boolean> {
  // Users can ALWAYS see their own uploads
  if (user.id === asset.uploaderId) {
    return true;
  }
  
  // PUBLIC: All authenticated users can view
  if (asset.visibility === VisibilityLevel.PUBLIC) {
    return true;
  }
  // ...
}
```

### 3. VisibilityService.ts - Role-Based Visibility
**Changed:** Added support for `allowedRole` field

**Before:**
```typescript
// ROLE: Users with specific role can view (via AssetShare)
if (asset.visibility === VisibilityLevel.ROLE) {
  return await this.checkAssetShareForRole(user, asset);
}
```

**After:**
```typescript
// ROLE: Users with specific role can view (using allowedRole field)
if (asset.visibility === VisibilityLevel.ROLE) {
  // Check if asset has allowedRole field and it matches user's role
  const assetWithRole = asset as any;
  if (assetWithRole.allowedRole) {
    return user.role === assetWithRole.allowedRole;
  }
  // Fallback to AssetShare for backward compatibility
  return await this.checkAssetShareForRole(user, asset);
}
```

### 4. SearchService.ts - Include allowedRole Field
**Changed:** Added `allowedRole` to asset mapping

**Before:**
```typescript
const assetsForPermissionCheck = assets.map(asset => ({
  // ... other fields
  visibility: asset.visibility,
  companyId: asset.companyId,
  // ...
})) as Asset[];
```

**After:**
```typescript
const assetsForPermissionCheck = assets.map(asset => ({
  // ... other fields
  visibility: asset.visibility,
  allowedRole: (asset as any).allowedRole, // Include allowedRole for role-based visibility
  companyId: asset.companyId,
  // ...
})) as Asset[];
```

## Expected Behavior After Fix

### For CONTENT_CREATOR Users
- ✅ Can see ALL their own uploads (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- ✅ Can see PUBLIC assets from others
- ✅ Can see CONTENT_CREATOR role-based assets from others
- ✅ Can see explicitly shared assets

### For SEO_SPECIALIST Users
- ✅ Can see ALL their own uploads (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- ✅ Can see PUBLIC assets from others
- ✅ Can see SEO_SPECIALIST role-based assets from others
- ✅ Can see APPROVED assets they have permission to view
- ❌ Cannot see non-APPROVED assets from others (unless explicitly shared)

### For ADMIN Users
- ✅ Can see ALL SEO assets
- ✅ Can see ALL their own uploads
- ✅ Can see PUBLIC assets
- ✅ Can see ADMIN_ONLY assets
- ❌ Cannot see UPLOADER_ONLY Doc assets from others (unless explicitly shared)

## Testing

To verify the fix works:

1. **Login as CONTENT_CREATOR**
   - Upload a new asset (should be DRAFT or PENDING_REVIEW)
   - Check assets page - should see the uploaded asset
   - Submit for review - should still see it

2. **Login as SEO_SPECIALIST**
   - Upload a new asset
   - Check assets page - should see the uploaded asset in all statuses
   - Check assigned tab - should see public and SEO_SPECIALIST role assets

3. **Login as ADMIN**
   - Approve an asset with "SEO Specialist Role" visibility
   - Login as SEO_SPECIALIST - should see the approved asset
   - Login as CONTENT_CREATOR - should NOT see the SEO specialist asset

## Files Modified

1. `lib/services/VisibilityChecker.ts` - Fixed filterAssetsByRole to check uploader first
2. `lib/services/VisibilityService.ts` - Added uploader check at beginning and allowedRole support
3. `lib/services/SearchService.ts` - Added allowedRole field to asset mapping

## Impact

This fix ensures that:
- Users can always manage their own assets
- Users can see their drafts, pending reviews, and rejected assets
- Role-based visibility works correctly with the new `allowedRole` field
- The system properly separates "my uploads" from "assigned to me" assets
