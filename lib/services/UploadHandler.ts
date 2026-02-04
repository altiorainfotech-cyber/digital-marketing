/**
 * UploadHandler
 * 
 * Manages file uploads to Cloudflare services and generates presigned URLs.
 * Handles different asset types (image, video, document, link).
 * 
 * Requirements: 3.7, 4.6, 10.1-10.6
 * 
 * Key Features:
 * - Generates presigned URLs for direct upload to Cloudflare services
 * - Routes uploads to appropriate storage service based on asset type
 * - Handles IMAGE -> Cloudflare Images
 * - Handles VIDEO -> Cloudflare Stream
 * - Handles DOCUMENT -> Cloudflare R2
 * - Handles LINK -> No storage needed
 * - Integrates with StorageService for all storage operations
 */

import { StorageService } from './StorageService';
import { 
  AssetType, 
  UploadType,
  StorageConfig,
  UploadResponse
} from '@/types';

export interface PresignedUploadRequest {
  assetId: string;
  assetType: AssetType;
  uploadType: UploadType;
  fileName: string;
  contentType: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

export interface CompleteUploadRequest {
  assetId: string;
  assetType: AssetType;
  storageUrl: string;
  fileSize?: number;
  mimeType?: string;
  metadata?: Record<string, any>;
}

export interface CompleteUploadResponse {
  assetId: string;
  storageUrl: string;
  publicUrl?: string;
  thumbnailUrl?: string;
}

export class UploadHandler {
  private storageService: StorageService;
  private config: StorageConfig;

  constructor(storageConfig: StorageConfig) {
    this.config = storageConfig;
    this.storageService = new StorageService(storageConfig);
  }

  /**
   * Generate presigned URL for direct upload to Cloudflare services
   * 
   * Requirement 10.4: Generate presigned URL for direct upload
   * 
   * Routes to appropriate storage service based on asset type:
   * - IMAGE -> Cloudflare Images (Requirement 10.1)
   * - VIDEO -> Cloudflare Stream (Requirement 10.2)
   * - DOCUMENT -> Cloudflare R2 (Requirement 10.3)
   * - LINK -> No upload needed
   * 
   * @param request - Presigned upload request parameters
   * @returns Upload response with presigned URL and storage URL
   * @throws Error if asset type is invalid or storage service fails
   */
  async generatePresignedUploadUrl(request: PresignedUploadRequest): Promise<UploadResponse> {
    const { assetId, assetType, fileName, contentType, expiresIn = 3600 } = request;

    // Validate asset type
    if (!Object.values(AssetType).includes(assetType)) {
      throw new Error(`Invalid asset type: ${assetType}`);
    }

    // Validate required fields
    if (!assetId || assetId.trim().length === 0) {
      throw new Error('Asset ID is required');
    }

    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name is required');
    }

    if (!contentType || contentType.trim().length === 0) {
      throw new Error('Content type is required');
    }

    // Validate expiresIn is positive
    if (expiresIn <= 0) {
      throw new Error('Expiration time must be positive');
    }

    // Handle LINK type - no upload needed
    if (assetType === AssetType.LINK) {
      return {
        assetId,
        uploadUrl: undefined,
        storageUrl: `link://${assetId}`,
      };
    }

    try {
      // Generate presigned URL using StorageService
      const uploadUrl = await this.storageService.generatePresignedUploadUrl(
        assetId,
        assetType,
        fileName,
        contentType,
        expiresIn
      );

      // Generate storage URL based on asset type
      const storageUrl = this.generateStorageUrl(assetId, assetType);

      return {
        assetId,
        uploadUrl,
        storageUrl,
      };
    } catch (error) {
      // Log error and rethrow with context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate presigned upload URL: ${errorMessage}`);
    }
  }

