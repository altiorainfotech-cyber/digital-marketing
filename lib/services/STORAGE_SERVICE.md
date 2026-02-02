# StorageService Documentation

## Overview

The `StorageService` provides a unified interface for storage operations across multiple Cloudflare services:
- **Cloudflare R2**: Document storage (S3-compatible)
- **Cloudflare Stream**: Video storage and streaming
- **Cloudflare Images**: Image storage with automatic optimization

## Requirements Addressed

- **Requirement 10.1**: Images stored in Cloudflare Images
- **Requirement 10.2**: Videos stored in Cloudflare Stream
- **Requirement 10.3**: Documents stored in Cloudflare R2
- **Requirement 10.4**: Generate presigned URLs for direct upload
- **Requirement 10.5**: Generate signed URLs with expiration
- **Requirement 10.6**: Record storage location and file metadata

## Architecture

### Storage URL Format

The service uses a custom URL scheme to identify storage locations:

- **R2 Documents**: `r2://bucket-name/path/to/file`
- **Stream Videos**: `stream://account-id/video-id`
- **Images**: `images://account-id/image-id`
- **Links**: `link://asset-id` (no actual file storage)

### Routing Logic

The service automatically routes uploads to the appropriate storage backend based on `AssetType`:

```typescript
AssetType.IMAGE    → Cloudflare Images
AssetType.VIDEO    → Cloudflare Stream
AssetType.DOCUMENT → Cloudflare R2
AssetType.LINK     → No storage (metadata only)
```

## Configuration

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Cloudflare R2 (Document Storage)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="dascms-documents"

# Cloudflare Stream (Video Storage)
STREAM_ACCOUNT_ID=""
STREAM_API_TOKEN=""

# Cloudflare Images (Image Storage)
IMAGES_ACCOUNT_ID=""
IMAGES_API_TOKEN=""
```

### Configuration Validation

The service provides a `validateConfig()` method to check if all required credentials are present:

```typescript
import { storageService } from '@/lib/config';

const validation = storageService.validateConfig();
if (!validation.valid) {
  console.error('Storage configuration errors:', validation.errors);
}
```

## Usage

### Basic Upload

```typescript
import { storageService } from '@/lib/config';
import { AssetType } from '@/types';

// Upload a document
const result = await storageService.upload({
  file: fileBuffer,
  assetType: AssetType.DOCUMENT,
  assetId: 'asset-123',
  fileName: 'report.pdf',
  contentType: 'application/pdf',
});

console.log(result.storageUrl); // r2://bucket/documents/asset-123/...
```

### Generate Presigned Upload URL

For direct client-to-storage uploads:

```typescript
const uploadUrl = await storageService.generatePresignedUploadUrl(
  'asset-123',
  AssetType.IMAGE,
  'photo.jpg',
  'image/jpeg',
  3600 // expires in 1 hour
);

// Client can now upload directly to this URL
```

### Generate Signed Download URL

For secure file access with expiration:

```typescript
const { signedUrl, expiresAt } = await storageService.generateSignedUrl({
  storageUrl: 'r2://bucket/documents/asset-123/file.pdf',
  expiresIn: 3600, // 1 hour
});

