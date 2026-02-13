/**
 * VisibilityService
 * 
 * Handles visibility rule evaluation for assets based on the 7 visibility levels:
 * - UPLOADER_ONLY: Only the uploader can view
 * - ADMIN_ONLY: Admin and uploader can view
 * - COMPANY: All users in the asset's company can view
 * - TEAM: All users in the asset's team can view
 * - ROLE: Users with specific role can view (via AssetShare)
 * - SELECTED_USERS: Only explicitly selected users can view (via AssetShare)
 * - PUBLIC: All authenticated users can view
 * 
 * Requirements: 6.1-6.9
 */

import { PrismaClient, VisibilityLevel, UserRole } from '@/app/generated/prisma';
import type { User, Asset } from '@/types';

export class VisibilityService {
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  /**
   * Check if a user can view an asset based on visibility rules
   * 
   * Requirement 13.3: Shared users must be able to access shared assets
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns true if the user can view the asset, false otherwise
   */
  async canUserViewAsset(user: User, asset: Asset): Promise<boolean> {
    // ADMIN users can ALWAYS view ALL assets regardless of visibility
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Users can ALWAYS see their own uploads
    if (user.id === asset.uploaderId) {
      return true;
    }

    // PUBLIC: All authenticated users can view
    if (asset.visibility === VisibilityLevel.PUBLIC) {
      return true;
    }

    // UPLOADER_ONLY: Only the uploader can view, OR users with explicit share access
    // Requirement 13.3: Include explicitly shared assets
    if (asset.visibility === VisibilityLevel.UPLOADER_ONLY) {
      // Check if asset is explicitly shared with this user
      return await this.checkAssetShare(user, asset);
    }

    // ADMIN_ONLY: Admin and uploader can view
    // Since we already checked for uploader and admin above, this should return false
    if (asset.visibility === VisibilityLevel.ADMIN_ONLY) {
      return false;
    }

    // COMPANY: All users in the asset's company can view
    if (asset.visibility === VisibilityLevel.COMPANY) {
      if (!asset.companyId || !user.companyId) {
        return false;
      }
      return user.companyId === asset.companyId;
    }

    // TEAM: All users in the asset's team can view
    // Note: Team functionality is not yet implemented in the schema
    // For now, we'll return false for TEAM visibility
    if (asset.visibility === VisibilityLevel.TEAM) {
      // TODO: Implement team-based visibility when team model is added
      return false;
    }

    // ROLE: Users with specific role can view (using allowedRole field)
    if (asset.visibility === VisibilityLevel.ROLE) {
      // Check if asset has allowedRole field and it matches user's role
      const assetWithRole = asset as any;
      if (assetWithRole.allowedRole) {
        return user.role === assetWithRole.allowedRole;
      }
      // Fallback to AssetShare for backward compatibility
      return await this.checkAssetShareForRole(user, asset);
    }

    // SELECTED_USERS: Only explicitly selected users can view (via AssetShare)
    if (asset.visibility === VisibilityLevel.SELECTED_USERS) {
      return await this.checkAssetShare(user, asset);
    }

    // Default deny
    return false;
  }

  /**
   * Check if a user has access to an asset via AssetShare records
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns true if the user has explicit share access, false otherwise
   */
  private async checkAssetShare(user: User, asset: Asset): Promise<boolean> {
    const share = await this.prisma.assetShare.findFirst({
      where: {
        assetId: asset.id,
        sharedWithId: user.id,
      },
    });

    return share !== null;
  }

  /**
   * Check if a user has access to an asset via role-based AssetShare records
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns true if the user's role matches the shared role, false otherwise
   */
  private async checkAssetShareForRole(user: User, asset: Asset): Promise<boolean> {
    const share = await this.prisma.assetShare.findFirst({
      where: {
        assetId: asset.id,
        targetType: 'ROLE',
        targetId: user.role,
      },
    });

    return share !== null;
  }

