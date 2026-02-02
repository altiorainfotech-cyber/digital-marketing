/**
 * ShareManager
 * 
 * Manages asset sharing operations including:
 * - Sharing assets with specific users
 * - Revoking asset shares
 * - Creating AssetShare records
 * 
 * Requirements: 13.1-13.5
 * 
 * Key Features:
 * - Share Doc assets with specific users
 * - Revoke sharing access
 * - Validate sharing permissions
 * - Integrate with AuditService for logging
 * - Support notification on share
 */

import { PrismaClient } from '@/app/generated/prisma';
import { User, Asset, VisibilityLevel } from '@/types';
import { AuditService } from './AuditService';
import { NotificationService } from './NotificationService';

export interface ShareAssetParams {
  assetId: string;
  sharedById: string;
  sharedWithIds: string[];
  targetType?: 'USER' | 'ROLE' | 'TEAM';
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RevokeShareParams {
  assetId: string;
  sharedById: string;
  sharedWithId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AssetShareResult {
  id: string;
  assetId: string;
  sharedById: string;
  sharedWithId: string;
  targetType?: string;
  targetId?: string;
  createdAt: Date;
}

export class ShareManager {
  private prisma: PrismaClient;
  private auditService: AuditService;
  private notificationService: NotificationService;

  constructor(
    prisma: PrismaClient,
    auditService: AuditService,
    notificationService: NotificationService
  ) {
    this.prisma = prisma;
    this.auditService = auditService;
    this.notificationService = notificationService;
  }

  /**
   * Share an asset with specific users
   * 
   * Requirements:
   * - 13.1: Allow selection of specific users
   * - 13.2: Create AssetShare records for each recipient
   * - 13.5: Log sharing action in audit log
   * - 16.3: Create notification for recipient
   * 
   * Validation:
   * - Asset must exist
   * - Sharer must be the uploader
   * - Asset must have visibility = UPLOADER_ONLY or SELECTED_USERS
   * - Recipients must exist
   * - Cannot share with self
   * 
   * @param params - Share asset parameters
   * @returns Array of created AssetShare records
   * @throws Error if validation fails
   */
  async shareAsset(params: ShareAssetParams): Promise<AssetShareResult[]> {
    const {
      assetId,
      sharedById,
      sharedWithIds,
      targetType,
      targetId,
      ipAddress,
      userAgent,
    } = params;

    // Validate inputs
    if (!assetId || !sharedById || !sharedWithIds || sharedWithIds.length === 0) {
      throw new Error('Asset ID, sharer ID, and at least one recipient are required');
    }

    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        uploaderId: true,
        visibility: true,
        uploadType: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Validate sharer is the uploader (Requirement 13.1)
    if (asset.uploaderId !== sharedById) {
      throw new Error('Only the uploader can share this asset');
    }

    // Validate asset visibility (can only share UPLOADER_ONLY or SELECTED_USERS assets)
    if (asset.visibility !== VisibilityLevel.UPLOADER_ONLY && asset.visibility !== VisibilityLevel.SELECTED_USERS) {
      throw new Error('Can only share assets with UPLOADER_ONLY or SELECTED_USERS visibility');
    }

    // Verify sharer exists
    const sharer = await this.prisma.user.findUnique({
      where: { id: sharedById },
      select: { id: true, name: true },
    });

    if (!sharer) {
      throw new Error('Sharer not found');
    }

    // Verify all recipients exist
    const recipients = await this.prisma.user.findMany({
      where: {
        id: { in: sharedWithIds },
      },
      select: { id: true, name: true },
    });

    if (recipients.length !== sharedWithIds.length) {
      throw new Error('One or more recipients not found');
    }

    // Validate not sharing with self
    if (sharedWithIds.includes(sharedById)) {
      throw new Error('Cannot share asset with yourself');
    }

    // If asset visibility is UPLOADER_ONLY, update it to SELECTED_USERS
    if (asset.visibility === VisibilityLevel.UPLOADER_ONLY) {
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { visibility: VisibilityLevel.SELECTED_USERS },
      });

      // Log visibility change
      await this.auditService.logVisibilityChange(
        sharedById,
        assetId,
        {
          previousValue: VisibilityLevel.UPLOADER_ONLY,
          newValue: VisibilityLevel.SELECTED_USERS,
          reason: 'Asset shared with users',
        },
        ipAddress,
        userAgent
      );
    }

    // Create AssetShare records for each recipient (Requirement 13.2)
    const shares: AssetShareResult[] = [];

    for (const recipientId of sharedWithIds) {
      // Check if share already exists
      const existingShare = await this.prisma.assetShare.findUnique({
        where: {
          assetId_sharedWithId: {
            assetId,
            sharedWithId: recipientId,
          },
        },
      });

      if (existingShare) {
        // Skip if already shared
        shares.push({
          id: existingShare.id,
          assetId: existingShare.assetId,
          sharedById: existingShare.sharedById,
          sharedWithId: existingShare.sharedWithId,
          targetType: existingShare.targetType || undefined,
          targetId: existingShare.targetId || undefined,
          createdAt: existingShare.createdAt,
        });
        continue;
      }

      // Create new share
      const share = await this.prisma.assetShare.create({
        data: {
          assetId,
          sharedById,
          sharedWithId: recipientId,
          targetType: targetType || null,
          targetId: targetId || null,
        },
        select: {
          id: true,
          assetId: true,
          sharedById: true,
          sharedWithId: true,
          targetType: true,
          targetId: true,
          createdAt: true,
        },
      });

      shares.push({
        id: share.id,
        assetId: share.assetId,
        sharedById: share.sharedById,
        sharedWithId: share.sharedWithId,
        targetType: share.targetType || undefined,
        targetId: share.targetId || undefined,
        createdAt: share.createdAt,
      });

      // Create notification for recipient (Requirement 16.3)
      const recipient = recipients.find((r) => r.id === recipientId);
      if (recipient) {
        await this.notificationService.createNotification({
          userId: recipientId,
          type: 'ASSET_SHARED',
          title: 'Asset Shared With You',
          message: `${sharer.name} shared "${asset.title}" with you`,
          relatedResourceType: 'ASSET',
          relatedResourceId: assetId,
        });
      }
    }

    // Log sharing action in audit log (Requirement 13.5)
    await this.auditService.logAssetShare(
      sharedById,
      assetId,
      {
        sharedWithIds,
        sharedWithCount: shares.length,
        targetType,
        targetId,
      },
      ipAddress,
      userAgent
    );

    return shares;
  }