// User can download from signedUrl until expiresAt
```

### Delete File

```typescript
await storageService.delete('r2://bucket/documents/asset-123/file.pdf');
```

## API Reference

### `upload(request: StorageUploadRequest): Promise<StorageUploadResponse>`

Uploads a file to the appropriate storage service based on asset type.

**Parameters:**
- `request.file`: File buffer or File object
- `request.assetType`: Type of asset (IMAGE, VIDEO, DOCUMENT, LINK)
- `request.assetId`: Unique asset identifier
- `request.fileName`: Optional filename
- `request.contentType`: Optional MIME type

**Returns:**
- `storageUrl`: Internal storage URL
- `publicUrl`: Public access URL (if available)
- `thumbnailUrl`: Thumbnail URL (for images/videos)

### `generatePresignedUploadUrl(assetId, assetType, fileName, contentType, expiresIn): Promise<string>`

Generates a presigned URL for direct client uploads.

**Parameters:**
- `assetId`: Unique asset identifier
- `assetType`: Type of asset
- `fileName`: Name of file to upload
- `contentType`: MIME type
- `expiresIn`: Expiration time in seconds (default: 3600)

**Returns:** Presigned upload URL

### `generateSignedUrl(request: SignedUrlRequest): Promise<SignedUrlResponse>`

Generates a signed URL for secure file access.

**Parameters:**
- `request.storageUrl`: Internal storage URL
- `request.expiresIn`: Expiration time in seconds

**Returns:**
- `signedUrl`: Signed access URL
- `expiresAt`: Expiration timestamp

### `delete(storageUrl: string): Promise<void>`

Deletes a file from storage.

**Parameters:**
- `storageUrl`: Internal storage URL

### `validateConfig(): { valid: boolean; errors: string[] }`

Validates storage configuration.

**Returns:**
- `valid`: Whether configuration is complete
- `errors`: Array of missing configuration items

## Storage Service Details

### Cloudflare R2 (Documents)

- **Protocol**: S3-compatible API
- **Client**: AWS SDK S3 Client
- **Features**:
  - Presigned upload URLs
  - Signed download URLs with expiration
  - Automatic key generation with timestamps
  - Private by default

**Key Format:**
```
documents/{assetId}/{timestamp}-{sanitized-filename}
```

### Cloudflare Stream (Videos)

- **Protocol**: Cloudflare Stream API
- **Features**:
  - Direct creator uploads
  - Automatic transcoding
  - HLS streaming
  - Thumbnail generation
  - Adaptive bitrate streaming

**Public URL Format:**
```
https://customer-{accountId}.cloudflarestream.com/{videoId}/manifest/video.m3u8
```

### Cloudflare Images (Images)

- **Protocol**: Cloudflare Images API
- **Features**:
  - Direct creator uploads
  - Automatic optimization
  - Multiple variants (sizes)
  - WebP conversion
  - CDN delivery

**Public URL Format:**
```
https://imagedelivery.net/{accountId}/{imageId}/public
```

## Error Handling

The service throws descriptive errors for common issues:

```typescript
try {
  await storageService.upload(request);
} catch (error) {
  if (error.message.includes('Failed to upload to Cloudflare')) {
    // Handle Cloudflare API errors
  } else if (error.message.includes('Unsupported asset type')) {
    // Handle invalid asset type
  } else if (error.message.includes('Invalid storage URL')) {
    // Handle malformed storage URL
  }
}
```

## Integration with Asset Service

The StorageService is designed to be used by the AssetService:

```typescript
import { storageService } from '@/lib/config';

class AssetService {
  async createAsset(request: UploadRequest) {
    // 1. Generate presigned URL
    const uploadUrl = await storageService.generatePresignedUploadUrl(
      assetId,
      request.assetType,
      request.file.name,
      request.file.type
    );
    
    // 2. Return URL to client for direct upload
    return { assetId, uploadUrl };
  }
  
  async completeUpload(assetId: string, storageUrl: string) {
    // 3. Record storage location in database
    await prisma.asset.update({
      where: { id: assetId },
      data: { storageUrl },
    });
  }
  
  async downloadAsset(assetId: string) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    
    // 4. Generate signed download URL
    const { signedUrl, expiresAt } = await storageService.generateSignedUrl({
      storageUrl: asset.storageUrl,
      expiresIn: 3600,
    });
    
    return { downloadUrl: signedUrl, expiresAt };
  }
}
```

## Testing

The service includes comprehensive unit tests:

```bash
npm test -- tests/services/StorageService.test.ts
```

Test coverage includes:
- Configuration validation
- Storage URL parsing
- Asset type routing
- Error handling
- Link asset handling (no storage)

## Security Considerations

1. **Private by Default**: R2 files are private and require signed URLs
2. **Expiring URLs**: All signed URLs have configurable expiration times
3. **Credential Protection**: Never expose storage credentials to clients
4. **Direct Uploads**: Use presigned URLs for client uploads to avoid server bottlenecks
5. **Access Control**: Combine with PermissionChecker for asset-level access control

## Performance Considerations

1. **Direct Uploads**: Clients upload directly to Cloudflare, bypassing the application server
2. **CDN Delivery**: Images and videos are delivered via Cloudflare's global CDN
3. **Automatic Optimization**: Images are automatically optimized and converted to WebP
4. **Adaptive Streaming**: Videos use HLS for adaptive bitrate streaming
5. **Connection Pooling**: R2 client reuses connections for better performance

## Future Enhancements

Potential improvements for future iterations:

1. **Signed Stream URLs**: Implement token-based signed URLs for private videos
2. **Image Variants**: Support custom image transformations and variants
3. **Upload Progress**: Add support for tracking upload progress
4. **Multipart Uploads**: Support large file uploads with multipart upload
5. **Caching**: Add caching layer for frequently accessed signed URLs
6. **Retry Logic**: Implement exponential backoff for failed uploads
7. **Batch Operations**: Support batch upload/delete operations
8. **Storage Analytics**: Track storage usage and costs per asset type
