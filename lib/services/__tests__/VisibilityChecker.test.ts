/**
 * VisibilityChecker Unit Tests
 * 
 * Tests for permission checking methods: canView, canEdit, canDelete, canApprove
 * and visibility-based filtering logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisibilityChecker } from '../VisibilityChecker';
import { VisibilityService } from '../VisibilityService';
import { UserRole, AssetStatus, VisibilityLevel } from '@/app/generated/prisma';
import type { User, Asset } from '@/types';

// Mock VisibilityService
const mockVisibilityService = {
  canUserViewAsset: vi.fn(),
  getVisibleAssetIds: vi.fn(),
};

describe('VisibilityChecker', () => {
  let visibilityChecker: VisibilityChecker;

  beforeEach(() => {
    vi.clearAllMocks();
    visibilityChecker = new VisibilityChecker(mockVisibilityService as any);
  });

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContentCreator: User = {
    id: 'creator-1',
    email: 'creator@example.com',
    name: 'Content Creator',
    role: UserRole.CONTENT_CREATOR,
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSEOSpecialist: User = {
    id: 'seo-1',
    email: 'seo@example.com',
    name: 'SEO Specialist',
    role: UserRole.SEO_SPECIALIST,
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAsset: Asset = {
    id: 'asset-1',
    title: 'Test Asset',
    assetType: 'IMAGE' as any,
    uploadType: 'SEO' as any,
    status: AssetStatus.DRAFT,
    visibility: VisibilityLevel.ADMIN_ONLY,
    uploaderId: 'creator-1',
    companyId: 'company-1',
    storageUrl: 'https://example.com/asset',
    uploadedAt: new Date(),
  };

  describe('canView', () => {
    it('should delegate to VisibilityService.canUserViewAsset', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);
      
      const result = await visibilityChecker.canView(mockContentCreator, mockAsset);
      
      expect(result).toBe(true);
      expect(mockVisibilityService.canUserViewAsset).toHaveBeenCalledWith(mockContentCreator, mockAsset);
    });

    it('should return false when VisibilityService denies access', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(false);
      
      const result = await visibilityChecker.canView(mockContentCreator, mockAsset);
      
      expect(result).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('should allow Admin to edit any asset', () => {
      const result = visibilityChecker.canEdit(mockAdmin, mockAsset);
      expect(result).toBe(true);
    });

    it('should allow uploader to edit their own DRAFT asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.DRAFT, uploaderId: 'creator-1' };
      const result = visibilityChecker.canEdit(mockContentCreator, asset);
      expect(result).toBe(true);
    });

    it('should allow uploader to edit their own REJECTED asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.REJECTED, uploaderId: 'creator-1' };
      const result = visibilityChecker.canEdit(mockContentCreator, asset);
      expect(result).toBe(true);
    });

    it('should not allow uploader to edit their own PENDING_REVIEW asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.PENDING_REVIEW, uploaderId: 'creator-1' };
      const result = visibilityChecker.canEdit(mockContentCreator, asset);
      expect(result).toBe(false);
    });

    it('should not allow uploader to edit their own APPROVED asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.APPROVED, uploaderId: 'creator-1' };
      const result = visibilityChecker.canEdit(mockContentCreator, asset);
      expect(result).toBe(false);
    });

    it('should not allow non-uploader to edit asset', () => {
      const asset = { ...mockAsset, uploaderId: 'other-user' };
      const result = visibilityChecker.canEdit(mockContentCreator, asset);
      expect(result).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should allow Admin to delete any asset', () => {
      const result = visibilityChecker.canDelete(mockAdmin, mockAsset);
      expect(result).toBe(true);
    });

    it('should allow uploader to delete their own DRAFT asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.DRAFT, uploaderId: 'creator-1' };
      const result = visibilityChecker.canDelete(mockContentCreator, asset);
      expect(result).toBe(true);
    });

    it('should allow uploader to delete their own REJECTED asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.REJECTED, uploaderId: 'creator-1' };
      const result = visibilityChecker.canDelete(mockContentCreator, asset);
      expect(result).toBe(true);
    });

    it('should not allow uploader to delete their own PENDING_REVIEW asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.PENDING_REVIEW, uploaderId: 'creator-1' };
      const result = visibilityChecker.canDelete(mockContentCreator, asset);
      expect(result).toBe(false);
    });

    it('should not allow uploader to delete their own APPROVED asset', () => {
      const asset = { ...mockAsset, status: AssetStatus.APPROVED, uploaderId: 'creator-1' };
      const result = visibilityChecker.canDelete(mockContentCreator, asset);
      expect(result).toBe(false);
    });

    it('should not allow non-uploader to delete asset', () => {
      const asset = { ...mockAsset, uploaderId: 'other-user' };
      const result = visibilityChecker.canDelete(mockContentCreator, asset);
      expect(result).toBe(false);
    });
  });

  describe('canApprove', () => {
    it('should allow Admin to approve SEO asset with PENDING_REVIEW status', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.PENDING_REVIEW };
      const result = visibilityChecker.canApprove(mockAdmin, asset);
      expect(result).toBe(true);
    });

    it('should not allow Admin to approve SEO asset with DRAFT status', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.DRAFT };
      const result = visibilityChecker.canApprove(mockAdmin, asset);
      expect(result).toBe(false);
    });

    it('should not allow Admin to approve SEO asset with APPROVED status', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.APPROVED };
      const result = visibilityChecker.canApprove(mockAdmin, asset);
      expect(result).toBe(false);
    });

    it('should not allow Admin to approve DOC asset', () => {
      const asset = { ...mockAsset, uploadType: 'DOC' as any, status: AssetStatus.PENDING_REVIEW };
      const result = visibilityChecker.canApprove(mockAdmin, asset);
      expect(result).toBe(false);
    });

    it('should not allow Content_Creator to approve any asset', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.PENDING_REVIEW };
      const result = visibilityChecker.canApprove(mockContentCreator, asset);
      expect(result).toBe(false);
    });

    it('should not allow SEO_Specialist to approve any asset', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.PENDING_REVIEW };
      const result = visibilityChecker.canApprove(mockSEOSpecialist, asset);
      expect(result).toBe(false);
    });
  });

  describe('checkAllPermissions', () => {
    it('should return all permission flags for a user and asset', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);
      const asset = { ...mockAsset, status: AssetStatus.DRAFT, uploaderId: 'creator-1' };
      
      const result = await visibilityChecker.checkAllPermissions(mockContentCreator, asset);
      
      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.canApprove).toBe(false);
    });

    it('should include reason when user cannot view', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(false);
      
      const result = await visibilityChecker.checkAllPermissions(mockContentCreator, mockAsset);
      
      expect(result.canView).toBe(false);
      expect(result.reason).toBe('User does not have permission to view this asset');
    });

    it('should include reason when user has view-only access', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);
      const asset = { ...mockAsset, status: AssetStatus.APPROVED, uploaderId: 'other-user' };
      
      const result = await visibilityChecker.checkAllPermissions(mockContentCreator, asset);
      
      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(false);
      expect(result.canDelete).toBe(false);
      expect(result.canApprove).toBe(false);
      expect(result.reason).toBe('User has view-only access to this asset');
    });
  });

  describe('filterVisibleAssets', () => {
    it('should filter assets to only include visible ones', async () => {
      const assets = [
        { ...mockAsset, id: 'asset-1' },
        { ...mockAsset, id: 'asset-2' },
        { ...mockAsset, id: 'asset-3' },
      ];

      mockVisibilityService.canUserViewAsset
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await visibilityChecker.filterVisibleAssets(mockContentCreator, assets);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('asset-1');
      expect(result[1].id).toBe('asset-3');
    });

    it('should return empty array when no assets are visible', async () => {
      const assets = [
        { ...mockAsset, id: 'asset-1' },
        { ...mockAsset, id: 'asset-2' },
      ];

      mockVisibilityService.canUserViewAsset.mockResolvedValue(false);

      const result = await visibilityChecker.filterVisibleAssets(mockContentCreator, assets);

      expect(result).toHaveLength(0);
    });
  });

  describe('getVisibleAssetIds', () => {
    it('should delegate to VisibilityService.getVisibleAssetIds', async () => {
      const expectedIds = ['asset-1', 'asset-2', 'asset-3'];
      mockVisibilityService.getVisibleAssetIds.mockResolvedValue(expectedIds);

      const result = await visibilityChecker.getVisibleAssetIds(mockContentCreator);

      expect(result).toEqual(expectedIds);
      expect(mockVisibilityService.getVisibleAssetIds).toHaveBeenCalledWith(mockContentCreator);
    });
  });

  describe('canDownload', () => {
    it('should return true when user can view the asset', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);

      const result = await visibilityChecker.canDownload(mockContentCreator, mockAsset);

      expect(result).toBe(true);
    });

    it('should return false when user cannot view the asset', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(false);

      const result = await visibilityChecker.canDownload(mockContentCreator, mockAsset);

      expect(result).toBe(false);
    });
  });

  describe('canShare', () => {
    it('should allow uploader to share UPLOADER_ONLY asset', () => {
      const asset = { ...mockAsset, visibility: 'UPLOADER_ONLY' as any, uploaderId: 'creator-1' };
      const result = visibilityChecker.canShare(mockContentCreator, asset);
      expect(result).toBe(true);
    });

    it('should allow uploader to share SELECTED_USERS asset', () => {
      const asset = { ...mockAsset, visibility: 'SELECTED_USERS' as any, uploaderId: 'creator-1' };
      const result = visibilityChecker.canShare(mockContentCreator, asset);
      expect(result).toBe(true);
    });

    it('should not allow uploader to share PUBLIC asset', () => {
      const asset = { ...mockAsset, visibility: 'PUBLIC' as any, uploaderId: 'creator-1' };
      const result = visibilityChecker.canShare(mockContentCreator, asset);
      expect(result).toBe(false);
    });

    it('should not allow non-uploader to share asset', () => {
      const asset = { ...mockAsset, visibility: 'UPLOADER_ONLY' as any, uploaderId: 'other-user' };
      const result = visibilityChecker.canShare(mockContentCreator, asset);
      expect(result).toBe(false);
    });
  });

  describe('canModifyVisibility', () => {
    it('should allow Admin to modify visibility of SEO asset', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any };
      const result = visibilityChecker.canModifyVisibility(mockAdmin, asset);
      expect(result).toBe(true);
    });

    it('should not allow Admin to modify visibility of DOC asset', () => {
      const asset = { ...mockAsset, uploadType: 'DOC' as any };
      const result = visibilityChecker.canModifyVisibility(mockAdmin, asset);
      expect(result).toBe(false);
    });

    it('should not allow Content_Creator to modify visibility', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any };
      const result = visibilityChecker.canModifyVisibility(mockContentCreator, asset);
      expect(result).toBe(false);
    });

    it('should not allow SEO_Specialist to modify visibility', () => {
      const asset = { ...mockAsset, uploadType: 'SEO' as any };
      const result = visibilityChecker.canModifyVisibility(mockSEOSpecialist, asset);
      expect(result).toBe(false);
    });
  });

  describe('filterAssetsByRole', () => {
    it('should return all visible assets for Content_Creator', async () => {
      const assets = [
        { ...mockAsset, id: 'asset-1', uploaderId: 'creator-1', status: AssetStatus.DRAFT },
        { ...mockAsset, id: 'asset-2', uploaderId: 'other-user', status: AssetStatus.APPROVED },
      ];

      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);

      const result = await visibilityChecker.filterAssetsByRole(mockContentCreator, assets);

      expect(result).toHaveLength(2);
    });

    it('should return only APPROVED assets for SEO_Specialist', async () => {
      const assets = [
        { ...mockAsset, id: 'asset-1', status: AssetStatus.DRAFT },
        { ...mockAsset, id: 'asset-2', status: AssetStatus.APPROVED },
        { ...mockAsset, id: 'asset-3', status: AssetStatus.PENDING_REVIEW },
      ];

      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);

      const result = await visibilityChecker.filterAssetsByRole(mockSEOSpecialist, assets);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('asset-2');
    });

    it('should return all SEO assets for Admin', async () => {
      const assets = [
        { ...mockAsset, id: 'asset-1', uploadType: 'SEO' as any, status: AssetStatus.DRAFT },
        { ...mockAsset, id: 'asset-2', uploadType: 'SEO' as any, status: AssetStatus.APPROVED },
        { ...mockAsset, id: 'asset-3', uploadType: 'DOC' as any, visibility: 'UPLOADER_ONLY' as any, uploaderId: 'other-user' },
      ];

      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);

      const result = await visibilityChecker.filterAssetsByRole(mockAdmin, assets);

      expect(result).toHaveLength(2);
      expect(result[0].uploadType).toBe('SEO');
      expect(result[1].uploadType).toBe('SEO');
    });

    it('should include Doc assets for Admin if they are the uploader', async () => {
      const assets = [
        { ...mockAsset, id: 'asset-1', uploadType: 'DOC' as any, visibility: 'UPLOADER_ONLY' as any, uploaderId: 'admin-1' },
      ];

      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);

      const result = await visibilityChecker.filterAssetsByRole(mockAdmin, assets);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('asset-1');
    });

    it('should exclude assets that fail visibility check', async () => {
      const assets = [
        { ...mockAsset, id: 'asset-1', status: AssetStatus.APPROVED },
        { ...mockAsset, id: 'asset-2', status: AssetStatus.APPROVED },
      ];

      mockVisibilityService.canUserViewAsset
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await visibilityChecker.filterAssetsByRole(mockSEOSpecialist, assets);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('asset-1');
    });
  });

  describe('canLogPlatformUsage', () => {
    it('should allow logging usage for visible APPROVED SEO asset', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.APPROVED };

      const result = await visibilityChecker.canLogPlatformUsage(mockContentCreator, asset);

      expect(result).toBe(true);
    });

    it('should not allow logging usage for non-visible asset', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(false);
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.APPROVED };

      const result = await visibilityChecker.canLogPlatformUsage(mockContentCreator, asset);

      expect(result).toBe(false);
    });

    it('should not allow logging usage for non-APPROVED SEO asset', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);
      const asset = { ...mockAsset, uploadType: 'SEO' as any, status: AssetStatus.DRAFT };

      const result = await visibilityChecker.canLogPlatformUsage(mockContentCreator, asset);

      expect(result).toBe(false);
    });

    it('should allow logging usage for DOC asset regardless of status', async () => {
      mockVisibilityService.canUserViewAsset.mockResolvedValue(true);
      const asset = { ...mockAsset, uploadType: 'DOC' as any, status: AssetStatus.DRAFT };

      const result = await visibilityChecker.canLogPlatformUsage(mockContentCreator, asset);

      expect(result).toBe(true);
    });
  });
});