  /**
   * Get all assets visible to a user based on visibility rules
   * 
   * Requirement 13.3: Include explicitly shared assets in asset lists
   * 
   * @param user - The user requesting assets
   * @returns Array of asset IDs that the user can view
   */
  async getVisibleAssetIds(user: User): Promise<string[]> {
    const visibleAssets: string[] = [];

    // Get all PUBLIC assets
    const publicAssets = await this.prisma.asset.findMany({
      where: { visibility: VisibilityLevel.PUBLIC },
      select: { id: true },
    });
    visibleAssets.push(...publicAssets.map((a: { id: string }) => a.id));

    // Get all UPLOADER_ONLY assets where user is the uploader
    const uploaderAssets = await this.prisma.asset.findMany({
      where: {
        visibility: VisibilityLevel.UPLOADER_ONLY,
        uploaderId: user.id,
      },
      select: { id: true },
    });
    visibleAssets.push(...uploaderAssets.map((a: { id: string }) => a.id));

    // Get all UPLOADER_ONLY assets explicitly shared with the user (Requirement 13.3)
    const sharedUploaderOnlyAssets = await this.prisma.asset.findMany({
      where: {
        visibility: VisibilityLevel.UPLOADER_ONLY,
        AssetShare: {
          some: {
            sharedWithId: user.id,
          },
        },
      },
      select: { id: true },
    });
    visibleAssets.push(...sharedUploaderOnlyAssets.map((a: { id: string }) => a.id));

    // Get all ADMIN_ONLY assets if user is Admin or uploader
    if (user.role === UserRole.ADMIN) {
      const adminAssets = await this.prisma.asset.findMany({
        where: { visibility: VisibilityLevel.ADMIN_ONLY },
        select: { id: true },
      });
      visibleAssets.push(...adminAssets.map((a: { id: string }) => a.id));
    } else {
      // Non-admin users can see ADMIN_ONLY assets they uploaded
      const adminUploaderAssets = await this.prisma.asset.findMany({
        where: {
          visibility: VisibilityLevel.ADMIN_ONLY,
          uploaderId: user.id,
        },
        select: { id: true },
      });
      visibleAssets.push(...adminUploaderAssets.map((a: { id: string }) => a.id));
    }

    // Get all COMPANY assets if user has a company
    if (user.companyId) {
      const companyAssets = await this.prisma.asset.findMany({
        where: {
          visibility: VisibilityLevel.COMPANY,
          companyId: user.companyId,
        },
        select: { id: true },
      });
      visibleAssets.push(...companyAssets.map((a: { id: string }) => a.id));
    }

    // Get all ROLE assets where user's role matches
    const roleShares = await this.prisma.assetShare.findMany({
      where: {
        targetType: 'ROLE',
        targetId: user.role,
      },
      select: { assetId: true },
    });
    visibleAssets.push(...roleShares.map((s: { assetId: string }) => s.assetId));

    // Get all SELECTED_USERS assets where user is explicitly shared or is the uploader
    const selectedUsersAssets = await this.prisma.asset.findMany({
      where: {
        visibility: VisibilityLevel.SELECTED_USERS,
        OR: [
          { uploaderId: user.id },
          {
            AssetShare: {
              some: {
                sharedWithId: user.id,
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    visibleAssets.push(...selectedUsersAssets.map((a: { id: string }) => a.id));

    // Remove duplicates
    return [...new Set(visibleAssets)];
  }

  /**
   * Evaluate visibility for UPLOADER_ONLY level
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns true if user is the uploader, false otherwise
   */
  evaluateUploaderOnly(user: User, asset: Asset): boolean {
    return user.id === asset.uploaderId;
  }

  /**
   * Evaluate visibility for ADMIN_ONLY level
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns true if user is Admin or uploader, false otherwise
   */
  evaluateAdminOnly(user: User, asset: Asset): boolean {
    return user.role === UserRole.ADMIN || user.id === asset.uploaderId;
  }

  /**
   * Evaluate visibility for COMPANY level
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns true if user belongs to the asset's company, false otherwise
   */
  evaluateCompany(user: User, asset: Asset): boolean {
    if (!asset.companyId || !user.companyId) {
      return false;
    }
    return user.companyId === asset.companyId;
  }

  /**
   * Evaluate visibility for TEAM level
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns true if user belongs to the asset's team, false otherwise
   */
  evaluateTeam(user: User, asset: Asset): boolean {
    // TODO: Implement team-based visibility when team model is added
    // For now, return false as team functionality is not yet implemented
    return false;
  }

  /**
   * Evaluate visibility for ROLE level
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns Promise<boolean> true if user's role matches shared role, false otherwise
   */
  async evaluateRole(user: User, asset: Asset): Promise<boolean> {
    return await this.checkAssetShareForRole(user, asset);
  }

  /**
   * Evaluate visibility for SELECTED_USERS level
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns Promise<boolean> true if user is explicitly shared, false otherwise
   */
  async evaluateSelectedUsers(user: User, asset: Asset): Promise<boolean> {
    return await this.checkAssetShare(user, asset);
  }

  /**
   * Evaluate visibility for PUBLIC level
   * 
   * @returns true (all authenticated users can view)
   */
  evaluatePublic(): boolean {
    return true;
  }

  /**
   * Validate if a visibility level is supported
   * 
   * @param visibility - The visibility level to validate
   * @returns true if the visibility level is valid, false otherwise
   */
  isValidVisibilityLevel(visibility: string): boolean {
    return Object.values(VisibilityLevel).includes(visibility as VisibilityLevel);
  }

  /**
   * Get all supported visibility levels
   * 
   * @returns Array of all visibility levels
   */
  getAllVisibilityLevels(): VisibilityLevel[] {
    return Object.values(VisibilityLevel);
  }
}
