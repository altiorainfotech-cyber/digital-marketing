/**
 * VisibilityService Unit Tests
 * 
 * Tests for visibility rule evaluation across all 7 visibility levels
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisibilityService } from '../VisibilityService';
import { VisibilityLevel, UserRole } from '@/app/generated/prisma';
import type { User, Asset } from '@/types';

// Mock Prisma Client
const mockPrisma = {
  assetShare: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  asset: {
    findMany: vi.fn(),
  },
};

describe('VisibilityService', () => {
  let visibilityService: VisibilityService;

  beforeEach(() => {
    vi.clearAllMocks();
    visibilityService = new VisibilityService(mockPrisma as any);
  });

  describe('canUserViewAsset', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      role: UserRole.CONTENT_CREATOR,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAsset: Asset = {
      id: 'asset-1',
      title: 'Test Asset',
      assetType: 'IMAGE' as any,
      uploadType: 'SEO' as any,
      status: 'DRAFT' as any,
      visibility: VisibilityLevel.PUBLIC,
      uploaderId: 'uploader-1',
      storageUrl: 'https://example.com/asset',
      uploadedAt: new Date(),
    };

    it('should allow all authenticated users to view PUBLIC assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.PUBLIC };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(true);
    });

    it('should only allow uploader to view UPLOADER_ONLY assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.UPLOADER_ONLY, uploaderId: 'user-1' };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(true);
    });

    it('should deny non-uploader access to UPLOADER_ONLY assets', async () => {
      // Mock no share exists
      mockPrisma.assetShare.findFirst.mockResolvedValue(null);
      
      const asset = { ...mockAsset, visibility: VisibilityLevel.UPLOADER_ONLY, uploaderId: 'other-user' };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(false);
    });

    it('should allow Admin to view ADMIN_ONLY assets', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      const asset = { ...mockAsset, visibility: VisibilityLevel.ADMIN_ONLY };
      const result = await visibilityService.canUserViewAsset(adminUser, asset);
      expect(result).toBe(true);
    });

    it('should allow uploader to view ADMIN_ONLY assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.ADMIN_ONLY, uploaderId: 'user-1' };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(true);
    });

    it('should deny non-admin, non-uploader access to ADMIN_ONLY assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.ADMIN_ONLY, uploaderId: 'other-user' };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(false);
    });

    it('should allow users in the same company to view COMPANY assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.COMPANY, companyId: 'company-1' };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(true);
    });

    it('should deny users from different companies access to COMPANY assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.COMPANY, companyId: 'company-2' };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(false);
    });

    it('should deny access to COMPANY assets when user has no company', async () => {
      const userNoCompany = { ...mockUser, companyId: undefined };
      const asset = { ...mockAsset, visibility: VisibilityLevel.COMPANY, companyId: 'company-1' };
      const result = await visibilityService.canUserViewAsset(userNoCompany, asset);
      expect(result).toBe(false);
    });

    it('should deny access to COMPANY assets when asset has no company', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.COMPANY, companyId: undefined };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(false);
    });

    it('should return false for TEAM visibility (not yet implemented)', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.TEAM };
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(false);
    });

    it('should allow users with matching role to view ROLE assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.ROLE };
      mockPrisma.assetShare.findFirst.mockResolvedValue({
        id: 'share-1',
        assetId: 'asset-1',
        targetType: 'ROLE',
        targetId: UserRole.CONTENT_CREATOR,
      });
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(true);
      expect(mockPrisma.assetShare.findFirst).toHaveBeenCalledWith({
        where: {
          assetId: 'asset-1',
          targetType: 'ROLE',
          targetId: UserRole.CONTENT_CREATOR,
        },
      });
    });

    it('should deny users without matching role access to ROLE assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.ROLE };
      mockPrisma.assetShare.findFirst.mockResolvedValue(null);
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(false);
    });

    it('should allow explicitly selected users to view SELECTED_USERS assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.SELECTED_USERS };
      mockPrisma.assetShare.findFirst.mockResolvedValue({
        id: 'share-1',
        assetId: 'asset-1',
        sharedWithId: 'user-1',
      });
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(true);
      expect(mockPrisma.assetShare.findFirst).toHaveBeenCalledWith({
        where: {
          assetId: 'asset-1',
          sharedWithId: 'user-1',
        },
      });
    });

    it('should deny non-selected users access to SELECTED_USERS assets', async () => {
      const asset = { ...mockAsset, visibility: VisibilityLevel.SELECTED_USERS };
      mockPrisma.assetShare.findFirst.mockResolvedValue(null);
      const result = await visibilityService.canUserViewAsset(mockUser, asset);
      expect(result).toBe(false);
    });
  });

  describe('evaluateUploaderOnly', () => {
    it('should return true when user is the uploader', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.UPLOADER_ONLY,
        uploaderId: 'user-1',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateUploaderOnly(user, asset)).toBe(true);
    });

    it('should return false when user is not the uploader', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.UPLOADER_ONLY,
        uploaderId: 'other-user',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateUploaderOnly(user, asset)).toBe(false);
    });
  });

  describe('evaluateAdminOnly', () => {
    it('should return true when user is Admin', () => {
      const user: User = {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.ADMIN_ONLY,
        uploaderId: 'other-user',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateAdminOnly(user, asset)).toBe(true);
    });

    it('should return true when user is the uploader', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.ADMIN_ONLY,
        uploaderId: 'user-1',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateAdminOnly(user, asset)).toBe(true);
    });

    it('should return false when user is neither Admin nor uploader', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.ADMIN_ONLY,
        uploaderId: 'other-user',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateAdminOnly(user, asset)).toBe(false);
    });
  });

  describe('evaluateCompany', () => {
    it('should return true when user and asset belong to the same company', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.COMPANY,
        uploaderId: 'other-user',
        companyId: 'company-1',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateCompany(user, asset)).toBe(true);
    });

    it('should return false when user and asset belong to different companies', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.COMPANY,
        uploaderId: 'other-user',
        companyId: 'company-2',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateCompany(user, asset)).toBe(false);
    });

    it('should return false when user has no company', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.COMPANY,
        uploaderId: 'other-user',
        companyId: 'company-1',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateCompany(user, asset)).toBe(false);
    });

    it('should return false when asset has no company', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.COMPANY,
        uploaderId: 'other-user',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateCompany(user, asset)).toBe(false);
    });
  });

  describe('evaluateTeam', () => {
    it('should return false (team functionality not yet implemented)', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CONTENT_CREATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const asset: Asset = {
        id: 'asset-1',
        title: 'Test Asset',
        assetType: 'IMAGE' as any,
        uploadType: 'SEO' as any,
        status: 'DRAFT' as any,
        visibility: VisibilityLevel.TEAM,
        uploaderId: 'other-user',
        storageUrl: 'https://example.com/asset',
        uploadedAt: new Date(),
      };
      expect(visibilityService.evaluateTeam(user, asset)).toBe(false);
    });
  });

  describe('evaluatePublic', () => {
    it('should always return true', () => {
      expect(visibilityService.evaluatePublic()).toBe(true);
    });
  });

  describe('isValidVisibilityLevel', () => {
    it('should return true for valid visibility levels', () => {
      expect(visibilityService.isValidVisibilityLevel('PUBLIC')).toBe(true);
      expect(visibilityService.isValidVisibilityLevel('UPLOADER_ONLY')).toBe(true);
      expect(visibilityService.isValidVisibilityLevel('ADMIN_ONLY')).toBe(true);
      expect(visibilityService.isValidVisibilityLevel('COMPANY')).toBe(true);
      expect(visibilityService.isValidVisibilityLevel('TEAM')).toBe(true);
      expect(visibilityService.isValidVisibilityLevel('ROLE')).toBe(true);
      expect(visibilityService.isValidVisibilityLevel('SELECTED_USERS')).toBe(true);
    });

    it('should return false for invalid visibility levels', () => {
      expect(visibilityService.isValidVisibilityLevel('INVALID')).toBe(false);
      expect(visibilityService.isValidVisibilityLevel('public')).toBe(false);
      expect(visibilityService.isValidVisibilityLevel('')).toBe(false);
    });
  });

  describe('getAllVisibilityLevels', () => {
    it('should return all 7 visibility levels', () => {
      const levels = visibilityService.getAllVisibilityLevels();
      expect(levels).toHaveLength(7);
      expect(levels).toContain(VisibilityLevel.UPLOADER_ONLY);
      expect(levels).toContain(VisibilityLevel.ADMIN_ONLY);
      expect(levels).toContain(VisibilityLevel.COMPANY);
      expect(levels).toContain(VisibilityLevel.TEAM);
      expect(levels).toContain(VisibilityLevel.ROLE);
      expect(levels).toContain(VisibilityLevel.SELECTED_USERS);
      expect(levels).toContain(VisibilityLevel.PUBLIC);
    });
  });
});
