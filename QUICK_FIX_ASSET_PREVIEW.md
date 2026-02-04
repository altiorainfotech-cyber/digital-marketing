# Quick Fix: Asset Preview Not Working

## Problem
Admin cannot see images/videos before approving them.

## Quick Solution (5 minutes)

### 1. Check R2 Configuration
```bash
npm run check:r2
```

This will verify all required environment variables are set.

### 2. Enable R2 Public Access

**In Cloudflare Dashboard:**
1. Go to **R2** → **digitalmarketing** bucket
2. Click **Settings** tab
3. Under **Public Access**, ensure it shows your public URL:
   ```
   https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
   ```
4. If not enabled, click **Allow Access** or **Connect Domain**

### 3. Apply CORS Configuration
```bash
npx wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

### 4. Verify Environment Variable

**Local Development:**
Check `.env` file has:
```env
R2_PUBLIC_URL="https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev"
```

**Vercel Production:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add or verify:
   - Name: `R2_PUBLIC_URL`
   - Value: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`
3. Click **Save**
4. Redeploy your application

### 5. Test
1. Restart your local dev server: `npm run dev`
2. Upload a test image
3. Go to Admin → Pending Approvals
4. Click on the asset
5. Preview should now work!

## Debug Endpoint

To diagnose issues with a specific asset:
```
GET /api/assets/{assetId}/debug
```

Example:
```bash
curl https://your-domain.com/api/assets/abc123/debug
```

This returns:
- Storage URL format
- Generated public URL
- Environment configuration
- Specific recommendations

## Common Errors & Fixes

### Error: "Public URL is empty"
**Fix:** Set `R2_PUBLIC_URL` environment variable

### Error: "CORS policy blocked"
**Fix:** Apply CORS configuration with wrangler command above

### Error: "404 Not Found"
**Fix:** Enable public access on R2 bucket

### Error: "Failed to load image/video"
**Fix:** Check that the file was uploaded correctly and exists in R2

## Verification Checklist

- [ ] `R2_PUBLIC_URL` is set in `.env`
- [ ] `R2_PUBLIC_URL` is set in Vercel environment variables
- [ ] R2 bucket has public access enabled
- [ ] CORS configuration is applied
- [ ] Application is redeployed (for Vercel)
- [ ] Dev server is restarted (for local)
- [ ] Can upload new assets
- [ ] Can see image previews
- [ ] Can see video previews
- [ ] No console errors

## Still Not Working?

1. Check browser console for specific errors
2. Use the debug endpoint: `/api/assets/{id}/debug`
3. Verify R2 bucket settings in Cloudflare Dashboard
4. Try uploading a new test asset
5. Check that the asset's `storageUrl` starts with `r2://`

## Need More Help?

See detailed guide: `ASSET_PREVIEW_FIX_GUIDE.md`
