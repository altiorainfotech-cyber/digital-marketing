# Asset Preview Flow Diagram

## Current Flow (How It Works)

```
┌─────────────────────────────────────────────────────────────────┐
│                         ASSET UPLOAD                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User uploads    │
                    │  image/video     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Stored in R2    │
                    │  with URL:       │
                    │  r2://bucket/key │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Asset record    │
                    │  saved in DB     │
                    │  status: PENDING │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN VIEWS ASSET                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Admin clicks    │
                    │  on asset in     │
                    │  Pending list    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Frontend loads  │
                    │  /assets/[id]    │
                    │  page            │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Fetches asset   │
                    │  data from       │
                    │  /api/assets/[id]│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Gets storageUrl │
                    │  r2://bucket/key │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Fetches public  │
                    │  URL from        │
                    │  /api/assets/    │
                    │  [id]/public-url │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  getPublicUrl()  │
                    │  converts:       │
                    │  r2://bucket/key │
                    │  to:             │
                    │  https://pub-... │
                    │  .r2.dev/key     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Browser loads   │
                    │  image/video     │
                    │  from public URL │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ✅ Preview      │
                    │  displays!       │
                    └──────────────────┘
```

## URL Conversion Example

```
Storage URL (in database):
r2://digitalmarketing/assets/abc123/1234567890-image.jpg

                    ↓ getPublicUrl() ↓

Public URL (for browser):
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/abc123/1234567890-image.jpg
```

## What Can Go Wrong

### ❌ Problem 1: R2_PUBLIC_URL Not Set

```
Storage URL: r2://digitalmarketing/assets/abc123/image.jpg
                    ↓
getPublicUrl() → R2_PUBLIC_URL is undefined
                    ↓
Result: "" (empty string)
                    ↓
Browser tries to load: <img src="" />
                    ↓
❌ Preview fails: "Failed to load image"
```

**Fix**: Set `R2_PUBLIC_URL` environment variable

### ❌ Problem 2: CORS Not Configured

```
Storage URL: r2://digitalmarketing/assets/abc123/image.jpg
                    ↓
getPublicUrl() → https://pub-...r2.dev/assets/abc123/image.jpg
                    ↓
Browser requests image from R2
                    ↓
R2 checks CORS policy
                    ↓
❌ CORS policy blocks request
                    ↓
Browser console: "CORS policy blocked"
```

**Fix**: Apply CORS configuration with wrangler

### ❌ Problem 3: Public Access Not Enabled

```
Storage URL: r2://digitalmarketing/assets/abc123/image.jpg
                    ↓
getPublicUrl() → https://pub-...r2.dev/assets/abc123/image.jpg
                    ↓
Browser requests image from R2
                    ↓
R2 checks if public access is enabled
                    ↓
❌ Public access disabled
                    ↓
Browser console: "404 Not Found"
```

**Fix**: Enable public access in Cloudflare Dashboard

## Correct Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                         │
├─────────────────────────────────────────────────────────────────┤
│  ✅ R2_PUBLIC_URL = https://pub-...r2.dev                       │
│  ✅ R2_BUCKET_NAME = digitalmarketing                           │
│  ✅ R2_ACCOUNT_ID = 9c22...                                     │
│  ✅ R2_ACCESS_KEY_ID = ***                                      │
│  ✅ R2_SECRET_ACCESS_KEY = ***                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE R2 BUCKET                          │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Public Access: Enabled                                      │
│  ✅ Public URL: https://pub-...r2.dev                           │
│  ✅ CORS Policy: Configured                                     │
│     - AllowedOrigins: [localhost, vercel.app]                   │
│     - AllowedMethods: [GET, PUT, POST, DELETE, HEAD]            │
│     - AllowedHeaders: [*]                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION CODE                            │
├─────────────────────────────────────────────────────────────────┤
│  ✅ getPublicUrl() converts r2:// to https://                   │
│  ✅ Asset detail page fetches public URL                        │
│  ✅ Browser loads image/video from public URL                   │
│  ✅ Error handling shows helpful messages                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ✅ WORKING!     │
                    │  Admin can see   │
                    │  previews        │
                    └──────────────────┘
```

## Asset Types Handling

```
┌──────────────┬─────────────────┬──────────────────────────────┐
│ Asset Type   │ Storage         │ Preview Method               │
├──────────────┼─────────────────┼──────────────────────────────┤
│ IMAGE        │ R2              │ <img src={publicUrl} />      │
│              │ r2://bucket/key │ Public URL required          │
├──────────────┼─────────────────┼──────────────────────────────┤
│ VIDEO        │ R2              │ <video src={publicUrl} />    │
│              │ r2://bucket/key │ Public URL required          │
├──────────────┼─────────────────┼──────────────────────────────┤
│ DOCUMENT     │ R2              │ Download button only         │
│              │ r2://bucket/key │ Uses signed URL for download │
├──────────────┼─────────────────┼──────────────────────────────┤
│ LINK         │ No storage      │ Direct link display          │
│              │ link://id       │ No URL conversion needed     │
└──────────────┴─────────────────┴──────────────────────────────┘
```

## Debug Flow

```
Admin sees broken preview
        │
        ▼
Open browser console (F12)
        │
        ▼
Check for errors:
  - CORS error? → Apply CORS config
  - 404 error? → Enable public access
  - Empty URL? → Set R2_PUBLIC_URL
        │
        ▼
Use debug endpoint:
GET /api/assets/{id}/debug
        │
        ▼
Check response:
  - storageUrl format correct?
  - publicUrl generated?
  - R2_PUBLIC_URL set?
  - Recommendations?
        │
        ▼
Apply recommended fixes
        │
        ▼
Test again
        │
        ▼
✅ Working!
```

## Quick Reference

### Check Configuration
```bash
npm run check:r2
```

### Apply CORS
```bash
npx wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

### Debug Asset
```bash
curl https://your-domain.com/api/assets/{id}/debug
```

### Test Public URL
```bash
curl -I https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
```
