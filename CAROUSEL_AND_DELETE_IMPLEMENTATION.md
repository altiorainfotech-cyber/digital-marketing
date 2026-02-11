# Carousel Asset Type and Delete Functionality Implementation

## Overview
Added support for Carousel asset type that allows CONTENT_CREATOR users to upload multiple images and videos as a single grouped asset. Also implemented selective delete functionality for CONTENT_CREATOR users to delete pending assets.

## Changes Made

### 1. Database Schema Updates (prisma/schema.prisma)

#### Added CAROUSEL to AssetType enum
```prisma
enum AssetType {
  IMAGE
  VIDEO
  DOCUMENT
  LINK
  CAROUSEL  // NEW
}
```

#### Added CarouselItem model
```prisma
model CarouselItem {
  id          String    @id @default(cuid())
  carouselId  String
  storageUrl  String
  fileSize    Int?
  mimeType    String?
  itemType    AssetType
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  Carousel    Asset     @relation(fields: [carouselId], references: [id], onDelete: Cascade)

  @@index([carouselId])
}
```

#### Updated Asset model
- Added `CarouselItem` relation to track carousel items

### 2. Upload Page Updates (app/assets/upload/page.tsx)

#### Added Carousel Option
- Added CAROUSEL to asset type dropdown
- Shows helper text explaining carousel functionality
- Allows multiple file uploads for carousel type

#### Enhanced Validation
- Requires minimum 2 files for carousel assets
- Validates that carousel only contains images and videos
- Prevents mixing document types in carousel

#### Carousel Upload Logic
- Creates carousel asset via `/api/assets/carousel` endpoint
- Uploads all files with progress tracking
- Groups files under single carousel asset ID
- Redirects to carousel detail page after upload

### 3. New API Route (app/api/assets/carousel/route.ts)

#### POST /api/assets/carousel
Creates a carousel asset with multiple file upload URLs

**Request Body:**
```json
{
  "title": "string",
  "description": "string (optional)",
  "tags": ["string"],
  "uploadType": "SEO | DOC",
  "companyId": "string (required for SEO)",
  "targetPlatforms": ["string"],
  "campaignName": "string (optional)",
  "visibility": "VisibilityLevel (optional)",
  "submitForReview": "boolean",
  "fileCount": "number (minimum 2)"
}
```

**Response:**
```json
{
  "carouselId": "string",
  "uploadUrls": ["string"]
}
```

**Features:**
- Validates minimum 2 files
- Creates carousel asset with DRAFT or PENDING_REVIEW status
- Generates presigned URLs for each file
- Supports SEO and DOC upload types

### 4. Assets Page Updates (app/assets/page.tsx)

#### Bulk Selection
- Enabled checkboxes on all asset cards (grid, list, company views)
- Added selection state management
- Shows selected count in bulk actions bar

#### Bulk Actions Bar
- Appears when assets are selected
- Shows count of selected assets
- Provides "Clear selection" button
- Provides "Delete Selected" button

#### Delete Functionality
- CONTENT_CREATOR users can only delete PENDING_REVIEW assets
- ADMIN users can delete any assets
- Confirms before deletion
- Shows error if trying to delete non-pending assets (for CONTENT_CREATOR)
- Updates UI after successful deletion
- Handles bulk deletion with error reporting

#### Permission Logic
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

### 5. Carousel Display (Future Enhancement)

#### Company Folder View
- Carousel assets appear as folders
- Clicking expands to show all carousel items
- Items displayed in order
- Shows thumbnail preview of first item

#### Carousel Detail View (To be implemented)
- Shows all carousel items in a gallery
- Allows navigation between items
- Displays item metadata
- Supports download of individual items or entire carousel

## User Workflows

### Creating a Carousel
1. Navigate to /assets/upload
2. Select "Carousel (Multiple Images/Videos)" as asset type
3. Choose upload type (SEO or DOC)
4. Select company (if SEO upload)
5. Add title, description, tags
6. Upload 2 or more images/videos
7. Click "Upload" or "Upload & Submit for Review"
8. System creates carousel and uploads all files
9. Redirects to carousel detail page

### Deleting Assets (CONTENT_CREATOR)
1. Navigate to /assets page
2. Select one or more PENDING assets using checkboxes
3. Click "Delete Selected" in bulk actions bar
4. Confirm deletion
5. Assets are removed from the list

**Restrictions:**
- Can only select and delete PENDING_REVIEW assets
- Attempting to delete APPROVED, REJECTED, or DRAFT assets shows error
- Must confirm deletion before proceeding

### Deleting Assets (ADMIN)
1. Navigate to /assets page
2. Select any assets using checkboxes
3. Click "Delete Selected" in bulk actions bar
4. Confirm deletion
5. Assets are removed from the list

**No restrictions on status**

## Database Migration

Run the following to apply schema changes:
```bash
npx prisma generate
npx prisma db push
```

## API Endpoints

### New Endpoints
- `POST /api/assets/carousel` - Create carousel asset with multiple files

### Modified Endpoints
- None (existing endpoints work with new CAROUSEL type)

## Security Considerations

1. **Permission Checks**: Delete functionality respects user roles
2. **Status Validation**: CONTENT_CREATOR can only delete PENDING assets
3. **Confirmation**: Requires user confirmation before deletion
4. **Error Handling**: Graceful error messages for permission violations
5. **Bulk Operations**: Validates each asset individually before deletion

## Testing Checklist

- [ ] CONTENT_CREATOR can upload carousel with 2+ files
- [ ] Carousel upload validates file types (images/videos only)
- [ ] Carousel appears in assets list
- [ ] CONTENT_CREATOR can select and delete PENDING assets
- [ ] CONTENT_CREATOR cannot delete APPROVED/REJECTED assets
- [ ] ADMIN can delete any assets
- [ ] Bulk selection works in grid, list, and company views
- [ ] Delete confirmation dialog appears
- [ ] UI updates after successful deletion
- [ ] Error messages display for permission violations
- [ ] Carousel items are properly linked to parent asset

## Future Enhancements

1. **Carousel Detail Page**: Full gallery view with navigation
2. **Carousel Editing**: Add/remove items from existing carousel
3. **Carousel Reordering**: Drag-and-drop to reorder items
4. **Carousel Preview**: Thumbnail preview in assets list
5. **Carousel Download**: Download all items as ZIP
6. **Carousel Sharing**: Share entire carousel or individual items
7. **Carousel Analytics**: Track views and downloads per item
