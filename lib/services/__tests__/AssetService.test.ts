/**
 * AssetService Unit Tests
 * 
 * Tests for asset creation, validation, and defaults based on upload type and user role.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@/app/generated/prisma';
import { AssetService } from '../AssetService';
import { AuditService } from '../AuditService';
import { 
  AssetType, 
  UploadType, 
  AssetStatus, 
  VisibilityLevel, 
  UserRole,
  User
} from '@/types';

// Mock Prisma Client
const mockPrisma = {
  asset: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
  company: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock Audit Service
const mockAuditService = {
  logAssetCreate: vi.fn(),
  logAssetUpdate: vi.fn(),
  logAssetDelete: vi.fn(),
} as unknown as AuditService;

// Mock Visibility Checker
const mockVisibilityChecker = {
  canView: vi.fn(),
  canEdit: vi.fn(),
  canDelete: vi.fn(),
  canApprove: vi.fn(),
  filterAssetsByRole: vi.fn(),
  filterVisibleAssets: vi.fn(),
} as any;

describe('AssetService', () => {
  let assetService: AssetService;

  beforeEach(() => {
    assetService = new AssetService(mockPrisma, mockAuditService, mockVisibilityChecker);
    vi.clearAllMocks();
  });

  describe('createAsset', () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    const mockUser = { id: 'user-1', email: 'test@example.com', role: UserRole.CONTENT_CREATOR };

    beforeEach(() => {
      (mockPrisma.company.findUnique as any).mockResolvedValue(mockCompany);
      (mockPrisma.user.findUnique as any).mockResolvedValue(mockUser);
    });

    it('should reject SEO upload without company', async () => {
      await expect(
        assetService.createAsset({
          title: 'Test Asset',
          assetType: AssetType.IMAGE,
          uploadType: UploadType.SEO,
          uploaderId: 'user-1',
          storageUrl: 'r2://bucket/test.png',
          userRole: UserRole.CONTENT_CREATOR,
          // Missing companyId
        })
      ).rejects.toThrow('Company required for SEO/Digital marketing uploads');
    });

    it('should accept DOC upload without company', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'Private Doc',
        description: null,
        tags: [],
        assetType: AssetType.DOCUMENT,
        uploadType: UploadType.DOC,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.UPLOADER_ONLY,
        companyId: null,
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/doc.pdf',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.create as any).mockResolvedValue(mockAsset);

      const result = await assetService.createAsset({
        title: 'Private Doc',
        assetType: AssetType.DOCUMENT,
        uploadType: UploadType.DOC,
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/doc.pdf',
        userRole: UserRole.CONTENT_CREATOR,
        // No companyId needed
      });

      expect(result.visibility).toBe(VisibilityLevel.UPLOADER_ONLY);
      expect(result.status).toBe(AssetStatus.DRAFT);
      expect(result.companyId).toBeUndefined();
    });

    it('should set ADMIN_ONLY visibility for Content_Creator SEO upload', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'SEO Asset',
        description: null,
        tags: [],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.create as any).mockResolvedValue(mockAsset);

      const result = await assetService.createAsset({
        title: 'SEO Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        userRole: UserRole.CONTENT_CREATOR,
      });

      expect(result.visibility).toBe(VisibilityLevel.ADMIN_ONLY);
    });

    it('should allow Admin to choose visibility for SEO upload', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'SEO Asset',
        description: null,
        tags: [],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.COMPANY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.create as any).mockResolvedValue(mockAsset);

      const result = await assetService.createAsset({
        title: 'SEO Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        userRole: UserRole.ADMIN,
        visibility: VisibilityLevel.COMPANY,
      });

      expect(result.visibility).toBe(VisibilityLevel.COMPANY);
    });

    it('should set PENDING_REVIEW status when submitForReview is true', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'SEO Asset',
        description: null,
        tags: [],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.PENDING_REVIEW,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.create as any).mockResolvedValue(mockAsset);

      const result = await assetService.createAsset({
        title: 'SEO Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        userRole: UserRole.CONTENT_CREATOR,
        submitForReview: true,
      });

      expect(result.status).toBe(AssetStatus.PENDING_REVIEW);
    });

    it('should set DRAFT status when submitForReview is false', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'SEO Asset',
        description: null,
        tags: [],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.create as any).mockResolvedValue(mockAsset);

      const result = await assetService.createAsset({
        title: 'SEO Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        userRole: UserRole.CONTENT_CREATOR,
        submitForReview: false,
      });

      expect(result.status).toBe(AssetStatus.DRAFT);
    });

    it('should reject description longer than 1000 characters', async () => {
      const longDescription = 'a'.repeat(1001);

      await expect(
        assetService.createAsset({
          title: 'Test Asset',
          description: longDescription,
          assetType: AssetType.IMAGE,
          uploadType: UploadType.SEO,
          companyId: 'company-1',
          uploaderId: 'user-1',
          storageUrl: 'r2://bucket/test.png',
          userRole: UserRole.CONTENT_CREATOR,
        })
      ).rejects.toThrow('Description cannot exceed 1000 characters');
    });

    it('should reject more than 20 tags', async () => {
      const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);

      await expect(
        assetService.createAsset({
          title: 'Test Asset',
          tags: tooManyTags,
          assetType: AssetType.IMAGE,
          uploadType: UploadType.SEO,
          companyId: 'company-1',
          uploaderId: 'user-1',
          storageUrl: 'r2://bucket/test.png',
          userRole: UserRole.CONTENT_CREATOR,
        })
      ).rejects.toThrow('Cannot have more than 20 tags');
    });

    it('should accept optional fields for SEO upload', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'SEO Asset',
        description: 'Test description',
        tags: ['tag1', 'tag2'],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: ['X', 'LinkedIn'],
        campaignName: 'Summer Campaign',
      };

      (mockPrisma.asset.create as any).mockResolvedValue(mockAsset);

      const result = await assetService.createAsset({
        title: 'SEO Asset',
        description: 'Test description',
        tags: ['tag1', 'tag2'],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        userRole: UserRole.CONTENT_CREATOR,
        targetPlatforms: ['X', 'LinkedIn'],
        campaignName: 'Summer Campaign',
      });

      expect(result.description).toBe('Test description');
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.targetPlatforms).toEqual(['X', 'LinkedIn']);
      expect(result.campaignName).toBe('Summer Campaign');
    });

    it('should log asset creation in audit log', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        description: null,
        tags: [],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.create as any).mockResolvedValue(mockAsset);

      await assetService.createAsset({
        title: 'Test Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test.png',
        userRole: UserRole.CONTENT_CREATOR,
      });

      expect(mockAuditService.logAssetCreate).toHaveBeenCalledWith(
        'user-1',
        'asset-1',
        expect.objectContaining({
          title: 'Test Asset',
          assetType: AssetType.IMAGE,
          uploadType: UploadType.SEO,
          status: AssetStatus.DRAFT,
          visibility: VisibilityLevel.ADMIN_ONLY,
          companyId: 'company-1',
        }),
        undefined,
        undefined
      );
    });
  });

  describe('updateAsset', () => {
    it('should update asset metadata', async () => {
      const existingAsset = {
        id: 'asset-1',
        title: 'Old Title',
        description: 'Old description',
        tags: ['old'],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/old',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      const updatedAsset = {
        ...existingAsset,
        title: 'New Title',
        description: 'New description',
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(existingAsset);
      (mockPrisma.asset.update as any).mockResolvedValue(updatedAsset);

      const result = await assetService.updateAsset({
        assetId: 'asset-1',
        title: 'New Title',
        description: 'New description',
        updatedBy: 'user-1',
      });

      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New description');
      expect(mockAuditService.logAssetUpdate).toHaveBeenCalled();
    });

    it('should reject description longer than 1000 characters', async () => {
      const existingAsset = {
        id: 'asset-1',
        title: 'Test',
        description: 'Old',
        tags: [],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: '',
        fileSize: null,
        mimeType: null,
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(existingAsset);

      const longDescription = 'a'.repeat(1001);

      await expect(
        assetService.updateAsset({
          assetId: 'asset-1',
          description: longDescription,
          updatedBy: 'user-1',
        })
      ).rejects.toThrow('Description cannot exceed 1000 characters');
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset and log in audit', async () => {
      const existingAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test',
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(existingAsset);
      (mockPrisma.asset.delete as any).mockResolvedValue(existingAsset);

      await assetService.deleteAsset('asset-1', 'user-1');

      expect(mockPrisma.asset.delete).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
      });
      expect(mockAuditService.logAssetDelete).toHaveBeenCalled();
    });

    it('should throw error if asset not found', async () => {
      (mockPrisma.asset.findUnique as any).mockResolvedValue(null);

      await expect(
        assetService.deleteAsset('asset-1', 'user-1')
      ).rejects.toThrow('Asset not found');
    });
  });

  describe('getAssetById', () => {
    it('should return asset by ID', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        description: 'Test description',
        tags: ['tag1'],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
        targetPlatforms: ['X'],
        campaignName: 'Test Campaign',
        approvedAt: null,
        approvedById: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(mockAsset);

      const result = await assetService.getAssetById('asset-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('asset-1');
      expect(result?.title).toBe('Test Asset');
    });

    it('should return null if asset not found', async () => {
      (mockPrisma.asset.findUnique as any).mockResolvedValue(null);

      const result = await assetService.getAssetById('asset-1');

      expect(result).toBeNull();
    });
  });

  describe('getAssetByIdWithPermission', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CONTENT_CREATOR,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return asset if user has permission', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        description: 'Test description',
        tags: ['tag1'],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.APPROVED,
        visibility: VisibilityLevel.COMPANY,
        companyId: 'company-1',
        uploaderId: 'user-2',
        storageUrl: 'r2://bucket/test',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
        targetPlatforms: ['X'],
        campaignName: 'Test Campaign',
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(mockAsset);
      mockVisibilityChecker.canView.mockResolvedValue(true);

      const result = await assetService.getAssetByIdWithPermission('asset-1', mockUser);

      expect(result).toBeDefined();
      expect(result?.id).toBe('asset-1');
      expect(mockVisibilityChecker.canView).toHaveBeenCalledWith(mockUser, mockAsset);
    });

    it('should throw error if user lacks permission', async () => {
      const mockAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        description: 'Test description',
        tags: ['tag1'],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.DOC,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.UPLOADER_ONLY,
        companyId: null,
        uploaderId: 'user-2',
        storageUrl: 'r2://bucket/test',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(mockAsset);
      mockVisibilityChecker.canView.mockResolvedValue(false);

      await expect(
        assetService.getAssetByIdWithPermission('asset-1', mockUser)
      ).rejects.toThrow('Insufficient permissions to access this asset');
    });

    it('should return null if asset not found', async () => {
      (mockPrisma.asset.findUnique as any).mockResolvedValue(null);

      const result = await assetService.getAssetByIdWithPermission('asset-1', mockUser);

      expect(result).toBeNull();
    });
  });

  describe('updateAssetWithPermission', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CONTENT_CREATOR,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update asset if user has permission', async () => {
      const existingAsset = {
        id: 'asset-1',
        title: 'Old Title',
        description: 'Old description',
        tags: ['old'],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/old',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      const updatedAsset = {
        ...existingAsset,
        title: 'New Title',
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(existingAsset);
      (mockPrisma.asset.update as any).mockResolvedValue(updatedAsset);
      mockVisibilityChecker.canEdit.mockReturnValue(true);

      const result = await assetService.updateAssetWithPermission(
        {
          assetId: 'asset-1',
          title: 'New Title',
          updatedBy: 'user-1',
        },
        mockUser
      );

      expect(result.title).toBe('New Title');
      expect(mockVisibilityChecker.canEdit).toHaveBeenCalledWith(mockUser, existingAsset);
    });

    it('should throw error if user lacks permission', async () => {
      const existingAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        description: 'Test',
        tags: [],
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.APPROVED,
        visibility: VisibilityLevel.COMPANY,
        companyId: 'company-1',
        uploaderId: 'user-2',
        storageUrl: 'r2://bucket/test',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
        targetPlatforms: [],
        campaignName: null,
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(existingAsset);
      mockVisibilityChecker.canEdit.mockReturnValue(false);

      await expect(
        assetService.updateAssetWithPermission(
          {
            assetId: 'asset-1',
            title: 'New Title',
            updatedBy: 'user-1',
          },
          mockUser
        )
      ).rejects.toThrow('Insufficient permissions to edit this asset');
    });
  });

  describe('deleteAssetWithPermission', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CONTENT_CREATOR,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should delete asset if user has permission', async () => {
      const existingAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.DRAFT,
        visibility: VisibilityLevel.ADMIN_ONLY,
        companyId: 'company-1',
        uploaderId: 'user-1',
        storageUrl: 'r2://bucket/test',
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(existingAsset);
      (mockPrisma.asset.delete as any).mockResolvedValue(existingAsset);
      mockVisibilityChecker.canDelete.mockReturnValue(true);

      await assetService.deleteAssetWithPermission('asset-1', mockUser);

      expect(mockPrisma.asset.delete).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
      });
      expect(mockVisibilityChecker.canDelete).toHaveBeenCalledWith(mockUser, existingAsset);
    });

    it('should throw error if user lacks permission', async () => {
      const existingAsset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: AssetType.IMAGE,
        uploadType: UploadType.SEO,
        status: AssetStatus.APPROVED,
        visibility: VisibilityLevel.COMPANY,
        companyId: 'company-1',
        uploaderId: 'user-2',
        storageUrl: 'r2://bucket/test',
      };

      (mockPrisma.asset.findUnique as any).mockResolvedValue(existingAsset);
      mockVisibilityChecker.canDelete.mockReturnValue(false);

      await expect(
        assetService.deleteAssetWithPermission('asset-1', mockUser)
      ).rejects.toThrow('Insufficient permissions to delete this asset');
    });
  });

  describe('listAssetsWithPermission', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.SEO_SPECIALIST,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should filter assets based on user permissions', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          title: 'Asset 1',
          description: null,
          tags: [],
          assetType: AssetType.IMAGE,
          uploadType: UploadType.SEO,
          status: AssetStatus.APPROVED,
          visibility: VisibilityLevel.COMPANY,
          companyId: 'company-1',
          uploaderId: 'user-2',
          storageUrl: 'r2://bucket/1',
          fileSize: null,
          mimeType: null,
          uploadedAt: new Date(),
          targetPlatforms: [],
          campaignName: null,
        },
        {
          id: 'asset-2',
          title: 'Asset 2',
          description: null,
          tags: [],
          assetType: AssetType.IMAGE,
          uploadType: UploadType.SEO,
          status: AssetStatus.DRAFT,
          visibility: VisibilityLevel.ADMIN_ONLY,
          companyId: 'company-1',
          uploaderId: 'user-2',
          storageUrl: 'r2://bucket/2',
          fileSize: null,
          mimeType: null,
          uploadedAt: new Date(),
          targetPlatforms: [],
          campaignName: null,
        },
      ];

      (mockPrisma.asset.findMany as any).mockResolvedValue(mockAssets);
      mockVisibilityChecker.filterAssetsByRole.mockResolvedValue([mockAssets[0]]);

      const result = await assetService.listAssetsWithPermission(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('asset-1');
      expect(mockVisibilityChecker.filterAssetsByRole).toHaveBeenCalledWith(
        mockUser,
        expect.arrayContaining([
          expect.objectContaining({ id: 'asset-1' }),
          expect.objectContaining({ id: 'asset-2' }),
        ])
      );
    });
  });

  describe('listApprovedSEOAssets', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.SEO_SPECIALIST,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return only approved SEO assets visible to user', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          title: 'Approved Asset',
          description: null,
          tags: [],
          assetType: AssetType.IMAGE,
          uploadType: UploadType.SEO,
          status: AssetStatus.APPROVED,
          visibility: VisibilityLevel.COMPANY,
          companyId: 'company-1',
          uploaderId: 'user-2',
          storageUrl: 'r2://bucket/1',
          fileSize: null,
          mimeType: null,
          uploadedAt: new Date(),
          targetPlatforms: ['X'],
          campaignName: 'Campaign 1',
        },
      ];

      (mockPrisma.asset.findMany as any).mockResolvedValue(mockAssets);
      mockVisibilityChecker.filterVisibleAssets.mockResolvedValue(mockAssets);

      const result = await assetService.listApprovedSEOAssets(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(AssetStatus.APPROVED);
      expect(result[0].uploadType).toBe(UploadType.SEO);
      expect(mockVisibilityChecker.filterVisibleAssets).toHaveBeenCalledWith(mockUser, mockAssets);
    });

    it('should filter by company if provided', async () => {
      (mockPrisma.asset.findMany as any).mockResolvedValue([]);
      mockVisibilityChecker.filterVisibleAssets.mockResolvedValue([]);

      await assetService.listApprovedSEOAssets(mockUser, { companyId: 'company-1' });

      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-1',
          }),
        })
      );
    });
  });
});
