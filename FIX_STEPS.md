# Fix Steps for Asset Preview Issue

## Current Status ✅
- All environment variables are correctly configured
- R2 public URL is accessible
- Code improvements have been implemented

## What You Need to Do

### Step 1: Apply CORS Configuration to R2 Bucket

Run this command to allow browser requests to your R2 bucket:

```bash
npx wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

**Expected output:**
```
✅ CORS rules uploaded successfully
```

**If you don't have Wrangler installed:**
```bash
npm install -g wrangler
wrangler login
```

**Alternative (Manual via Cloudflare Dashboard):**
1. Go to https://dash.cloudflare.com/
2. Navigate to R2 → digitalmarketing bucket
3. Click Settings tab
4. Scroll to CORS Policy section
5. Add the rules from `r2-cors-config.json`

### Step 2: Verify R2 Public Access

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com/
2. Navigate to **R2** → **digitalmarketing** bucket
3. Click **Settings** tab
4. Under **Public Access**, verify you see:
   ```
   Public URL: https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
   Status: Enabled
   ```
5. If not enabled, click **Allow Access** button

### Step 3: Update Vercel Environment Variables (For Production)

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add or verify these variables exist:

   | Name | Value |
   |------|-------|
   | `R2_PUBLIC_URL` | `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev` |
   | `R2_ACCOUNT_ID` | `9c22162cd4763f9e41394570a2e9c856` |
   | `R2_ACCESS_KEY_ID` | (your access key) |
   | `R2_SECRET_ACCESS_KEY` | (your secret key) |
   | `R2_BUCKET_NAME` | `digitalmarketing` |

5. Click **Save**
6. **Redeploy** your application

### Step 4: Test Locally

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Upload a test image or video:
   - Go to http://localhost:3000/assets/upload
   - Upload a small test image (e.g., PNG or JPG)
   - Submit for review

3. View as admin:
   - Go to http://localhost:3000/admin/approvals
   - Click on the test asset
   - **The preview should now display!**

### Step 5: Test in Production (After Vercel Redeploy)

1. Go to your production URL
2. Upload a test asset
3. View in pending approvals
4. Verify preview displays correctly

## Verification Commands

```bash
# Check configuration
npm run check:r2

# Verify CORS is applied
npx wrangler r2 bucket cors get digitalmarketing

# Test a specific asset (replace {id} with actual asset ID)
curl https://your-domain.com/api/assets/{id}/debug
```

## Troubleshooting

### If preview still doesn't work:

1. **Check browser console** for specific errors:
   - Press F12 → Console tab
   - Look for CORS or 404 errors

2. **Use debug endpoint**:
   - Go to asset detail page
   - In browser console, run:
     ```javascript
     fetch('/api/assets/{asset-id}/debug')
       .then(r => r.json())
       .then(console.log)
     ```

3. **Verify CORS is applied**:
   ```bash
   npx wrangler r2 bucket cors get digitalmarketing
   ```
   Should show the CORS rules from `r2-cors-config.json`

4. **Check R2 bucket has files**:
   ```bash
   npx wrangler r2 object list digitalmarketing
   ```

### Common Issues:

**Issue**: "CORS policy blocked"
- **Fix**: Run the CORS command in Step 1

**Issue**: "404 Not Found" for images
- **Fix**: Verify public access is enabled in Step 2

**Issue**: "Public URL is empty"
- **Fix**: Verify R2_PUBLIC_URL is set in Vercel (Step 3)

**Issue**: Preview shows "Loading..." forever
- **Fix**: Check browser console for errors, use debug endpoint

## What Was Changed

### Code Changes:
1. **Enhanced error handling** in asset detail page
2. **Added debug endpoint** at `/api/assets/[id]/debug`
3. **Created configuration check script** (`npm run check:r2`)

### New Files:
- `app/api/assets/[id]/debug/route.ts` - Debug endpoint
- `scripts/check-r2-config.ts` - Configuration validator
- `ASSET_PREVIEW_FIX_GUIDE.md` - Detailed guide
- `QUICK_FIX_ASSET_PREVIEW.md` - Quick reference
- `ASSET_PREVIEW_SOLUTION_SUMMARY.md` - Technical summary
- `FIX_STEPS.md` - This file

## Success Checklist

- [ ] CORS configuration applied to R2 bucket
- [ ] R2 public access is enabled
- [ ] Vercel environment variables are set
- [ ] Application is redeployed (for production)
- [ ] Dev server is restarted (for local)
- [ ] Test asset uploaded successfully
- [ ] Image preview displays in asset detail page
- [ ] Video preview displays in asset detail page
- [ ] No CORS errors in browser console
- [ ] No 404 errors when loading media

## Need Help?

- See detailed guide: `ASSET_PREVIEW_FIX_GUIDE.md`
- See quick fix: `QUICK_FIX_ASSET_PREVIEW.md`
- Check configuration: `npm run check:r2`
- Debug specific asset: `/api/assets/{id}/debug`
