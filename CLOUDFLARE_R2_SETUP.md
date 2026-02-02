# Cloudflare R2 Configuration

## Current Setup

Your Cloudflare R2 storage has been configured with the following credentials:

### R2 Bucket Details
- **Bucket Name**: `digitalmarketing`
- **Account ID**: `9c22162cd4763f9e41394570a2e9c856`
- **S3 API Endpoint**: `https://9c22162cd4763f9e41394570a2e9c856.r2.cloudflarestorage.com`
- **Public Development URL**: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`

### Credentials (Configured in .env)
- **Access Key ID**: `24e8cb24f644511ccba2d9d87b236958`
- **Secret Access Key**: `0ffd0854d62047bf1a921a0dce1cec331af6e4a2e77eaf54015b211551767ee5`
- **Token Value**: `6Lqr-PQ8sdPkuRIxxud18qNOx1Dat3d_F75Xzal7`

## What's Configured

✅ **Cloudflare R2** - For document storage (PDF, DOC, DOCX, TXT, etc.)
- All document uploads will be stored in your R2 bucket
- Presigned URLs will be generated for secure uploads
- Files will be accessible via the public development URL

## What's NOT Yet Configured

⚠️ **Cloudflare Stream** - For video storage (MP4, MOV, AVI, WebM)
- You'll need to set up Cloudflare Stream if you want to upload videos
- Required env vars: `STREAM_ACCOUNT_ID`, `STREAM_API_TOKEN`

⚠️ **Cloudflare Images** - For image storage (JPG, PNG, GIF, WebP)
- You'll need to set up Cloudflare Images if you want to upload images
- Required env vars: `IMAGES_ACCOUNT_ID`, `IMAGES_API_TOKEN`, `IMAGES_ACCOUNT_HASH`

## Current Behavior

With the current configuration:
- ✅ **Document uploads** will work (stored in R2)
- ❌ **Image uploads** will fail (Cloudflare Images not configured)
- ❌ **Video uploads** will fail (Cloudflare Stream not configured)
- ✅ **Link assets** will work (no storage needed)

## Next Steps

### Option 1: Use R2 for All File Types (Recommended for Development)

If you want to use R2 for all file types (images, videos, documents), you'll need to modify the `StorageService` to route all uploads to R2 instead of using separate services.

### Option 2: Set Up Cloudflare Stream and Images

1. **For Cloudflare Stream (Videos)**:
   - Go to Cloudflare Dashboard → Stream
   - Get your Account ID and API Token
   - Add to `.env`:
     ```
     STREAM_ACCOUNT_ID="your-account-id"
     STREAM_API_TOKEN="your-api-token"
     ```

2. **For Cloudflare Images (Images)**:
   - Go to Cloudflare Dashboard → Images
   - Get your Account ID, API Token, and Account Hash
   - Add to `.env`:
     ```
     IMAGES_ACCOUNT_ID="your-account-id"
     IMAGES_API_TOKEN="your-api-token"
     IMAGES_ACCOUNT_HASH="your-account-hash"
     ```

## Testing Your Setup

After restarting your development server:

1. Try uploading a **document** (PDF, DOC, etc.) - Should work ✅
2. Try uploading an **image** - Will fail unless you configure Cloudflare Images or modify the code
3. Try uploading a **video** - Will fail unless you configure Cloudflare Stream or modify the code

## Security Note

⚠️ **IMPORTANT**: The credentials in this file are sensitive. Make sure:
- `.env` is in your `.gitignore` (it should be)
- Never commit credentials to version control
- Rotate credentials if they are exposed
- Use different credentials for production

## Restart Required

After updating `.env`, restart your development server:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```
