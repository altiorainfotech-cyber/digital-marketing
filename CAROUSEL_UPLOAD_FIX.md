# Carousel Asset Upload and Display Fix

## Issues Fixed

### Issue 1: Carousel Assets Showing as Multiple Cards
When a content creator uploaded carousel assets, each file was being created as a separate asset instead of being grouped as carousel items under one parent carousel asset.

**Root Cause**: The upload flow was using `/api/assets/presign` which creates individual Asset records for each file, instead of creating CarouselItem records linked to a parent carousel.

**Solution**: 
- Created new endpoint `/api/assets/carousel/presign` that generates presigned URLs WITHOUT creating Asset records
- Updated the upload page to use the new carousel-specific presign endpoint
- This ensures only ONE carousel Asset is created with multiple CarouselItem records

### Issue 2: Carousel Assets Not Displaying All Items
When viewing a carousel asset on the asset detail page, all carousel items weren't being displayed properly in the carousel slider.

**Root Cause**: The carousel items were being fetched correctly, but the display logic needed enhancement.

**Solution**:
- Enhanced the CarouselSlider component to properly display all items
- Updated the asset detail page to fetch and display carousel items
- Added proper error handling for carousel item loading

### Issue 3: Carousel Item Images Not Loading (Public URL Error)
Carousel item images were failing to load with error: `Image failed to load: https://pub-xxx.r2.dev/r2://digitalmarketing/assets/...`

**Root Cause**: The public URL was being constructed incorrectly by directly appending the storage URL (which includes `r2://bucketname/` prefix) to the R2 public URL.

**Solution**:
- Updated `/api/assets/[id]/carousel-items` to use the `convertToPublicUrl` utility function
- This properly strips the `r2://bucketname/` prefix and constructs valid public URLs
- Example: `r2://bucket/assets/id/file.jpg` → `https://pub-xxx.r2.dev/assets/id/file.jpg`

## Changes Made

### 1. New API Endpoint: `/app/api/assets/carousel/presign/route.ts`
- Generates presigned URLs for carousel item uploads
- Does NOT create Asset records (only returns upload URLs)
- Validates carousel ownership and type
- Returns storage URL for later CarouselItem creation

### 2. Updated Upload Flow: `/app/assets/upload/page.tsx`
- Changed carousel upload to use `/api/assets/carousel/presign` instead of `/api/assets/presign`
- Simplified the upload request to only include carousel ID, file name, and content type
- Maintains the same finalization flow to create CarouselItem records

### 3. Enhanced Asset Card Display: `/components/assets/AssetCard.tsx`
- Added carousel icon with indicator badge
- Updated preview logic to show carousel badge on thumbnails
- Added "Carousel" label in asset type display
- Enabled preview URL fetching for carousel assets
- Shows first carousel item as the card thumbnail

### 4. Updated Asset Listing: `/app/assets/page.tsx`
- Added "Carousel" option to asset type filter
- Carousel assets now appear as single cards in grid/list/company views

### 5. Fixed API Route Handlers
- Fixed `/app/api/assets/[id]/carousel-items/route.ts` to properly handle params with Next.js 16
- Fixed `/app/api/assets/[id]/carousel-items/complete/route.ts` authentication

## How It Works Now

### Upload Flow:
1. User selects "Carousel" asset type and uploads multiple files
2. System creates ONE carousel Asset record with placeholder storage URL
3. For each file:
   - Request presigned URL from `/api/assets/carousel/presign`
   - Upload file directly to R2 using presigned URL
   - Collect storage URL and metadata
4. Finalize carousel by creating CarouselItem records via `/api/assets/carousel/finalize`
5. Update parent carousel Asset with first item's storage URL

### Display Flow:
1. Asset listing shows carousel as a single card with:
   - Preview of first carousel item
   - "Carousel" badge indicator
   - Proper asset type label
2. Asset detail page:
   - Fetches all carousel items via `/api/assets/[id]/carousel-items`
   - Displays items in CarouselSlider component
   - Shows navigation controls and thumbnails
   - Allows viewing all items in the carousel

## Testing Recommendations

1. **Upload Test**: 
   - Login as CONTENT_CREATOR
   - Go to /assets/upload
   - Select "Carousel" asset type
   - Upload 3-5 images/videos
   - Verify only ONE asset card appears in the assets list

2. **Display Test**:
   - Click on the carousel asset card
   - Verify all uploaded items appear in the carousel slider
   - Test navigation between items
   - Verify thumbnails show correctly

3. **Filter Test**:
   - Go to /assets
   - Filter by "Carousel" asset type
   - Verify only carousel assets appear

## Files Modified

- `app/api/assets/carousel/presign/route.ts` (NEW)
- `app/assets/upload/page.tsx`
- `components/assets/AssetCard.tsx`
- `app/assets/page.tsx`
- `app/api/assets/[id]/carousel-items/route.ts`
- `app/api/assets/[id]/carousel-items/complete/route.ts`
- `app/api/assets/carousel/route.ts`

## Database Schema (No Changes Required)

The existing schema already supports this properly:
- `Asset` table with `assetType = 'CAROUSEL'`
- `CarouselItem` table with `carouselId` foreign key
- Proper cascade delete relationships

## Notes

- Carousel assets show the first item's preview as the card thumbnail
- File size shown is the total of all carousel items
- Carousel assets can be filtered, searched, and managed like other assets
- All existing permissions and visibility rules apply to carousel assets
