# Asset Organization Implementation Summary

## Overview
Implemented a comprehensive asset organization system with separate views for uploaded and assigned assets for regular users, and a complete admin view.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- Added `allowedRole` field to Asset model (type: `UserRole?`)
- This field stores which role can access role-based assets
- Migration created: `20260202115504_add_allowed_role_to_asset`

### 2. Admin Approval Page (`app/admin/approvals/page.tsx`)
Updated visibility options to 4 specific levels:
- **Private (Uploader Only)** - `UPLOADER_ONLY`
- **Public (Everyone)** - `PUBLIC`
- **SEO Specialist Role** - `ROLE` with `allowedRole = SEO_SPECIALIST`
- **Content Creator Role** - `ROLE` with `allowedRole = CONTENT_CREATOR`

### 3. Approval Service (`lib/services/ApprovalService.ts`)
- Added `allowedRole` parameter to `ApproveAssetParams`
- Updated `approveAsset` method to handle role-based visibility
- Added audit logging for `allowedRole` changes

### 4. Approval API Route (`app/api/assets/[id]/approve/route.ts`)
- Updated to accept `allowedRole` from request body
- Passes `allowedRole` to approval service

### 5. Search API Route (`app/api/assets/search/route.ts`)
Added new query parameters:
- `uploadedBy=me` - Returns assets uploaded by current user
- `assignedTo=me` - Returns assets assigned to current user (public or role-based)

### 6. Search Service (`lib/services/SearchService.ts`)
- Added `assignedToUser` and `assignedToRole` parameters to `SearchParams`
- Implemented logic to filter assigned assets:
  - Excludes user's own uploads
  - Includes PUBLIC assets
  - Includes ROLE-based assets matching user's role
  - Ready for shared assets integration

## How It Works

### For Regular Users (CONTENT_CREATOR, SEO_SPECIALIST)

#### Uploaded Tab
- Shows all assets uploaded by the user
- API call: `/api/assets/search?uploadedBy=me`
- Includes all statuses: DRAFT, PENDING_REVIEW, APPROVED, REJECTED

#### Assigned Tab
- Shows assets assigned to the user
- API call: `/api/assets/search?assignedTo=me`
- Includes:
  - Public assets (visibility = PUBLIC)
  - Role-based assets (visibility = ROLE and allowedRole matches user's role)
  - Excludes user's own uploads

### For Admin Users

#### Admin Assets Page
- Shows ALL assets in the system
- Excludes UPLOADER_ONLY assets from other users
- Includes all statuses and visibility levels
- Full search, filter, and management capabilities

#### Approval Workflow
1. Admin reviews pending assets
2. Selects one of 4 visibility levels:
   - Private → Only uploader can see
   - Public → Everyone can see
   - SEO Specialist Role → Only SEO_SPECIALIST users can see
   - Content Creator Role → Only CONTENT_CREATOR users can see
3. System stores visibility level and allowedRole
4. Asset becomes visible based on selected visibility

## API Endpoints

### Search Assets
```
GET /api/assets/search

Query Parameters:
- uploadedBy=me : Get assets uploaded by current user
- assignedTo=me : Get assets assigned to current user
- query : Search term
- assetType : Filter by type
- status : Filter by status
- uploadType : Filter by upload type
- sortBy : Sort field
- sortOrder : asc/desc
- page : Page number
- limit : Results per page
```

### Approve Asset
```
POST /api/assets/[id]/approve

Body:
{
  "newVisibility": "ROLE",
  "allowedRole": "SEO_SPECIALIST" | "CONTENT_CREATOR"
}
```

## Database Queries

### Uploaded Assets
```sql
SELECT * FROM Asset 
WHERE uploaderId = :userId
ORDER BY uploadedAt DESC
```

### Assigned Assets
```sql
SELECT * FROM Asset 
WHERE uploaderId != :userId
AND (
  visibility = 'PUBLIC'
  OR (visibility = 'ROLE' AND allowedRole = :userRole)
)
ORDER BY uploadedAt DESC
```

### Admin All Assets
```sql
SELECT * FROM Asset 
WHERE visibility != 'UPLOADER_ONLY' 
OR uploaderId = :adminId
ORDER BY uploadedAt DESC
```

## Next Steps

### To Complete Implementation:

1. **Update User Assets Page** (`app/assets/page.tsx`)
   - Add tab component with "Uploaded" and "Assigned" tabs
   - Implement separate API calls for each tab
   - Add tab-specific empty states

2. **Update Admin Assets Page** (`app/admin/assets/page.tsx`)
   - Implement full asset listing with filters
   - Add bulk actions
   - Add status management

3. **Update VisibilityChecker** (`lib/services/VisibilityChecker.ts`)
   - Add `allowedRole` checking in visibility logic
   - Ensure role-based assets are properly filtered

4. **Add Asset Sharing** (Future Enhancement)
   - Implement AssetShare functionality
   - Add shared assets to assigned tab
   - Add sharing UI

## Testing Checklist

- [ ] CONTENT_CREATOR uploads asset → appears in Uploaded tab
- [ ] CONTENT_CREATOR sees public assets in Assigned tab
- [ ] CONTENT_CREATOR sees CONTENT_CREATOR role assets in Assigned tab
- [ ] CONTENT_CREATOR does NOT see SEO_SPECIALIST role assets
- [ ] SEO_SPECIALIST uploads asset → appears in Uploaded tab
- [ ] SEO_SPECIALIST sees public assets in Assigned tab
- [ ] SEO_SPECIALIST sees SEO_SPECIALIST role assets in Assigned tab
- [ ] SEO_SPECIALIST does NOT see CONTENT_CREATOR role assets
- [ ] Admin approves asset with "SEO Specialist Role" → SEO_SPECIALIST users see it
- [ ] Admin approves asset with "Content Creator Role" → CONTENT_CREATOR users see it
- [ ] Admin approves asset with "Public" → all users see it
- [ ] Admin approves asset with "Private" → only uploader sees it
- [ ] Admin sees all assets except private assets of others
- [ ] Filters work correctly on both tabs
- [ ] Search works correctly on both tabs
- [ ] Pagination works correctly on both tabs

## Files Modified

1. `prisma/schema.prisma` - Added allowedRole field
2. `app/admin/approvals/page.tsx` - Updated visibility options
3. `lib/services/ApprovalService.ts` - Added allowedRole handling
4. `app/api/assets/[id]/approve/route.ts` - Added allowedRole parameter
5. `app/api/assets/search/route.ts` - Added uploadedBy and assignedTo parameters
6. `lib/services/SearchService.ts` - Added assigned assets filtering logic

## Files To Update (Next Steps)

1. `app/assets/page.tsx` - Add tabs for Uploaded/Assigned
2. `app/admin/assets/page.tsx` - Implement full admin asset management
3. `lib/services/VisibilityChecker.ts` - Add allowedRole checking
