# UploadHandler Service

## Overview

The `UploadHandler` class manages file uploads to Cloudflare services and generates presigned URLs for direct client-side uploads. It provides a high-level interface for handling different asset types (images, videos, documents, links) and routes them to the appropriate Cloudflare service.

## Requirements

- **3.7**: Store SEO assets in Cloudflare R2, Stream, or Images based on asset type
- **4.6**: Store Doc assets securely in Cloudflare R2
- **10.1**: Images to Cloudflare Images
- **10.2**: Videos to Cloudflare Stream
- **10.3**: Documents to Cloudflare R2
- **10.4**: Generate presigned URLs for direct upload
- **10.5**: Generate signed URLs with expiration
- **10.6**: Record storage location and file metadata

## Architecture

The `UploadHandler` wraps the `StorageService` and provides a simplified interface for upload operations. It handles:

1. **Presigned URL Generation**: Creates secure, time-limited URLs for direct client uploads
2. **Storage Routing**: Routes uploads to the correct Cloudflare service based on asset type
3. **Upload Completion**: Finalizes uploads and returns storage URLs
4. **Configuration Validation**: Ensures all required Cloudflare credentials are present

## Storage Routing

| Asset Type | Storage Service | URL Format |
|------------|----------------|------------|
| IMAGE | Cloudflare Images | `images://{account-id}/{asset-id}` |
| VIDEO | Cloudflare Stream | `stream://{account-id}/{asset-id}` |
| DOCUMENT | Cloudflare R2 | `r2://{bucket-name}/documents/{asset-id}` |
| LINK | None (metadata only) | `link://{asset-id}` |

## Usage

### Basic Upload Flow

```typescript
import { UploadHandler } from '@/lib/services/UploadHandler';
import { AssetType, UploadType } from '@/types';

// Initialize with Cloudflare configuration
const uploadHandler = new UploadHandler({
  r2AccountId: process.env.R2_ACCOUNT_ID!,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID!,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  r2BucketName: process.env.R2_BUCKET_NAME!,
  streamAccountId: process.env.STREAM_ACCOUNT_ID!,
  streamApiToken: process.env.STREAM_API_TOKEN!,
  imagesAccountId: process.env.IMAGES_ACCOUNT_ID!,
  imagesApiToken: process.env.IMAGES_API_TOKEN!,
});

// Step 1: Generate presigned URL for client-side upload
const presignedResponse = await uploadHandler.generatePresignedUploadUrl({
  assetId: 'asset-123',
  assetType: AssetType.IMAGE,
  uploadType: UploadType.SEO,
  fileName: 'marketing-banner.jpg',
  contentType: 'image/jpeg',
  expiresIn: 3600, // 1 hour
});

// presignedResponse contains:
// {
//   assetId: 'asset-123',
//   uploadUrl: 'https://upload.imagedelivery.net/...',
//   storageUrl: 'images://account-id/asset-123'
// }

// Step 2: Client uploads file to presignedResponse.uploadUrl
// (This happens in the browser using fetch or XMLHttpRequest)

// Step 3: Complete the upload to get final URLs
const completeResponse = await uploadHandler.completeUpload({
  assetId: 'asset-123',
  assetType: AssetType.IMAGE,
  storageUrl: presignedResponse.storageUrl,
  fileSize: 1024000, // 1MB
  mimeType: 'image/jpeg',
});

// completeResponse contains:
// {
//   assetId: 'asset-123',
//   storageUrl: 'images://account-id/asset-123',
//   publicUrl: 'https://imagedelivery.net/account-id/asset-123/public',
//   thumbnailUrl: 'https://imagedelivery.net/account-id/asset-123/thumbnail'
// }
```

### Image Upload Example

```typescript
// Generate presigned URL for image upload
const imageUpload = await uploadHandler.generatePresignedUploadUrl({
  assetId: 'img-456',
  assetType: AssetType.IMAGE,
  uploadType: UploadType.SEO,
  fileName: 'product-photo.png',
  contentType: 'image/png',
});

// Client uploads to imageUpload.uploadUrl
// Then complete the upload
const result = await uploadHandler.completeUpload({
  assetId: 'img-456',
  assetType: AssetType.IMAGE,
  storageUrl: imageUpload.storageUrl,
  fileSize: 2048000,
  mimeType: 'image/png',
});

console.log('Image URL:', result.publicUrl);
console.log('Thumbnail URL:', result.thumbnailUrl);
```

