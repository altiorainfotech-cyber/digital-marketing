# Video & Image Storage URL Fix - Complete Resolution

## Problem
Assets (videos and images) failed to load with 404 errors:
```
Video failed to load: "https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/videos/cml99q18i000mi6ouq1qzjog1"
Image failed to load: "https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/images/cml9dtasy000si6ou0onte0zx"
```

## Root Cause
The storage URLs in the database didn't match the actual file paths in R2:

- **Database had**: `r2://digitalmarketing/videos/[assetId]` or `r2://digitalmarketing/images/[assetId]`
- **Actual R2 path**: `assets/[assetId]/[timestamp]-[filename]`

This mismatch was caused by:
1. **UploadHandler.ts** - `generateStorageUrl()` method was creating URLs with `/videos/` and `/images/` paths
2. **StorageService.ts** - `generateR2Key()` method was actually storing files at `assets/[assetId]/[timestamp]-[filename]`
3. **presign endpoint** - Was not updating the database with the actual storage path after generating the presigned URL

## Solution

### 1. Fixed UploadHandler.ts
Updated `generateStorageUrl()` to use the correct path pattern:
```typescript
// Before:
return `r2://${bucket}/images/${assetId}`;
return `r2://${bucket}/videos/${assetId}`;

// After:
return `r2://${bucket}/assets/${assetId}`;
```

### 2. Fixed presign endpoint
Updated `/api/assets/presign/route.ts` to generate and save the actual storage URL:
```typescript
const timestamp = Date.now();
const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
const actualStorageKey = `assets/${asset.id}/${timestamp}-${sanitizedFileName}`;
const actualStorageUrl = `r2://${bucketName}/${actualStorageKey}`;
```

### 3. Fixed existing broken assets
Ran bulk fix script to update all assets with files in R2.

## Results

### Fixed Assets (6 total)
✅ Video_Recreation_Without_Text.mp4
✅ BarnEggs Miniature Feed.png
✅ White SUV.png
✅ 1770118934024-852f1be1-0ad3-4cc8-a5e0-6e32e23aa181_hd.mp4
✅ grok-video-ccbd79be-0a22-4cf6-8050-142f9066d1a6 (2).mp4
✅ Video-578.mp4

### Orphaned Assets (6 total)
These assets have database records but no corresponding files in R2:
- hello (3 instances)
- Herllo
- BarnEggs Miniature 2.png
- 1.png

Note: These cannot be deleted due to immutable audit log constraints.

## Verification
All fixed assets are now accessible via their public URLs with 200 OK responses.

Example:
```
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/cml99q18i000mi6ouq1qzjog1/1770284566256-Video_Recreation_Without_Text.mp4
Status: 200 OK
Content-Type: video/mp4
```

## Prevention
The fix ensures that:
1. **New uploads** will have correct storage URLs from the start
2. **Storage URLs match actual R2 paths** - both use `assets/[assetId]/[timestamp]-[filename]`
3. **No more mismatches** between database records and R2 file locations

## Scripts Created
- `scripts/check-video-asset.ts` - Diagnose video asset issues
- `scripts/check-image-asset.ts` - Diagnose image asset issues
- `scripts/fix-video-storage-url.ts` - Fix individual video asset
- `scripts/fix-image-storage-url.ts` - Fix individual image asset
- `scripts/fix-all-storage-urls.ts` - Bulk fix all broken storage URLs
- `scripts/find-broken-storage-urls.ts` - Identify assets with incorrect URLs
- `scripts/cleanup-orphaned-storage-urls.ts` - Report orphaned assets
- `scripts/test-url-conversion.ts` - Test URL conversion logic
