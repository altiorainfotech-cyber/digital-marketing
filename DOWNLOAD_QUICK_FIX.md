# Quick Fix: Download URL Generation Error

## Problem
"Failed to generate download URL" when downloading assets

## Quick Solution

### 1. Check Environment Variables
Ensure these are set in `.env`:
```env
R2_ACCOUNT_ID="9c22162cd4763f9e41394570a2e9c856"
R2_ACCESS_KEY_ID="24e8cb24f644511ccba2d9d87b236958"
R2_SECRET_ACCESS_KEY="0ffd0854d62047bf1a921a0dce1cec331af6e4a2e77eaf54015b211551767ee5"
R2_BUCKET_NAME="digitalmarketing"
R2_PUBLIC_URL="https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev"
```

### 2. Test Configuration
```bash
npx tsx scripts/test-download.ts
```

### 3. Restart Server
```bash
npm run dev
```

## What Was Fixed

✅ Made Stream/Images credentials optional (only R2 needed)  
✅ Added R2 credential validation at startup  
✅ Enhanced error messages for better debugging  
✅ Added detailed logging throughout download flow  
✅ Improved client-side error handling  

## Common Issues

| Error | Solution |
|-------|----------|
| "Missing required R2 configuration" | Check `.env` file has all R2 variables |
| "Asset has no storage URL" | Asset wasn't uploaded correctly |
| "Asset not found" | Invalid asset ID or asset deleted |
| Download URL works but 404 | File doesn't exist in R2 bucket |

## Debug Steps

1. **Check browser console** - Look for detailed error messages
2. **Check server logs** - Look for `[Download]` and `[DownloadService]` logs
3. **Verify asset** - Check asset has `storageUrl` in database
4. **Test R2 access** - Run `npx tsx scripts/test-r2-access.ts`

## How It Works

```
User clicks Download
    ↓
POST /api/assets/[id]/download
    ↓
Validate user & asset
    ↓
Generate signed R2 URL (expires in 1 hour)
    ↓
Log download to database
    ↓
Return URL to client
    ↓
Open URL in new tab
```

## Need More Help?

See `DOWNLOAD_FIX_GUIDE.md` for detailed troubleshooting.
