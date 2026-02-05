# Content Creator Asset Preview Fix

## Issue
CONTENT_CREATOR users were unable to view asset previews (thumbnails) in the asset cards on the assets page. The preview images were not loading, showing only placeholder icons.

## Root Cause
The `/api/assets/[id]/public-url` endpoint was not checking visibility permissions before returning the public URL for asset previews. This meant that even though CONTENT_CREATOR users had permission to view the assets in the list, the preview images couldn't load because the endpoint didn't verify their access rights.

Additionally, the SearchService was using `filterVisibleAssets()` instead of `filterAssetsByRole()`, which meant role-specific visibility rules weren't being properly applied.

## Changes Made

### 1. Added Permission Check to Public URL Endpoint
**File:** `app/api/assets/[id]/public-url/route.ts`

- Added imports for `VisibilityService` and `VisibilityChecker`
- Fetch asset with all necessary fields for visibility checking (uploaderId, visibility, companyId, status, uploadType)
- Check if user has permission to view the asset using `visibilityChecker.canView()`
- Return 403 Forbidden if user doesn't have permission
- Only return public URL if user has proper access

### 2. Updated SearchService to Use Role-Based Filtering
**File:** `lib/services/SearchService.ts`

Changed all filtering methods to use `filterAssetsByRole()` instead of `filterVisibleAssets()`:
- `searchAssets()` - Main search method
- `getAssetsByIds()` - Get specific assets by ID
- `searchByTags()` - Tag-based search
- `getRecentAssets()` - Recent uploads
- `getRecentlyApprovedAssets()` - Recently approved assets
- `getAssetsByCompany()` - Company-specific assets

## How It Works Now

### For CONTENT_CREATOR Users:
1. **Own Uploads**: Can always see their own assets regardless of status
2. **Shared Assets**: Can see assets explicitly shared with them via AssetShare
3. **Preview Access**: The public-url endpoint now verifies they have permission before returning the preview URL

### For SEO_SPECIALIST Users:
1. **Own Uploads**: Can always see their own assets regardless of status
2. **Approved Assets**: Can see APPROVED assets they have permission to view
3. **Preview Access**: Same permission checks apply

### For ADMIN Users:
1. **Full Access**: Can see ALL assets regardless of type, status, or visibility
2. **Preview Access**: No restrictions

## Visibility Rules Applied

The fix ensures these visibility levels are properly enforced:
- **UPLOADER_ONLY**: Only uploader + explicitly shared users
- **ADMIN_ONLY**: Admin + uploader
- **COMPANY**: All users in the asset's company
- **ROLE**: Users with specific role (via allowedRole field)
- **SELECTED_USERS**: Only explicitly selected users (via AssetShare)
- **PUBLIC**: All authenticated users

## Testing

To verify the fix works:

1. **Login as CONTENT_CREATOR**
2. **Navigate to /assets page**
3. **Verify you can see:**
   - Preview thumbnails for your own uploaded assets
   - Preview thumbnails for assets shared with you
   - Proper placeholder icons for documents/links
4. **Verify you cannot see:**
   - Preview thumbnails for assets you don't have permission to view (should get 403 error in console)

## Related Files
- `app/api/assets/[id]/public-url/route.ts` - Public URL endpoint with permission checks
- `lib/services/SearchService.ts` - Search service with role-based filtering
- `lib/services/VisibilityChecker.ts` - Permission checking logic
- `lib/services/VisibilityService.ts` - Visibility rule evaluation
- `components/assets/AssetCard.tsx` - Asset card component that fetches previews
