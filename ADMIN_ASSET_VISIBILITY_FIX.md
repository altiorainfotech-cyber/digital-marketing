# Admin Asset Visibility and Approval Fixes

## Issues Fixed

### 1. Admin Cannot See Assets in `/admin/assets`
**Problem**: Admin users were not able to see all assets in the system due to restrictive filtering logic in `VisibilityChecker.ts`.

**Root Cause**: The `filterAssetsByRole` method had logic that limited admin access to only SEO assets and non-UPLOADER_ONLY DOC assets, which was too restrictive for admin users who should have full system access.

**Solution**: Modified `lib/services/VisibilityChecker.ts` to give admin users full access to ALL assets regardless of type, status, or visibility level.

**Changes**:
```typescript
// Before: Admin had limited access
else if (user.role === UserRole.ADMIN) {
  if (asset.uploadType === 'SEO') {
    filteredAssets.push(asset);
  } else if (asset.uploadType === 'DOC') {
    if (asset.visibility !== 'UPLOADER_ONLY') {
      filteredAssets.push(asset);
    }
  }
}

// After: Admin has full access
if (user.role === UserRole.ADMIN) {
  filteredAssets.push(asset);
  continue;
}
```

### 2. No Preview/View Option in Pending Approvals
**Problem**: Admin users couldn't view/preview assets before approving or rejecting them in the Pending Approvals page.

**Solution**: Added a "View Asset" button to each asset card in the Pending Approvals page that navigates to the full asset detail page where admins can see the preview, metadata, and all details.

**Changes in `app/admin/approvals/page.tsx`**:
- Added `Eye` icon import from lucide-react
- Added "View Asset" button above the Approve/Reject buttons
- Button navigates to `/assets/${asset.id}` for full asset preview

### 3. Company Name Display
**Status**: Already working correctly! Company names are displayed in both:
- Pending Approvals page: Shows company name in asset card metadata
- Admin Assets page: Shows company name in asset card metadata
- Company filter dropdown: Shows company names (not IDs)

## Files Modified

1. **lib/services/VisibilityChecker.ts**
   - Modified `filterAssetsByRole` method
   - Admin users now have unrestricted access to all assets
   - Simplified logic by checking admin role first

2. **app/admin/approvals/page.tsx**
   - Added `Eye` icon import
   - Added "View Asset" button to asset cards
   - Improved action button layout with flex-col for better spacing

## Testing Recommendations

### Test Case 1: Admin Asset Visibility
1. Log in as an admin user
2. Navigate to `/admin/assets`
3. Verify that ALL assets are visible (SEO, DOC, all statuses, all visibility levels)
4. Test filters (Type, Status, Company) to ensure they work correctly
5. Verify asset count matches total assets in database

### Test Case 2: Pending Approvals Preview
1. Log in as an admin user
2. Navigate to `/admin/approvals`
3. Verify pending assets are displayed with company names
4. Click "View Asset" button on any asset
5. Verify navigation to asset detail page
6. Verify preview is displayed (image/video/document)
7. Return to approvals and test Approve/Reject functionality

### Test Case 3: Company Filter
1. Navigate to `/admin/approvals` or `/admin/assets`
2. Open the company filter dropdown
3. Verify company names (not IDs) are displayed
4. Select a company and verify filtering works
5. Clear filter and verify all assets return

### Test Case 4: Asset Detail Page
1. Navigate to any asset via "View Asset" button
2. Verify preview displays correctly for:
   - Images (should show image)
   - Videos (should show video player)
   - Documents (should show download message)
   - Links (should show link with open button)
3. Verify all metadata is displayed
4. Test download functionality
5. Test share functionality (if applicable)

## API Endpoints Involved

- `GET /api/assets` - Lists all assets with role-based filtering
- `GET /api/assets/pending` - Lists pending approval assets
- `GET /api/assets/[id]` - Gets single asset details
- `GET /api/assets/[id]/public-url` - Gets public URL for preview
- `POST /api/assets/[id]/approve` - Approves an asset
- `POST /api/assets/[id]/reject` - Rejects an asset

## User Roles and Permissions

### Admin (ADMIN)
- ✅ Can see ALL assets (SEO, DOC, all statuses, all visibility levels)
- ✅ Can approve/reject pending assets
- ✅ Can view asset previews
- ✅ Can download any asset
- ✅ Can share assets
- ✅ Can see all company assets

### SEO Specialist (SEO_SPECIALIST)
- Can see own uploads (all statuses)
- Can see APPROVED assets they have permission to view
- Cannot see pending assets from others
- Cannot approve/reject assets

### Content Creator (CONTENT_CREATOR)
- Can see own uploads (all statuses)
- Can see explicitly shared assets
- Cannot see pending assets from others
- Cannot approve/reject assets

## Additional Notes

- The asset detail page (`/assets/[id]`) already has full preview functionality
- Preview supports images, videos, documents, and links
- R2 public URLs are used for image/video previews
- CORS must be configured on R2 bucket for previews to work
- Company names are fetched via Prisma relations in all API endpoints
- All changes maintain backward compatibility with existing functionality

## Deployment Checklist

- [x] Code changes implemented
- [x] Build successful (no TypeScript errors)
- [ ] Test admin asset visibility
- [ ] Test pending approvals preview
- [ ] Test company filter functionality
- [ ] Test asset detail page preview
- [ ] Verify R2 CORS configuration
- [ ] Deploy to production