  /**
   * Revoke asset sharing for a specific user
   * 
   * Requirements:
   * - 13.4: Remove AssetShare record
   * - 13.5: Log revocation in audit log
   * 
   * Validation:
   * - Asset must exist
   * - Revoker must be the uploader
   * - Share must exist
   * 
   * @param params - Revoke share parameters
   * @throws Error if validation fails
   */
  async revokeShare(params: RevokeShareParams): Promise<void> {
    const {
      assetId,
      sharedById,
      sharedWithId,
      ipAddress,
      userAgent,
    } = params;

    // Validate inputs
    if (!assetId || !sharedById || !sharedWithId) {
      throw new Error('Asset ID, sharer ID, and recipient ID are required');
    }

    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        uploaderId: true,
        visibility: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Validate revoker is the uploader
    if (asset.uploaderId !== sharedById) {
      throw new Error('Only the uploader can revoke sharing');
    }

    // Check if share exists
    const share = await this.prisma.assetShare.findUnique({
      where: {
        assetId_sharedWithId: {
          assetId,
          sharedWithId,
        },
      },
    });

    if (!share) {
      throw new Error('Share not found');
    }

    // Delete the share record (Requirement 13.4)
    await this.prisma.assetShare.delete({
      where: {
        assetId_sharedWithId: {
          assetId,
          sharedWithId,
        },
      },
    });

    // Check if there are any remaining shares
    const remainingShares = await this.prisma.assetShare.count({
      where: { assetId },
    });

    // If no more shares and visibility is SELECTED_USERS, revert to UPLOADER_ONLY
    if (remainingShares === 0 && asset.visibility === VisibilityLevel.SELECTED_USERS) {
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { visibility: VisibilityLevel.UPLOADER_ONLY },
      });

      // Log visibility change
      await this.auditService.logVisibilityChange(
        sharedById,
        assetId,
        {
          previousValue: VisibilityLevel.SELECTED_USERS,
          newValue: VisibilityLevel.UPLOADER_ONLY,
          reason: 'All shares revoked',
        },
        ipAddress,
        userAgent
      );
    }

    // Log revocation in audit log (Requirement 13.5)
    await this.auditService.logAssetShare(
      sharedById,
      assetId,
      {
        action: 'revoke',
        revokedFromUserId: sharedWithId,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Get all shares for an asset
   * 
   * @param assetId - ID of the asset
   * @returns Array of AssetShare records
   */
  async getAssetShares(assetId: string): Promise<AssetShareResult[]> {
    const shares = await this.prisma.assetShare.findMany({
      where: { assetId },
      select: {
        id: true,
        assetId: true,
        sharedById: true,
        sharedWithId: true,
        targetType: true,
        targetId: true,
        createdAt: true,
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return shares.map((share) => ({
      id: share.id,
      assetId: share.assetId,
      sharedById: share.sharedById,
      sharedWithId: share.sharedWithId,
      targetType: share.targetType || undefined,
      targetId: share.targetId || undefined,
      createdAt: share.createdAt,
    }));
  }

  /**
   * Get all assets shared with a user
   * 
   * Requirement 13.3: Shared users must be able to access shared assets
   * 
   * @param userId - ID of the user
   * @returns Array of asset IDs shared with the user
   */
  async getSharedAssetIds(userId: string): Promise<string[]> {
    const shares = await this.prisma.assetShare.findMany({
      where: { sharedWithId: userId },
      select: { assetId: true },
    });

    return shares.map((share) => share.assetId);
  }

  /**
   * Check if an asset is shared with a user
   * 
   * @param assetId - ID of the asset
   * @param userId - ID of the user
   * @returns true if asset is shared with user, false otherwise
   */
  async isAssetSharedWithUser(assetId: string, userId: string): Promise<boolean> {
    const share = await this.prisma.assetShare.findUnique({
      where: {
        assetId_sharedWithId: {
          assetId,
          sharedWithId: userId,
        },
      },
    });

    return share !== null;
  }
}