  /**
   * Complete upload after file has been uploaded to storage
   * 
   * This method is called after the client has successfully uploaded the file
   * using the presigned URL. It returns the final storage URLs.
   * 
   * Requirement 10.6: Record storage location and file metadata
   * 
   * @param request - Complete upload request parameters
   * @returns Complete upload response with storage URLs
   * @throws Error if asset type is invalid
   */
  async completeUpload(request: CompleteUploadRequest): Promise<CompleteUploadResponse> {
    const { assetId, assetType, storageUrl, fileSize, mimeType, metadata } = request;

    // Validate asset type
    if (!Object.values(AssetType).includes(assetType)) {
      throw new Error(`Invalid asset type: ${assetType}`);
    }

    // Validate required fields
    if (!assetId || assetId.trim().length === 0) {
      throw new Error('Asset ID is required');
    }

    if (!storageUrl || storageUrl.trim().length === 0) {
      throw new Error('Storage URL is required');
    }

    // For LINK type, return simple response
    if (assetType === AssetType.LINK) {
      return {
        assetId,
        storageUrl,
        publicUrl: undefined,
        thumbnailUrl: undefined,
      };
    }

    // Return storage information
    // Note: Public URLs and thumbnail URLs are generated by the storage service
    // during the upload process. For presigned uploads, these are typically
    // available after the upload completes.
    return {
      assetId,
      storageUrl,
      publicUrl: this.generatePublicUrl(assetType, storageUrl),
      thumbnailUrl: this.generateThumbnailUrl(assetType, storageUrl),
    };
  }

  /**
   * Generate storage URL based on asset type and ID
   * 
   * @param assetId - Asset ID
   * @param assetType - Asset type
   * @returns Storage URL in the format: {service}://{account-id}/{asset-id}
   */
  private generateStorageUrl(assetId: string, assetType: AssetType): string {
    switch (assetType) {
      case AssetType.IMAGE:
        return `r2://${this.config.r2BucketName}/images/${assetId}`;
      case AssetType.VIDEO:
        return `r2://${this.config.r2BucketName}/videos/${assetId}`;
      case AssetType.DOCUMENT:
        return `r2://${this.config.r2BucketName}/documents/${assetId}`;
      case AssetType.LINK:
        return `link://${assetId}`;
      default:
        throw new Error(`Unsupported asset type: ${assetType}`);
    }
  }

  /**
   * Generate public URL for accessing the asset
   * 
   * Note: This is a placeholder implementation. In production, you would
   * query the storage service to get the actual public URL after upload.
   * 
   * @param assetType - Asset type
   * @param storageUrl - Storage URL
   * @returns Public URL or undefined if not applicable
   */
  private generatePublicUrl(assetType: AssetType, storageUrl: string): string | undefined {
    switch (assetType) {
      case AssetType.IMAGE:
        const imageId = this.extractIdFromStorageUrl(storageUrl);
        return `https://imagedelivery.net/${this.config.imagesAccountId}/${imageId}/public`;
      case AssetType.VIDEO:
        const videoId = this.extractIdFromStorageUrl(storageUrl);
        return `https://customer-${this.config.streamAccountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
      case AssetType.DOCUMENT:
        // R2 documents are private by default, no public URL
        return undefined;
      case AssetType.LINK:
        return undefined;
      default:
        return undefined;
    }
  }

  /**
   * Generate thumbnail URL for the asset
   * 
   * @param assetType - Asset type
   * @param storageUrl - Storage URL
   * @returns Thumbnail URL or undefined if not applicable
   */
  private generateThumbnailUrl(assetType: AssetType, storageUrl: string): string | undefined {
    switch (assetType) {
      case AssetType.IMAGE:
        const imageId = this.extractIdFromStorageUrl(storageUrl);
        return `https://imagedelivery.net/${this.config.imagesAccountId}/${imageId}/thumbnail`;
      case AssetType.VIDEO:
        // Video thumbnails are typically generated by Stream
        const videoId = this.extractIdFromStorageUrl(storageUrl);
        return `https://customer-${this.config.streamAccountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
      case AssetType.DOCUMENT:
        return undefined;
      case AssetType.LINK:
        return undefined;
      default:
        return undefined;
    }
  }

  /**
   * Extract asset ID from storage URL
   * 
   * @param storageUrl - Storage URL
   * @returns Asset ID
   */
  private extractIdFromStorageUrl(storageUrl: string): string {
    // Extract ID from storage URL formats:
    // images://account-id/asset-id
    // stream://account-id/asset-id
    // r2://bucket-name/documents/asset-id
    // link://asset-id
    const parts = storageUrl.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Validate storage configuration
   * 
   * @returns Validation result with errors if any
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    return this.storageService.validateConfig();
  }

  /**
   * Get the underlying StorageService instance
   * 
   * This is useful for advanced operations that need direct access
   * to the storage service.
   * 
   * @returns StorageService instance
   */
  getStorageService(): StorageService {
    return this.storageService;
  }
}