### Video Upload Example

```typescript
// Generate presigned URL for video upload
const videoUpload = await uploadHandler.generatePresignedUploadUrl({
  assetId: 'vid-789',
  assetType: AssetType.VIDEO,
  uploadType: UploadType.SEO,
  fileName: 'product-demo.mp4',
  contentType: 'video/mp4',
  expiresIn: 7200, // 2 hours for large files
});

// Client uploads to videoUpload.uploadUrl
// Then complete the upload
const result = await uploadHandler.completeUpload({
  assetId: 'vid-789',
  assetType: AssetType.VIDEO,
  storageUrl: videoUpload.storageUrl,
  fileSize: 50000000, // 50MB
  mimeType: 'video/mp4',
});

console.log('Video URL:', result.publicUrl);
console.log('Thumbnail URL:', result.thumbnailUrl);
```

### Document Upload Example

```typescript
// Generate presigned URL for document upload
const docUpload = await uploadHandler.generatePresignedUploadUrl({
  assetId: 'doc-101',
  assetType: AssetType.DOCUMENT,
  uploadType: UploadType.DOC,
  fileName: 'private-notes.pdf',
  contentType: 'application/pdf',
});

// Client uploads to docUpload.uploadUrl
// Then complete the upload
const result = await uploadHandler.completeUpload({
  assetId: 'doc-101',
  assetType: AssetType.DOCUMENT,
  storageUrl: docUpload.storageUrl,
  fileSize: 512000,
  mimeType: 'application/pdf',
});

console.log('Storage URL:', result.storageUrl);
// Note: Documents don't have public URLs by default (private storage)
```

### Link Asset Example

```typescript
// Links don't require file uploads
const linkUpload = await uploadHandler.generatePresignedUploadUrl({
  assetId: 'link-202',
  assetType: AssetType.LINK,
  uploadType: UploadType.SEO,
  fileName: 'external-link',
  contentType: 'text/plain',
});

// linkUpload.uploadUrl will be undefined
// linkUpload.storageUrl will be 'link://link-202'

const result = await uploadHandler.completeUpload({
  assetId: 'link-202',
  assetType: AssetType.LINK,
  storageUrl: linkUpload.storageUrl,
});

console.log('Link storage URL:', result.storageUrl);
```

## API Reference

### `generatePresignedUploadUrl(request: PresignedUploadRequest): Promise<UploadResponse>`

Generates a presigned URL for direct client-side upload to Cloudflare services.

**Parameters:**
- `request.assetId` (string, required): Unique identifier for the asset
- `request.assetType` (AssetType, required): Type of asset (IMAGE, VIDEO, DOCUMENT, LINK)
- `request.uploadType` (UploadType, required): Upload type (SEO or DOC)
- `request.fileName` (string, required): Original file name
- `request.contentType` (string, required): MIME type of the file
- `request.expiresIn` (number, optional): URL expiration time in seconds (default: 3600)

**Returns:**
```typescript
{
  assetId: string;
  uploadUrl?: string;  // Presigned URL for upload (undefined for LINK type)
  storageUrl: string;  // Internal storage URL
}
```

**Throws:**
- Error if asset type is invalid
- Error if required fields are missing
- Error if storage service fails

### `completeUpload(request: CompleteUploadRequest): Promise<CompleteUploadResponse>`

Completes the upload process and returns final storage URLs.

**Parameters:**
- `request.assetId` (string, required): Asset ID
- `request.assetType` (AssetType, required): Asset type
- `request.storageUrl` (string, required): Storage URL from presigned response
- `request.fileSize` (number, optional): File size in bytes
- `request.mimeType` (string, optional): MIME type
- `request.metadata` (object, optional): Additional metadata

**Returns:**
```typescript
{
  assetId: string;
  storageUrl: string;
  publicUrl?: string;     // Public access URL (if applicable)
  thumbnailUrl?: string;  // Thumbnail URL (if applicable)
}
```

**Throws:**
- Error if asset type is invalid
- Error if required fields are missing

