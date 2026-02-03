# Asset Upload and Viewing Flow

## The Problem (Before Fix)

```
┌─────────────┐
│   Upload    │
│   Image     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Stored in R2 with URL:         │
│  r2://digitalmarketing/         │
│  assets/abc123/image.jpg        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Frontend tries to display:     │
│  <img src="r2://..." />         │
│  ❌ FAILS - Browser can't       │
│     understand r2:// protocol   │
└─────────────────────────────────┘
```

## The Solution (After Fix)

```
┌─────────────┐
│   Upload    │
│   Image     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Stored in R2 with URL:         │
│  r2://digitalmarketing/         │
│  assets/abc123/image.jpg        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Backend converts to:           │
│  https://pub-712c...r2.dev/     │
│  assets/abc123/image.jpg        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Frontend displays:             │
│  <img src="https://..." />      │
│  ✅ SUCCESS - Browser loads     │
│     image from public URL       │
└─────────────────────────────────┘
```

## Complete Flow with R2 Public Access

```
┌──────────────────────────────────────────────────────────┐
│                    UPLOAD PROCESS                         │
└──────────────────────────────────────────────────────────┘

1. User clicks "Upload"
   │
   ▼
2. Frontend calls /api/assets/presign
   │
   ▼
3. Backend creates asset record with status=DRAFT
   │
   ▼
4. Backend generates presigned URL for R2
   │
   ▼
5. Frontend uploads file directly to R2
   │
   ▼
6. File stored at: r2://digitalmarketing/assets/{id}/{file}
   │
   ▼
7. Frontend calls /api/assets/complete
   │
   ▼
8. Backend updates asset status (DRAFT or PENDING_REVIEW)

┌──────────────────────────────────────────────────────────┐
│                   APPROVAL PROCESS                        │
└──────────────────────────────────────────────────────────┘

9. Admin views asset in /admin/approvals
   │
   ▼
10. Admin clicks "Approve"
    │
    ▼
11. Backend updates status=APPROVED
    │
    ▼
12. Asset now visible to users

┌──────────────────────────────────────────────────────────┐
│                    VIEWING PROCESS                        │
└──────────────────────────────────────────────────────────┘

13. User opens asset detail page
    │
    ▼
14. Frontend calls /api/assets/{id}
    │
    ▼
15. Backend returns asset with storageUrl: "r2://..."
    │
    ▼
16. Frontend calls /api/assets/{id}/public-url
    │
    ▼
17. Backend converts r2:// → https://pub-...r2.dev/
    │
    ▼
18. Frontend displays image/video using public URL
    │
    ▼
19. Browser fetches from R2 public URL
    │
    ▼
20. ✅ Image/Video displays successfully!

┌──────────────────────────────────────────────────────────┐
│                  R2 BUCKET SETTINGS                       │
└──────────────────────────────────────────────────────────┘

Required Settings:
├─ Public Access: ENABLED ✅
│  └─ Allows browser to fetch files via public URL
│
├─ CORS Policy: CONFIGURED ✅
│  └─ Allows your domain to access the files
│
└─ Public URL: https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
   └─ Used to construct public URLs
```

## URL Conversion Examples

### Image Asset
```
Storage URL (internal):
r2://digitalmarketing/assets/abc-123/photo.jpg

Public URL (for viewing):
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/abc-123/photo.jpg
```

### Video Asset
```
Storage URL (internal):
r2://digitalmarketing/assets/xyz-789/video.mp4

Public URL (for viewing):
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/xyz-789/video.mp4
```

### Document Asset
```
Storage URL (internal):
r2://digitalmarketing/assets/def-456/document.pdf

Download URL (signed, expires in 1 hour):
https://pub-712c...r2.dev/assets/def-456/document.pdf?X-Amz-Signature=...
```

## Security Model

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC ACCESS                         │
│  ✅ Anyone can VIEW images/videos via public URL        │
│  ✅ Good for: Marketing assets, social media content    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  AUTHENTICATED ACCESS                    │
│  🔒 Must be logged in to:                               │
│     - Upload assets                                      │
│     - Approve/reject assets                              │
│     - Delete assets                                      │
│     - See asset metadata                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    SIGNED DOWNLOADS                      │
│  🔐 Download endpoint generates signed URLs that:       │
│     - Expire after 1 hour                                │
│     - Log who downloaded what                            │
│     - Track platform intent                              │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting Decision Tree

```
Asset not displaying?
│
├─ Is R2 Public Access enabled?
│  ├─ NO → Enable it in R2 settings
│  └─ YES → Continue
│
├─ Is CORS configured?
│  ├─ NO → Apply CORS config
│  └─ YES → Continue
│
├─ Is R2_PUBLIC_URL set in Vercel?
│  ├─ NO → Add environment variable
│  └─ YES → Continue
│
├─ Check browser console for errors
│  ├─ CORS error → CORS not applied correctly
│  ├─ 403 error → Public access not enabled
│  ├─ 404 error → File doesn't exist in R2
│  └─ No errors → Check network tab
│
└─ Test direct URL in browser
   ├─ Works → Frontend issue
   └─ Fails → R2 configuration issue
```
