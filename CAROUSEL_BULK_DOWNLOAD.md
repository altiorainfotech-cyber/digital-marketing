# Carousel Bulk Download Feature

## Overview
When users click the download button on a CAROUSEL type asset, all items in the carousel are automatically downloaded as a single ZIP file.

## Implementation Details

### Backend
- **API Endpoint**: `POST /api/assets/[id]/download-carousel`
- **Location**: `app/api/assets/[id]/download-carousel/route.ts`
- **Functionality**:
  - Validates the asset is a CAROUSEL type
  - Fetches all carousel items ordered by their sequence
  - Generates signed URLs for each item
  - Creates a ZIP file containing all items
  - Logs the download activity with audit trail
  - Returns the ZIP file with proper headers

### Frontend
- **Download Helper**: `lib/utils/downloadHelper.ts`
  - Added `initiateCarouselDownload()` function
  - Handles ZIP file download and cleanup
  
- **Asset Detail Page**: `app/assets/[id]/page.tsx`
  - Updated `performDownload()` to detect CAROUSEL assets
  - Routes carousel downloads to the bulk download endpoint
  - Maintains platform tracking for SEO_SPECIALIST users

- **Asset Card Component**: `components/assets/AssetCard.tsx`
  - Updated both grid and list view download handlers
  - Automatically detects CAROUSEL type and uses bulk download
  - Works from asset library views (grid/list)

### User Experience
1. User clicks "Download" button on a carousel asset (from detail page or asset card)
2. SEO_SPECIALIST users select platforms (if applicable)
3. System automatically downloads all carousel items as a ZIP
4. ZIP file is named: `{asset_title}_carousel.zip`
5. Files inside ZIP are numbered: `001_image.jpg`, `002_video.mp4`, etc.

### Where It Works
- Asset detail page (`/assets/[id]`)
- Asset library grid view
- Asset library list view
- Fullscreen preview modal

### File Naming Convention
- ZIP filename: `{sanitized_asset_title}_carousel.zip`
- Individual files: `{3-digit-number}_{item_type}.{extension}`
  - Example: `001_image.jpg`, `002_video.mp4`, `003_image.png`

### Dependencies
- **jszip**: Used for creating ZIP files on the server
- **@types/jszip**: TypeScript definitions

### Audit & Tracking
- Downloads are logged in the `AssetDownload` table
- Audit logs include:
  - User ID and role
  - Asset ID and title
  - Platform selection (if applicable)
  - Number of items in carousel
  - Timestamp and IP address

## Testing
To test the feature:
1. Navigate to a CAROUSEL type asset
2. Click the "Download" button
3. For SEO_SPECIALIST users: select platforms first
4. Verify a ZIP file downloads containing all carousel items
5. Check that files are properly named and ordered