### `validateConfig(): { valid: boolean; errors: string[] }`

Validates the Cloudflare storage configuration.

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];  // Array of validation error messages
}
```

### `getStorageService(): StorageService`

Returns the underlying `StorageService` instance for advanced operations.

**Returns:** `StorageService` instance

## Integration with AssetService

The `UploadHandler` is designed to work seamlessly with the `AssetService`:

```typescript
import { UploadHandler } from '@/lib/services/UploadHandler';
import { AssetService } from '@/lib/services/AssetService';
import { AssetType, UploadType, UserRole } from '@/types';

// 1. Generate presigned URL
const uploadHandler = new UploadHandler(storageConfig);
const presignedResponse = await uploadHandler.generatePresignedUploadUrl({
  assetId: 'new-asset-id',
  assetType: AssetType.IMAGE,
  uploadType: UploadType.SEO,
  fileName: 'banner.jpg',
  contentType: 'image/jpeg',
});

// 2. Client uploads file to presignedResponse.uploadUrl

// 3. Complete upload
const completeResponse = await uploadHandler.completeUpload({
  assetId: 'new-asset-id',
  assetType: AssetType.IMAGE,
  storageUrl: presignedResponse.storageUrl,
  fileSize: 1024000,
  mimeType: 'image/jpeg',
});

// 4. Create asset record in database
const assetService = new AssetService(prisma, auditService);
const asset = await assetService.createAsset({
  title: 'Marketing Banner',
  description: 'Q4 campaign banner',
  tags: ['marketing', 'q4', 'banner'],
  assetType: AssetType.IMAGE,
  uploadType: UploadType.SEO,
  companyId: 'company-123',
  uploaderId: 'user-456',
  storageUrl: completeResponse.storageUrl,
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  submitForReview: true,
  userRole: UserRole.CONTENT_CREATOR,
});
```

## Error Handling

The `UploadHandler` throws descriptive errors for various failure scenarios:

```typescript
try {
  const response = await uploadHandler.generatePresignedUploadUrl({
    assetId: 'test-asset',
    assetType: AssetType.IMAGE,
    uploadType: UploadType.SEO,
    fileName: 'test.jpg',
    contentType: 'image/jpeg',
  });
} catch (error) {
  if (error.message.includes('Invalid asset type')) {
    // Handle invalid asset type
  } else if (error.message.includes('Asset ID is required')) {
    // Handle missing asset ID
  } else if (error.message.includes('Failed to generate presigned upload URL')) {
    // Handle storage service failure
  } else {
    // Handle other errors
  }
}
```

## Configuration

The `UploadHandler` requires the following environment variables:

```env
# Cloudflare R2 (Document Storage)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name

# Cloudflare Stream (Video Storage)
STREAM_ACCOUNT_ID=your-account-id
STREAM_API_TOKEN=your-api-token

# Cloudflare Images (Image Storage)
IMAGES_ACCOUNT_ID=your-account-id
IMAGES_API_TOKEN=your-api-token
```

Validate configuration before use:

```typescript
const uploadHandler = new UploadHandler(storageConfig);
const validation = uploadHandler.validateConfig();

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  throw new Error('Invalid storage configuration');
}
```

## Best Practices

1. **Always validate configuration** before using the upload handler
2. **Set appropriate expiration times** for presigned URLs based on expected upload duration
3. **Handle errors gracefully** and provide user-friendly error messages
4. **Use the two-step upload flow**: presigned URL generation → client upload → completion
5. **Store the storageUrl** in your database for future access to the file
6. **Use the AssetService** to create asset records after successful uploads
7. **Implement retry logic** for transient storage service failures
8. **Monitor upload success rates** and adjust expiration times if needed

## Testing

See `__tests__/UploadHandler.test.ts` for comprehensive unit tests covering:
- Presigned URL generation for all asset types
- Upload completion
- Error handling
- Configuration validation
- Integration with StorageService

## Related Services

- **StorageService**: Low-level storage operations
- **AssetService**: Asset record management
- **AuditService**: Audit logging for uploads

## Future Enhancements

- Support for multipart uploads for large files
- Progress tracking for uploads
- Automatic retry with exponential backoff
- Upload cancellation support
- Bandwidth throttling for large uploads
- Support for custom metadata in storage services
