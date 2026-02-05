/**
 * StorageService - Unified interface for storage operations across Cloudflare services
 * 
 * This service provides a unified interface for:
 * - Cloudflare R2 (Document storage)
 * - Cloudflare Stream (Video storage)
 * - Cloudflare Images (Image storage)
 * 
 * Requirements: 10.1-10.6
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { 
  StorageConfig, 
  StorageUploadRequest, 
  StorageUploadResponse, 
  SignedUrlRequest, 
  SignedUrlResponse,
  AssetType 
} from '@/types';

export class StorageService {
  private r2Client: S3Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    
    // Validate required R2 configuration
    if (!config.r2AccountId || !config.r2AccessKeyId || !config.r2SecretAccessKey || !config.r2BucketName) {
      throw new Error('Missing required R2 configuration. Please check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.');
    }
    
    // Initialize R2 client (S3-compatible)
    try {
      this.r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.r2AccessKeyId,
          secretAccessKey: config.r2SecretAccessKey,
        },
      });
    } catch (error: any) {
      console.error('Error initializing R2 client:', error);
      throw new Error(`Failed to initialize R2 storage client: ${error.message}`);
    }
  }

  /**
   * Route upload to appropriate storage service based on asset type
   * Modified to use R2 for all file types (images, videos, documents)
   * Requirement 10.1: Images to Cloudflare R2 (modified from Images)
   * Requirement 10.2: Videos to Cloudflare R2 (modified from Stream)
   * Requirement 10.3: Documents to Cloudflare R2
   */
  async upload(request: StorageUploadRequest): Promise<StorageUploadResponse> {
    switch (request.assetType) {
      case AssetType.IMAGE:
      case AssetType.VIDEO:
      case AssetType.DOCUMENT:
        // Use R2 for all file types
        return this.uploadToR2(request);
      case AssetType.LINK:
        // Links don't require file storage
        return {
          storageUrl: `link://${request.assetId}`,
          publicUrl: undefined,
          thumbnailUrl: undefined,
        };
      default:
        throw new Error(`Unsupported asset type: ${request.assetType}`);
    }
  }

  /**
   * Generate presigned URL for direct upload to storage
   * Modified to use R2 for all file types
   * Requirement 10.4: Generate presigned URL for direct upload
   */
  async generatePresignedUploadUrl(
    assetId: string,
    assetType: AssetType,
    fileName: string,
    contentType: string,
    expiresIn: number = 3600,
    customKey?: string // Optional custom key to ensure consistency
  ): Promise<string> {
    switch (assetType) {
      case AssetType.IMAGE:
      case AssetType.VIDEO:
      case AssetType.DOCUMENT:
        // Use R2 for all file types
        return this.generateR2UploadUrl(assetId, fileName, contentType, expiresIn, customKey);
      case AssetType.LINK:
        // Links don't require presigned URLs
        return '';
      default:
        throw new Error(`Unsupported asset type: ${assetType}`);
    }
  }

  /**
   * Generate signed URL for secure file access with expiration
   * Requirement 10.5: Generate signed URL with expiration
   */
  async generateSignedUrl(request: SignedUrlRequest): Promise<SignedUrlResponse> {
    const { storageUrl, expiresIn } = request;
    
    // Parse storage URL to determine service
    if (storageUrl.startsWith('r2://')) {
      return this.generateR2SignedUrl(storageUrl, expiresIn);
    } else if (storageUrl.startsWith('stream://')) {
      return this.generateStreamSignedUrl(storageUrl, expiresIn);
    } else if (storageUrl.startsWith('images://')) {
      return this.generateImagesSignedUrl(storageUrl, expiresIn);
    } else if (storageUrl.startsWith('link://')) {
      // Links don't need signed URLs
      return {
        signedUrl: storageUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } else {
      throw new Error(`Invalid storage URL format: ${storageUrl}`);
    }
  }

  /**
   * Delete file from storage
   */
  async delete(storageUrl: string): Promise<void> {
    if (storageUrl.startsWith('r2://')) {
      await this.deleteFromR2(storageUrl);
    } else if (storageUrl.startsWith('stream://')) {
      await this.deleteFromStream(storageUrl);
    } else if (storageUrl.startsWith('images://')) {
      await this.deleteFromImages(storageUrl);
    } else if (storageUrl.startsWith('link://')) {
      // Links don't need deletion
      return;
    } else {
      throw new Error(`Invalid storage URL format: ${storageUrl}`);
    }
  }

  // ============================================================================
  // R2 (Document Storage) Methods
  // ============================================================================

  private async uploadToR2(request: StorageUploadRequest): Promise<StorageUploadResponse> {
    const key = this.generateR2Key(request.assetId, request.fileName || 'document');
    const buffer = request.file instanceof Buffer 
      ? request.file 
      : await this.fileToBuffer(request.file as File);

    const command = new PutObjectCommand({
      Bucket: this.config.r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: request.contentType || 'application/octet-stream',
    });

    await this.r2Client.send(command);

    return {
      storageUrl: `r2://${this.config.r2BucketName}/${key}`,
      publicUrl: undefined, // R2 URLs are private by default
      thumbnailUrl: undefined,
    };
  }

  private async generateR2UploadUrl(
    assetId: string,
    fileName: string,
    contentType: string,
    expiresIn: number,
    customKey?: string
  ): Promise<string> {
    const key = customKey || this.generateR2Key(assetId, fileName);

    const command = new PutObjectCommand({
      Bucket: this.config.r2BucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.r2Client, command, { expiresIn });
  }

  private async generateR2SignedUrl(storageUrl: string, expiresIn: number): Promise<SignedUrlResponse> {
    try {
      const key = this.extractR2Key(storageUrl);

      const command = new GetObjectCommand({
        Bucket: this.config.r2BucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.r2Client, command, { expiresIn });
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      return { signedUrl, expiresAt };
    } catch (error: any) {
      console.error('Error generating R2 signed URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  private async deleteFromR2(storageUrl: string): Promise<void> {
    const key = this.extractR2Key(storageUrl);

    const command = new DeleteObjectCommand({
      Bucket: this.config.r2BucketName,
      Key: key,
    });

    await this.r2Client.send(command);
  }

  private generateR2Key(assetId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Organize by asset ID to keep all versions together
    return `assets/${assetId}/${timestamp}-${sanitizedFileName}`;
  }

  private extractR2Key(storageUrl: string): string {
    // Format: r2://bucket-name/key
    const match = storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid R2 storage URL: ${storageUrl}`);
    }
    return match[1];
  }

  // ============================================================================
  // Cloudflare Stream (Video Storage) Methods
  // ============================================================================

  private async uploadToStream(request: StorageUploadRequest): Promise<StorageUploadResponse> {
    // Cloudflare Stream API endpoint
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.streamAccountId}/stream`;

    const formData = new FormData();
    const buffer = request.file instanceof Buffer 
      ? request.file 
      : await this.fileToBuffer(request.file as File);
    const blob = new Blob([new Uint8Array(buffer)], { type: request.contentType || 'video/mp4' });
    formData.append('file', blob, request.fileName || 'video.mp4');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.streamApiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload to Cloudflare Stream: ${error}`);
    }

    const data = await response.json() as { result: { uid: string; thumbnail?: string; preview?: string } };
    const videoId = data.result.uid;

    return {
      storageUrl: `stream://${this.config.streamAccountId}/${videoId}`,
      publicUrl: `https://customer-${this.config.streamAccountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`,
      thumbnailUrl: data.result.thumbnail,
    };
  }

  private async generateStreamUploadUrl(
    assetId: string,
    fileName: string,
    contentType: string,
    expiresIn: number
  ): Promise<string> {
    // Cloudflare Stream supports direct creator uploads
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.streamAccountId}/stream/direct_upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.streamApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: 21600, // 6 hours max
        expiry: new Date(Date.now() + expiresIn * 1000).toISOString(),
        meta: {
          assetId,
          fileName,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate Stream upload URL: ${error}`);
    }

    const data = await response.json() as { result: { uploadURL: string } };
    return data.result.uploadURL;
  }

  private async generateStreamSignedUrl(storageUrl: string, expiresIn: number): Promise<SignedUrlResponse> {
    const videoId = this.extractStreamVideoId(storageUrl);
    
    // Cloudflare Stream signed URLs require token generation
    // For now, return the public URL (in production, implement signed tokens)
    const signedUrl = `https://customer-${this.config.streamAccountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { signedUrl, expiresAt };
  }

  private async deleteFromStream(storageUrl: string): Promise<void> {
    const videoId = this.extractStreamVideoId(storageUrl);
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.streamAccountId}/stream/${videoId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.streamApiToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete from Cloudflare Stream: ${error}`);
    }
  }

  private extractStreamVideoId(storageUrl: string): string {
    // Format: stream://account-id/video-id
    const match = storageUrl.match(/^stream:\/\/[^/]+\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid Stream storage URL: ${storageUrl}`);
    }
    return match[1];
  }

  // ============================================================================
  // Cloudflare Images (Image Storage) Methods
  // ============================================================================

  private async uploadToImages(request: StorageUploadRequest): Promise<StorageUploadResponse> {
    // Cloudflare Images API endpoint
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.imagesAccountId}/images/v1`;

    const formData = new FormData();
    const buffer = request.file instanceof Buffer 
      ? request.file 
      : await this.fileToBuffer(request.file as File);
    const blob = new Blob([new Uint8Array(buffer)], { type: request.contentType || 'image/jpeg' });
    formData.append('file', blob, request.fileName || 'image.jpg');
    formData.append('id', request.assetId);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.imagesApiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload to Cloudflare Images: ${error}`);
    }

    const data = await response.json() as { 
      result: { 
        id: string; 
        variants: string[];
      } 
    };
    const imageId = data.result.id;
    const publicUrl = data.result.variants[0]; // First variant is typically the public URL

    return {
      storageUrl: `images://${this.config.imagesAccountId}/${imageId}`,
      publicUrl,
      thumbnailUrl: publicUrl, // Cloudflare Images provides variants for thumbnails
    };
  }

  private async generateImagesUploadUrl(
    assetId: string,
    fileName: string,
    contentType: string,
    expiresIn: number
  ): Promise<string> {
    // Cloudflare Images supports direct creator uploads
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.imagesAccountId}/images/v2/direct_upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.imagesApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: assetId,
        expiry: new Date(Date.now() + expiresIn * 1000).toISOString(),
        metadata: {
          fileName,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate Images upload URL: ${error}`);
    }

    const data = await response.json() as { result: { uploadURL: string } };
    return data.result.uploadURL;
  }

  private async generateImagesSignedUrl(storageUrl: string, expiresIn: number): Promise<SignedUrlResponse> {
    const imageId = this.extractImageId(storageUrl);
    
    // Cloudflare Images URLs are public by default with variants
    // For private images, implement signed URLs with tokens
    const signedUrl = `https://imagedelivery.net/${this.config.imagesAccountId}/${imageId}/public`;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { signedUrl, expiresAt };
  }

  private async deleteFromImages(storageUrl: string): Promise<void> {
    const imageId = this.extractImageId(storageUrl);
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.imagesAccountId}/images/v1/${imageId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.imagesApiToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete from Cloudflare Images: ${error}`);
    }
  }

  private extractImageId(storageUrl: string): string {
    // Format: images://account-id/image-id
    const match = storageUrl.match(/^images:\/\/[^/]+\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid Images storage URL: ${storageUrl}`);
    }
    return match[1];
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Validate storage configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // R2 validation (required for all file types)
    if (!this.config.r2AccountId) errors.push('R2_ACCOUNT_ID is required');
    if (!this.config.r2AccessKeyId) errors.push('R2_ACCESS_KEY_ID is required');
    if (!this.config.r2SecretAccessKey) errors.push('R2_SECRET_ACCESS_KEY is required');
    if (!this.config.r2BucketName) errors.push('R2_BUCKET_NAME is required');

    // Stream validation (optional - only needed if using Stream)
    // if (!this.config.streamAccountId) errors.push('STREAM_ACCOUNT_ID is required');
    // if (!this.config.streamApiToken) errors.push('STREAM_API_TOKEN is required');

    // Images validation (optional - only needed if using Images)
    // if (!this.config.imagesAccountId) errors.push('IMAGES_ACCOUNT_ID is required');
    // if (!this.config.imagesApiToken) errors.push('IMAGES_API_TOKEN is required');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
