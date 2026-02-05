# Storage URL Fix - Complete Solution

## Problem
New asset uploads were failing to load with 404 errors because the storage URL in the database didn't match the actual R2 file location.

## Root Cause Analysis

### Issue 1: Wrong Path Pattern
- **UploadHandler** was generating: `r2://bucket/images/[id]` or `r2://bucket/videos/[id]`
- **StorageService** was uploading to: `assets/[id]/[timestamp]-[filename]`
- **Result**: Mismatch between database and R2

### Issue 2: Timing Mismatch (Critical!)
Even after fixing the path pattern, there was a timing issue:
1. **Presign endpoint** generated timestamp T1 and created storage URL
2. **StorageService** generated timestamp T2 when creating presigned URL
3. **Result**: File uploaded to path with T2, but database had path with T1

## Complete Solution

### 1. Fixed UploadHandler.ts
- Removed separate paths for images/videos/documents
- Now generates R2 key with timestamp ONCE
- Passes the same key to StorageService to ensure consistency

```typescript
// Generate the R2 key first
const timestamp = Date.now();
const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
const r2Key = `assets/${assetId}/${timestamp}-${sanitizedFileName}`;

// Pass this key to StorageService
const uploadUrl = await this.storageService.generatePresignedUploadUrl(
  assetId, assetType, fileName, contentType, expiresIn,
  r2Key // Custom key ensures consistency
);

// Use the same key for storage URL
const storageUrl = `r2://${bucket}/${r2Key}`;
```

### 2. Updated StorageService.ts
- Added optional `customKey` parameter to `generatePresignedUploadUrl()`
- Uses custom key if provided, otherwise generates its own
- Ensures presigned URL uses the exact same path as the storage URL

```typescript
async generatePresignedUploadUrl(
  assetId: string,
  assetType: AssetType,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600,
  customKey?: string // NEW: Optional custom key
): Promise<string>
```

### 3. Simplified presign endpoint
- Now uses the storageUrl from UploadHandler response directly
- No need to generate it again
- Eliminates timing mismatches

```typescript
const uploadResponse = await uploadHandler.generatePresignedUploadUrl({...});

// Use the storageUrl from the response
await prisma.asset.update({
  where: { id: asset.id },
  data: { storageUrl: uploadResponse.storageUrl },
});
```

## Files Modified

1. ✅ `lib/services/UploadHandler.ts`
   - Updated `generatePresignedUploadUrl()` to generate R2 key once
   - Passes custom key to StorageService
   - Returns consistent storage URL

2. ✅ `lib/services/StorageService.ts`
   - Added `customKey` parameter to `generatePresignedUploadUrl()`
   - Added `customKey` parameter to `generateR2UploadUrl()`
   - Uses custom key when provided

3. ✅ `app/api/assets/presign/route.ts`
   - Simplified to use storageUrl from UploadHandler
   - Removed duplicate timestamp generation

## How It Works Now

```
1. User uploads file "my-video.mp4"
   ↓
2. Presign endpoint calls UploadHandler.generatePresignedUploadUrl()
   ↓
3. UploadHandler generates:
   - timestamp: 1770292912415
   - r2Key: "assets/abc123/1770292912415-my-video.mp4"
   ↓
4. UploadHandler passes r2Key to StorageService
   ↓
5. StorageService generates presigned URL with SAME r2Key
   ↓
6. UploadHandler returns:
   - uploadUrl: "https://r2.../assets/abc123/1770292912415-my-video.mp4?signature=..."
   - storageUrl: "r2://bucket/assets/abc123/1770292912415-my-video.mp4"
   ↓
7. Presign endpoint saves storageUrl to database
   ↓
8. Client uploads file using presigned URL
   ↓
9. File is stored at: assets/abc123/1770292912415-my-video.mp4
   ↓
10. Database has: r2://bucket/assets/abc123/1770292912415-my-video.mp4
    ✅ PERFECT MATCH!
```

## Testing

Run the test script to verify the logic:
```bash
npx tsx scripts/test-storage-url-pattern.ts
```

## ⚠️ CRITICAL: Restart Required

**You MUST restart your Next.js development server for these changes to take effect!**

```bash
# Stop the server (Ctrl+C)

# Clear cache (recommended)
rm -rf .next

# Restart
npm run dev
# or
yarn dev
```

## Verification Steps

After restarting:

1. **Upload a new asset** (image or video)
2. **Check the browser console** - should be no 404 errors
3. **View the asset detail page** - media should load correctly
4. **Run diagnostic script** (optional):
   ```bash
   # Update the asset ID in the script first
   npx tsx scripts/check-image-asset.ts
   # or
   npx tsx scripts/check-video-asset.ts
   ```

## Expected Results

New uploads will have storage URLs like:
```
r2://digitalmarketing/assets/cml9xyz123/1770292912415-My_Image.png
```

And files will exist in R2 at:
```
assets/cml9xyz123/1770292912415-My_Image.png
```

Public URLs will be:
```
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/cml9xyz123/1770292912415-My_Image.png
```

✅ All three match perfectly!

## Existing Assets

Already fixed 6 existing assets that had files in R2:
- Video_Recreation_Without_Text.mp4
- BarnEggs Miniature Feed.png
- White SUV.png
- 1770118934024-852f1be1-0ad3-4cc8-a5e0-6e32e23aa181_hd.mp4
- grok-video-ccbd79be-0a22-4cf6-8050-142f9066d1a6 (2).mp4
- Video-578.mp4

## If Issues Persist

If you still see 404 errors after restarting:

1. **Verify the server restarted** - Check terminal for "compiled successfully"
2. **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check the asset in database**:
   ```bash
   npx tsx scripts/check-image-asset.ts
   # Update asset ID in script first
   ```
4. **Verify R2 file exists**:
   ```bash
   npx tsx scripts/list-r2-files.ts
   ```
5. **Provide details**:
   - Asset ID
   - Storage URL from database
   - Error message from browser console
