# Asset Tabs Implementation Guide

## Overview
Implement two-tab asset view for users (Uploaded and Assigned) and comprehensive admin view.

## Requirements

### For Regular Users (CONTENT_CREATOR, SEO_SPECIALIST)
1. **Uploaded Tab**: Shows assets uploaded by the user
2. **Assigned Tab**: Shows assets assigned to the user:
   - Public assets
   - Assets with role-based visibility matching user's role
   - Assets explicitly shared with the user

### For Admin Users
- Can see ALL assets except private (UPLOADER_ONLY) assets of other users
- Admin panel shows all approved/rejected assets

## Implementation Steps

### 1. Update API Search Endpoint (`app/api/assets/search/route.ts`)

Add support for `uploadedBy` and `assignedTo` query parameters:

```typescript
// Add to query parameters
if (query.uploadedBy === 'me') {
  where.uploaderId = user.id;
}

if (query.assignedTo === 'me') {
  // For assigned assets, exclude user's own uploads
  where.uploaderId = { not: user.id };
  
  // Filter by visibility rules
  where.OR = [
    { visibility: 'PUBLIC' },
    { 
      visibility: 'ROLE',
      allowedRole: user.role
    },
    // Add shared assets logic here
  ];
}
```

### 2. Update User Assets Page (`app/assets/page.tsx`)

Add tabs for "Uploaded" and "Assigned":
- Uploaded: `?uploadedBy=me`
- Assigned: `?assignedTo=me`

### 3. Update Admin Assets Page (`app/admin/assets/page.tsx`)

Show all assets with comprehensive filtering:
- All statuses (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- Exclude UPLOADER_ONLY assets from other users
- Include search, filters, and bulk actions

### 4. Update VisibilityChecker Service

Add method to check if asset is assigned to user:

```typescript
isAssignedToUser(asset: Asset, user: User): boolean {
  // Check if public
  if (asset.visibility === 'PUBLIC') return true;
  
  // Check if role-based and matches user role
  if (asset.visibility === 'ROLE' && asset.allowedRole === user.role) return true;
  
  // Check if explicitly shared
  // (implement sharing logic)
  
  return false;
}
```

## API Endpoints to Update

1. `/api/assets/search` - Add `uploadedBy` and `assignedTo` parameters
2. `/api/admin/assets` - New endpoint for admin to see all assets

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
  OR id IN (SELECT assetId FROM AssetShare WHERE sharedWithId = :userId)
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

## UI Components

### Tab Component
- Uploaded tab with FolderUp icon
- Assigned tab with FolderDown icon
- Badge showing count for each tab

### Empty States
- Uploaded: "Upload your first asset"
- Assigned: "No assets assigned to you yet"

## Testing Checklist

- [ ] CONTENT_CREATOR sees own uploads in Uploaded tab
- [ ] CONTENT_CREATOR sees public assets in Assigned tab
- [ ] CONTENT_CREATOR sees role-based assets in Assigned tab
- [ ] SEO_SPECIALIST sees own uploads in Uploaded tab
- [ ] SEO_SPECIALIST sees public assets in Assigned tab
- [ ] SEO_SPECIALIST sees role-based assets in Assigned tab
- [ ] Admin sees all assets except private assets of others
- [ ] Admin can approve/reject assets
- [ ] Filters work correctly on both tabs
- [ ] Search works correctly on both tabs
- [ ] Pagination works correctly on both tabs
