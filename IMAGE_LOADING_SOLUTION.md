# Image Loading Error - Complete Solution

## Problem Summary

**Error**: `Image failed to load: "https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/..."`

**Root Cause**: The asset record exists in the database, but the actual file was never uploaded to R2 storage (404 error).

## Investigation Results

✅ **Database**: Asset record exists (ID: `cml9epott0014i6oum49iu3wg`)  
❌ **R2 Storage**: File does NOT exist at the expected path  
📊 **Status**: Asset is in `PENDING_REVIEW` status  
👤 **Uploader**: meenakshi  
📅 **Upload Date**: 2026-02-05T12:02:27.953Z

## Why This Happened

The upload process creates a database record BEFORE the file is uploaded to R2. If the upload fails:
1. ✅ Database record is created
2. ❌ File upload to R2 fails
3. ⚠️ User sees the asset but file doesn't exist

**Common causes:**
- CORS not configured on R2 bucket (browser blocks upload)
- Network interruption during upload
- User closed browser before upload completed
- Presigned URL expired before upload finished

## Immediate Fix

### Option 1: Mark Asset as Rejected (Recommended)

This keeps the record for audit purposes and notifies the user:

```bash
npx tsx scripts/fix-broken-asset.ts
```

This will:
- Mark the asset as `REJECTED`
- Add rejection reason: "Upload failed - file not found in storage. Please re-upload."
- User can see the error and re-upload

### Option 2: Delete the Asset

If you prefer to remove it completely:

```typescript
// In scripts/fix-broken-asset.ts, uncomment the delete section
await prisma.asset.delete({
  where: { id: 'cml9epott0014i6oum49iu3wg' },
});
```

## Long-Term Solution

### 1. Configure CORS on R2 Bucket

**Go to Cloudflare Dashboard:**
1. Visit https://dash.cloudflare.com
2. Navigate to R2 > `digitalmarketing` bucket
3. Go to Settings tab
4. Add CORS Policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://digital-marketing-ten-alpha.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. Enable Public Access

In the same Settings tab:
1. Look for "Public Access" or "R2.dev subdomain"
2. Click "Allow Access" or "Enable"
3. Verify the public URL: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`

### 3. Improve Upload Flow

Add verification after upload completes:

**In `app/api/assets/complete/route.ts`**, add file existence check:

```typescript
// After upload completes, verify file exists
const publicUrl = getPublicUrl(storageUrl);
const response = await fetch(publicUrl, { method: 'HEAD' });

if (!response.ok) {
  // File doesn't exist, mark as failed
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      status: AssetStatus.REJECTED,
      rejectionReason: 'Upload verification failed - file not found in storage',
    },
  });
  
  return NextResponse.json(
    { error: 'Upload verification failed' },
    { status: 500 }
  );
}
```

### 4. Add Upload Status Tracking

Consider adding an upload status field to track the upload progress:

```prisma
model Asset {
  // ... existing fields
  uploadStatus String @default("PENDING") // PENDING, UPLOADING, COMPLETED, FAILED
}
```

## Testing

### 1. Test R2 Access

```bash
npx tsx scripts/test-image-url.ts
```

Expected: 200 OK (after fixing CORS and public access)

### 2. List R2 Files

```bash
npx tsx scripts/list-r2-files.ts
```

Verify your files are actually in R2.

### 3. Check Asset in Database

```bash
npx tsx scripts/check-missing-asset.ts
```

Verify database records match R2 files.

## Prevention Checklist

- [ ] CORS configured on R2 bucket
- [ ] Public access enabled on R2 bucket
- [ ] Upload verification added to complete endpoint
- [ ] Error handling for failed uploads
- [ ] User notification for upload failures
- [ ] Retry mechanism for failed uploads

## Quick Commands

```bash
# Fix the broken asset
npx tsx scripts/fix-broken-asset.ts

# Test image URL accessibility
npx tsx scripts/test-image-url.ts

# List all files in R2
npx tsx scripts/list-r2-files.ts

# Check specific asset
npx tsx scripts/check-missing-asset.ts

# Find all broken assets
npx tsx scripts/find-broken-storage-urls.ts
```

## Next Steps

1. **Immediate**: Run `npx tsx scripts/fix-broken-asset.ts` to mark the asset as rejected
2. **Configure**: Set up CORS and public access on R2 bucket
3. **Test**: Try uploading a new image and verify it works
4. **Improve**: Add upload verification to prevent this in the future
5. **Monitor**: Check for other broken assets using the find script

## Support

If you continue to have issues:
1. Check browser console for CORS errors
2. Verify R2 bucket settings in Cloudflare dashboard
3. Test direct URL access in browser
4. Check network tab for failed requests

---

**Status**: Ready to fix! Run the fix script and configure CORS. 🚀
