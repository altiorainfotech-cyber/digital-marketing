/**
 * UploadHandler Unit Tests
 * 
 * Tests for the UploadHandler class covering:
 * - Presigned URL generation for all asset types
 * - Upload completion
 * - Error handling
 * - Configuration validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UploadHandler } from '../UploadHandler';
import { StorageService } from '../StorageService';
import { AssetType, UploadType, StorageConfig } from '@/types';

// Mock StorageService
vi.mock('../StorageService');

describe('UploadHandler', () => {
  let uploadHandler: UploadHandler;
  let mockStorageService: any;
  let storageConfig: StorageConfig;

  beforeEach(() => {
    // Setup mock storage config
    storageConfig = {
      r2AccountId: 'test-r2-account',
      r2AccessKeyId: 'test-access-key',
      r2SecretAccessKey: 'test-secret-key',
      r2BucketName: 'test-bucket',
      streamAccountId: 'test-stream-account',
      streamApiToken: 'test-stream-token',
      imagesAccountId: 'test-images-account',
      imagesApiToken: 'test-images-token',
    };

    // Create upload handler
    uploadHandler = new UploadHandler(storageConfig);

    // Get mocked storage service
    mockStorageService = uploadHandler.getStorageService();

    // Setup default mock implementations
    mockStorageService.generatePresignedUploadUrl = vi.fn();
    mockStorageService.validateConfig = vi.fn().mockReturnValue({ valid: true, errors: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned URL for IMAGE asset', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test-image.jpg',
        contentType: 'image/jpeg',
        expiresIn: 3600,
      };

      mockStorageService.generatePresignedUploadUrl.mockResolvedValue(
        'https://upload.imagedelivery.net/test-presigned-url'
      );

      // Act
      const result = await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(result).toEqual({
        assetId: 'img-123',
        uploadUrl: 'https://upload.imagedelivery.net/test-presigned-url',
        storageUrl: 'images://test-images-account/img-123',
      });

      expect(mockStorageService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'img-123',
        AssetType.IMAGE,
        'test-image.jpg',
        'image/jpeg',
        3600
      );
    });

    it('should generate presigned URL for VIDEO asset', async () => {
      // Arrange
      const request = {
        assetId: 'vid-456',
        assetType: AssetType.VIDEO,
        uploadType: UploadType.SEO,
        fileName: 'test-video.mp4',
        contentType: 'video/mp4',
        expiresIn: 7200,
      };

      mockStorageService.generatePresignedUploadUrl.mockResolvedValue(
        'https://upload.cloudflarestream.com/test-presigned-url'
      );

      // Act
      const result = await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(result).toEqual({
        assetId: 'vid-456',
        uploadUrl: 'https://upload.cloudflarestream.com/test-presigned-url',
        storageUrl: 'stream://test-stream-account/vid-456',
      });

      expect(mockStorageService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'vid-456',
        AssetType.VIDEO,
        'test-video.mp4',
        'video/mp4',
        7200
      );
    });

    it('should generate presigned URL for DOCUMENT asset', async () => {
      // Arrange
      const request = {
        assetId: 'doc-789',
        assetType: AssetType.DOCUMENT,
        uploadType: UploadType.DOC,
        fileName: 'test-document.pdf',
        contentType: 'application/pdf',
        expiresIn: 3600,
      };

      mockStorageService.generatePresignedUploadUrl.mockResolvedValue(
        'https://test-bucket.r2.cloudflarestorage.com/test-presigned-url'
      );

      // Act
      const result = await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(result).toEqual({
        assetId: 'doc-789',
        uploadUrl: 'https://test-bucket.r2.cloudflarestorage.com/test-presigned-url',
        storageUrl: 'r2://test-bucket/documents/doc-789',
      });

      expect(mockStorageService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'doc-789',
        AssetType.DOCUMENT,
        'test-document.pdf',
        'application/pdf',
        3600
      );
    });

    it('should handle LINK asset without generating presigned URL', async () => {
      // Arrange
      const request = {
        assetId: 'link-101',
        assetType: AssetType.LINK,
        uploadType: UploadType.SEO,
        fileName: 'external-link',
        contentType: 'text/plain',
      };

      // Act
      const result = await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(result).toEqual({
        assetId: 'link-101',
        uploadUrl: undefined,
        storageUrl: 'link://link-101',
      });

      // Should not call storage service for LINK type
      expect(mockStorageService.generatePresignedUploadUrl).not.toHaveBeenCalled();
    });

    it('should use default expiresIn of 3600 seconds', async () => {
      // Arrange
      const request = {
        assetId: 'img-default',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        // expiresIn not provided
      };

      mockStorageService.generatePresignedUploadUrl.mockResolvedValue(
        'https://upload.imagedelivery.net/test-url'
      );

      // Act
      await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(mockStorageService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'img-default',
        AssetType.IMAGE,
        'test.jpg',
        'image/jpeg',
        3600 // Default value
      );
    });

    it('should throw error for invalid asset type', async () => {
      // Arrange
      const request = {
        assetId: 'invalid-123',
        assetType: 'INVALID_TYPE' as AssetType,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
      };

      // Act & Assert
      await expect(uploadHandler.generatePresignedUploadUrl(request)).rejects.toThrow(
        'Invalid asset type: INVALID_TYPE'
      );
    });

    it('should throw error for missing asset ID', async () => {
      // Arrange
      const request = {
        assetId: '',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
      };

      // Act & Assert
      await expect(uploadHandler.generatePresignedUploadUrl(request)).rejects.toThrow(
        'Asset ID is required'
      );
    });

    it('should throw error for missing file name', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: '',
        contentType: 'image/jpeg',
      };

      // Act & Assert
      await expect(uploadHandler.generatePresignedUploadUrl(request)).rejects.toThrow(
        'File name is required'
      );
    });

    it('should throw error for missing content type', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: '',
      };

      // Act & Assert
      await expect(uploadHandler.generatePresignedUploadUrl(request)).rejects.toThrow(
        'Content type is required'
      );
    });

    it('should throw error for negative expiresIn', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        expiresIn: -100,
      };

      // Act & Assert
      await expect(uploadHandler.generatePresignedUploadUrl(request)).rejects.toThrow(
        'Expiration time must be positive'
      );
    });

    it('should throw error for zero expiresIn', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        expiresIn: 0,
      };

      // Act & Assert
      await expect(uploadHandler.generatePresignedUploadUrl(request)).rejects.toThrow(
        'Expiration time must be positive'
      );
    });

    it('should wrap storage service errors with context', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
      };

      mockStorageService.generatePresignedUploadUrl.mockRejectedValue(
        new Error('Storage service unavailable')
      );

      // Act & Assert
      await expect(uploadHandler.generatePresignedUploadUrl(request)).rejects.toThrow(
        'Failed to generate presigned upload URL: Storage service unavailable'
      );
    });
  });

  describe('completeUpload', () => {
    it('should complete IMAGE upload with public and thumbnail URLs', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        storageUrl: 'images://test-images-account/img-123',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
      };

      // Act
      const result = await uploadHandler.completeUpload(request);

      // Assert
      expect(result).toEqual({
        assetId: 'img-123',
        storageUrl: 'images://test-images-account/img-123',
        publicUrl: 'https://imagedelivery.net/test-images-account/img-123/public',
        thumbnailUrl: 'https://imagedelivery.net/test-images-account/img-123/thumbnail',
      });
    });

    it('should complete VIDEO upload with public and thumbnail URLs', async () => {
      // Arrange
      const request = {
        assetId: 'vid-456',
        assetType: AssetType.VIDEO,
        storageUrl: 'stream://test-stream-account/vid-456',
        fileSize: 50000000,
        mimeType: 'video/mp4',
      };

      // Act
      const result = await uploadHandler.completeUpload(request);

      // Assert
      expect(result).toEqual({
        assetId: 'vid-456',
        storageUrl: 'stream://test-stream-account/vid-456',
        publicUrl: 'https://customer-test-stream-account.cloudflarestream.com/vid-456/manifest/video.m3u8',
        thumbnailUrl: 'https://customer-test-stream-account.cloudflarestream.com/vid-456/thumbnails/thumbnail.jpg',
      });
    });

    it('should complete DOCUMENT upload without public URLs', async () => {
      // Arrange
      const request = {
        assetId: 'doc-789',
        assetType: AssetType.DOCUMENT,
        storageUrl: 'r2://test-bucket/documents/doc-789',
        fileSize: 512000,
        mimeType: 'application/pdf',
      };

      // Act
      const result = await uploadHandler.completeUpload(request);

      // Assert
      expect(result).toEqual({
        assetId: 'doc-789',
        storageUrl: 'r2://test-bucket/documents/doc-789',
        publicUrl: undefined,
        thumbnailUrl: undefined,
      });
    });

    it('should complete LINK upload without URLs', async () => {
      // Arrange
      const request = {
        assetId: 'link-101',
        assetType: AssetType.LINK,
        storageUrl: 'link://link-101',
      };

      // Act
      const result = await uploadHandler.completeUpload(request);

      // Assert
      expect(result).toEqual({
        assetId: 'link-101',
        storageUrl: 'link://link-101',
        publicUrl: undefined,
        thumbnailUrl: undefined,
      });
    });

    it('should throw error for invalid asset type', async () => {
      // Arrange
      const request = {
        assetId: 'invalid-123',
        assetType: 'INVALID_TYPE' as AssetType,
        storageUrl: 'invalid://invalid-123',
      };

      // Act & Assert
      await expect(uploadHandler.completeUpload(request)).rejects.toThrow(
        'Invalid asset type: INVALID_TYPE'
      );
    });

    it('should throw error for missing asset ID', async () => {
      // Arrange
      const request = {
        assetId: '',
        assetType: AssetType.IMAGE,
        storageUrl: 'images://test-images-account/img-123',
      };

      // Act & Assert
      await expect(uploadHandler.completeUpload(request)).rejects.toThrow(
        'Asset ID is required'
      );
    });

    it('should throw error for missing storage URL', async () => {
      // Arrange
      const request = {
        assetId: 'img-123',
        assetType: AssetType.IMAGE,
        storageUrl: '',
      };

      // Act & Assert
      await expect(uploadHandler.completeUpload(request)).rejects.toThrow(
        'Storage URL is required'
      );
    });
  });

  describe('validateConfig', () => {
    it('should validate configuration successfully', () => {
      // Arrange
      mockStorageService.validateConfig.mockReturnValue({
        valid: true,
        errors: [],
      });

      // Act
      const result = uploadHandler.validateConfig();

      // Assert
      expect(result).toEqual({
        valid: true,
        errors: [],
      });
      expect(mockStorageService.validateConfig).toHaveBeenCalled();
    });

    it('should return validation errors', () => {
      // Arrange
      mockStorageService.validateConfig.mockReturnValue({
        valid: false,
        errors: [
          'R2_ACCOUNT_ID is required',
          'STREAM_API_TOKEN is required',
        ],
      });

      // Act
      const result = uploadHandler.validateConfig();

      // Assert
      expect(result).toEqual({
        valid: false,
        errors: [
          'R2_ACCOUNT_ID is required',
          'STREAM_API_TOKEN is required',
        ],
      });
    });
  });

  describe('getStorageService', () => {
    it('should return the underlying StorageService instance', () => {
      // Act
      const storageService = uploadHandler.getStorageService();

      // Assert
      expect(storageService).toBe(mockStorageService);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long file names', async () => {
      // Arrange
      const longFileName = 'a'.repeat(500) + '.jpg';
      const request = {
        assetId: 'img-long',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: longFileName,
        contentType: 'image/jpeg',
      };

      mockStorageService.generatePresignedUploadUrl.mockResolvedValue(
        'https://upload.imagedelivery.net/test-url'
      );

      // Act
      const result = await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(result.assetId).toBe('img-long');
      expect(mockStorageService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'img-long',
        AssetType.IMAGE,
        longFileName,
        'image/jpeg',
        3600
      );
    });

    it('should handle special characters in file names', async () => {
      // Arrange
      const specialFileName = 'test file (1) [copy].jpg';
      const request = {
        assetId: 'img-special',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: specialFileName,
        contentType: 'image/jpeg',
      };

      mockStorageService.generatePresignedUploadUrl.mockResolvedValue(
        'https://upload.imagedelivery.net/test-url'
      );

      // Act
      const result = await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(result.assetId).toBe('img-special');
      expect(mockStorageService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'img-special',
        AssetType.IMAGE,
        specialFileName,
        'image/jpeg',
        3600
      );
    });

    it('should handle very large expiresIn values', async () => {
      // Arrange
      const request = {
        assetId: 'img-long-expiry',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        expiresIn: 86400 * 7, // 7 days
      };

      mockStorageService.generatePresignedUploadUrl.mockResolvedValue(
        'https://upload.imagedelivery.net/test-url'
      );

      // Act
      const result = await uploadHandler.generatePresignedUploadUrl(request);

      // Assert
      expect(result.assetId).toBe('img-long-expiry');
      expect(mockStorageService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'img-long-expiry',
        AssetType.IMAGE,
        'test.jpg',
        'image/jpeg',
        86400 * 7
      );
    });

    it('should handle metadata in completeUpload', async () => {
      // Arrange
      const request = {
        assetId: 'img-metadata',
        assetType: AssetType.IMAGE,
        storageUrl: 'images://test-images-account/img-metadata',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        metadata: {
          width: 1920,
          height: 1080,
          format: 'JPEG',
        },
      };

      // Act
      const result = await uploadHandler.completeUpload(request);

      // Assert
      expect(result.assetId).toBe('img-metadata');
      expect(result.storageUrl).toBe('images://test-images-account/img-metadata');
    });
  });
});
