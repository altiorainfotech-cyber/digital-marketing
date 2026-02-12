# Content Creator Uploader Filter Feature

## Overview
Added a new filter option for CONTENT_CREATOR users to toggle between viewing only their own uploads and viewing all assets uploaded by any CONTENT_CREATOR user.

## Changes Made

### 1. Frontend (app/assets/page.tsx)
- Added `uploaderScope` field to `SearchFilters` interface with values: `'mine' | 'all_creators' | ''`
- Added new dropdown filter "Show Assets From" visible only to CONTENT_CREATOR users with options:
  - "All Assets (Default)" - Shows all assets the user has permission to see
  - "My Uploads Only" - Shows only assets uploaded by the current user
  - "All Content Creators" - Shows all assets uploaded by any CONTENT_CREATOR user
- Added filter badge display for active uploader scope filter
- Included `uploaderScope` in active filters count and clear all filters logic

### 2. API Route (app/api/assets/search/route.ts)
- Added `uploaderScope` query parameter handling
- When `uploaderScope='mine'`: Sets `uploaderId` to current user's ID
- When `uploaderScope='all_creators'`: Sets `uploaderRole` to 'CONTENT_CREATOR'
- Only applies when user role is CONTENT_CREATOR

### 3. Search Service (lib/services/SearchService.ts)
- Added `uploaderRole` parameter to `SearchParams` interface
- Added filtering logic to filter assets by uploader role
- When `uploaderRole` is specified, filters assets where `uploader.role` matches the specified role

## User Experience

### For CONTENT_CREATOR Users:
1. Navigate to the Assets page
2. Click on "Filters" to expand the filter panel
3. Use the "Show Assets From" dropdown to select:
   - **All Assets (Default)**: See all assets you have permission to view (your uploads + shared assets)
   - **My Uploads Only**: See only assets you uploaded
   - **All Content Creators**: See all assets uploaded by any CONTENT_CREATOR user (including yourself and other content creators)

### Visual Indicators:
- Active filter shows as a badge below the filter panel
- Badge displays "Uploader: My Uploads" or "Uploader: All Content Creators"
- Click the X on the badge to clear the filter

## Technical Details

### Database Query
When filtering by uploader role, the query includes:
```typescript
where: {
  uploader: {
    role: 'CONTENT_CREATOR'
  }
}
```

### Permission Handling
- The existing visibility and permission checks still apply
- Users can only see assets they have permission to view based on visibility settings
- The uploader scope filter is an additional filter on top of existing permissions

## Benefits
1. **Collaboration**: Content creators can see what other content creators are uploading
2. **Differentiation**: Easy to distinguish between own uploads and others' uploads
3. **Flexibility**: Can toggle between personal view and team view
4. **Discovery**: Helps content creators discover assets created by their peers

## Example Use Cases
1. A content creator wants to see only their own work → Select "My Uploads Only"
2. A content creator wants to see what the team is creating → Select "All Content Creators"
3. A content creator wants to see everything they have access to → Select "All Assets (Default)"
