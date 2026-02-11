# Carousel Upload Fix

## Problem
Carousel assets were being created but no carousel items were being saved to the database, resulting in "No carousel items found" message.

## Root Cause
The original implementation was generating presigned URLs in the carousel creation endpoint but not actually creating CarouselItem records after files were uploaded.

## Solution

### 3-Step Upload Process

#### Step 1: Create Carousel Asset
**Endpoint:** `POST /api/assets/carousel`

Creates the parent carousel asset with metadata:
- Title, description, tags
- Upload type (SEO/DOC)
- Company (for SEO uploads)
- Status (DRAFT or PENDING_REVIEW)
- Placeholder storage URL

**Returns:** `{ carouselId: string }`

#### Step 2: Upload Individual Files
**Endpoint:** `POST /api/assets/presign` (for each file)

For each file in the carousel:
1. Get presigned URL from `/api/assets/presign`
2. Upload file to presigned URL (R2/Stream/Images)
3. Collect storage URL, file size, and mime type

**Client-side logic:**
- Shows progress for each file
- Handles errors per file
- Collects upload metadata

#### Step 3: Finalize Carousel
**Endpoint:** `POST /api/assets/carousel/finalize`

Creates CarouselItem records for all uploaded files:
- Links items to parent carousel
- Stores storage URLs
- Sets file metadata (size, mime type, type)
- Orders items sequentially
- Updates parent carousel storage URL to first item

**Request:**
```json
{
  "carouselId": "string",
  "items": [
    {
      "storageUrl": "string",
      "fileSize": number,
      "mimeType": "string"
    }
  ]
}
```

**Returns:** `{ success: true, itemCount: number }`

## Implementation Details

### Upload Page (app/assets/upload/page.tsx)

```javascript
// 1. Create carousel
const { carouselId } = await fetch('/api/assets/carousel', { ... });

// 2. Upload each file
const uploadedItems = [];
for (let i = 0; i < files.length; i++) {
  const { uploadUrl, storageUrl } = await fetch('/api/assets/presign', { ... });
  await uploadToPresignedUrl(uploadUrl, file);
  uploadedItems.push({ storageUrl, fileSize, mimeType });
}

// 3. Finalize carousel
await fetch('/api/assets/carousel/finalize', {
  body: JSON.stringify({ carouselId, items: uploadedItems })
});
```

### Carousel Creation API (app/api/assets/carousel/route.ts)

Simplified to only create the parent asset:
- Validates input (title, upload type, company, file count)
- Creates Asset with type CAROUSEL
- Returns carousel ID
- No longer generates presigned URLs (handled per-file)

### Finalize API (app/api/assets/carousel/finalize/route.ts)

New endpoint that:
- Validates carousel exists and belongs to user
- Creates CarouselItem records for each uploaded file
- Sets item order (0, 1, 2, ...)
- Determines item type (IMAGE or VIDEO) from mime type
- Updates parent carousel with first item's storage URL
- Calculates total file size

## Database Schema

### CarouselItem Model
```prisma
model CarouselItem {
  id          String    @id @default(cuid())
  carouselId  String
  storageUrl  String
  fileSize    Int?
  mimeType    String?
  itemType    AssetType  // IMAGE or VIDEO
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  Carousel    Asset     @relation(fields: [carouselId], references: [id], onDelete: Cascade)

  @@index([carouselId])
}
```

## Benefits

1. **Reliable**: Each step is independent and can be retried
2. **Progress Tracking**: Shows upload progress for each file
3. **Error Handling**: Handles per-file errors gracefully
4. **Flexible**: Uses existing presign endpoint for file uploads
5. **Consistent**: Same upload flow as individual assets
6. **Atomic**: Finalize step ensures all items are saved together

## Testing

To test the carousel upload:

1. Login as CONTENT_CREATOR
2. Navigate to /assets/upload
3. Select "Carousel (Multiple Images/Videos)" as asset type
4. Upload 2 or more images/videos
5. Click "Upload" or "Upload & Submit for Review"
6. Verify:
   - Progress shows for each file
   - All files upload successfully
   - Redirects to carousel detail page
   - Carousel items are visible
   - No "No carousel items found" message

## Error Scenarios

### Scenario 1: File Upload Fails
- Error shown for specific file
- Other files continue uploading
- User can retry failed file

### Scenario 2: Finalize Fails
- Carousel asset exists but no items
- User sees "No carousel items found"
- Can re-upload or delete carousel

### Scenario 3: Permission Denied
- 403 error if trying to finalize someone else's carousel
- Clear error message shown

## Future Enhancements

1. **Retry Logic**: Auto-retry failed uploads
2. **Resume Upload**: Continue from last successful file
3. **Batch Finalize**: Finalize in batches for large carousels
4. **Thumbnail Generation**: Generate thumbnails during finalize
5. **Validation**: Validate files before upload (size, type, dimensions)
