/**
 * Permission Checker Service
 * 
 * Implements role-based and asset-level permission verification
 * for the DASCMS application.
 * 
 * Requirements: 11.2, 11.3
 */

import { UserRole, VisibilityLevel, AssetStatus } from '@/app/generated/prisma';
import { prisma } from '@/lib/prisma';
import type { Action, VisibilityCheckResult } from '@/types';

/**
 * User context for permission checks
 */
export interface PermissionUser {
  id: string;
  role: UserRole;
  companyId?: string;
}

/**
 * Asset context for permission checks
 */
export interface PermissionAsset {
  id: string;
  uploaderId: string;
  visibility: VisibilityLevel;
  status: AssetStatus;
  uploadType: string;
  companyId?: string;
}

/**
 * PermissionChecker class
 * 
 * Provides methods to verify user permissions for various actions
 * on assets based on role and visibility rules.
 */
export class PermissionChecker {
  /**
   * Check if a user can view an asset
   * 
   * Implements Property 5: Visibility-Based Access Control
   * Implements Property 6: Role-Based Asset Filtering
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns true if user can view the asset
   */
  async canView(
    user: PermissionUser,
    asset: PermissionAsset
  ): Promise<boolean> {
    // PUBLIC assets are visible to all authenticated users
    if (asset.visibility === VisibilityLevel.PUBLIC) {
      return true;
    }

    // UPLOADER_ONLY assets are only visible to the uploader
    if (asset.visibility === VisibilityLevel.UPLOADER_ONLY) {
      return user.id === asset.uploaderId;
    }

    // ADMIN_ONLY assets are visible to Admin and uploader
    if (asset.visibility === VisibilityLevel.ADMIN_ONLY) {
      return user.role === UserRole.ADMIN || user.id === asset.uploaderId;
    }

    // COMPANY assets are visible to all users in that company
    if (asset.visibility === VisibilityLevel.COMPANY) {
      // Must have a company and it must match the asset's company
      return !!user.companyId && user.companyId === asset.companyId;
    }

    // TEAM assets are visible to all users in that team
    // Note: Team functionality not yet implemented in schema
    if (asset.visibility === VisibilityLevel.TEAM) {
      // TODO: Implement team-based visibility when team model is added
      return false;
    }

    // ROLE assets are visible to users with specific roles via AssetShare
    if (asset.visibility === VisibilityLevel.ROLE) {
      return await this.checkAssetShareForRole(user, asset);
    }

    // SELECTED_USERS assets are visible to explicitly selected users
    if (asset.visibility === VisibilityLevel.SELECTED_USERS) {
      return await this.checkAssetShare(user, asset);
    }

    // Default deny
    return false;
  }

  /**
   * Check if a user can edit an asset
   * 
   * Edit permissions:
   * - Uploader can edit their own assets
   * - Admin can edit any asset
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns true if user can edit the asset
   */
  canEdit(user: PermissionUser, asset: PermissionAsset): boolean {
    // Admin can edit any asset
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Uploader can edit their own assets
    return user.id === asset.uploaderId;
  }

  /**
   * Check if a user can delete an asset
   * 
   * Delete permissions:
   * - Uploader can delete their own assets
   * - Admin can delete any asset
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns true if user can delete the asset
   */
  canDelete(user: PermissionUser, asset: PermissionAsset): boolean {
    // Admin can delete any asset
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Uploader can delete their own assets
    return user.id === asset.uploaderId;
  }

  /**
   * Check if a user can approve/reject an asset
   * 
   * Approval permissions:
   * - Only Admin can approve/reject assets
   * - Asset must be in PENDING_REVIEW status
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns true if user can approve the asset
   */
  canApprove(user: PermissionUser, asset: PermissionAsset): boolean {
    // Only Admin can approve
    if (user.role !== UserRole.ADMIN) {
      return false;
    }

    // Asset must be in PENDING_REVIEW status
    return asset.status === AssetStatus.PENDING_REVIEW;
  }

  /**
   * Check if a user can download an asset
   * 
   * Download permissions are the same as view permissions
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns true if user can download the asset
   */
  async canDownload(
    user: PermissionUser,
    asset: PermissionAsset
  ): Promise<boolean> {
    // Download permission is same as view permission
    return await this.canView(user, asset);
  }

  /**
   * Check all permissions for a user on an asset
   * 
   * Returns a comprehensive permission check result
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns VisibilityCheckResult with all permission flags
   */
  async checkAllPermissions(
    user: PermissionUser,
    asset: PermissionAsset
  ): Promise<VisibilityCheckResult> {
    const canView = await this.canView(user, asset);
    const canEdit = this.canEdit(user, asset);
    const canDelete = this.canDelete(user, asset);
    const canApprove = this.canApprove(user, asset);

    return {
      canView,
      canEdit,
      canDelete,
      canApprove,
      reason: !canView ? 'Insufficient permissions to view this asset' : undefined,
    };
  }

  /**
   * Check if user has access via AssetShare for SELECTED_USERS visibility
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns true if user has explicit share access
   */
  private async checkAssetShare(
    user: PermissionUser,
    asset: PermissionAsset
  ): Promise<boolean> {
    try {
      const share = await prisma.assetShare.findFirst({
        where: {
          assetId: asset.id,
          sharedWithId: user.id,
        },
      });

      return !!share;
    } catch (error) {
      console.error('Error checking asset share:', error);
      return false;
    }
  }

  /**
   * Check if user has access via AssetShare for ROLE visibility
   * 
   * @param user - User requesting access
   * @param asset - Asset to check access for
   * @returns true if user's role matches the shared role
   */
  private async checkAssetShareForRole(
    user: PermissionUser,
    asset: PermissionAsset
  ): Promise<boolean> {
    try {
      const share = await prisma.assetShare.findFirst({
        where: {
          assetId: asset.id,
          targetType: 'ROLE',
          targetId: user.role,
        },
      });

      return !!share;
    } catch (error) {
      console.error('Error checking asset share for role:', error);
      return false;
    }
  }

  /**
   * Filter assets based on user permissions
   * 
   * Implements Property 6: Role-Based Asset Filtering
   * 
   * This method returns a Prisma where clause that can be used to filter
   * assets based on the user's role and permissions.
   * 
   * @param user - User requesting access
   * @returns Prisma where clause for filtering assets
   */
  getAssetFilterForUser(user: PermissionUser) {
    // Admin can see all SEO assets but not UPLOADER_ONLY Doc assets
    if (user.role === UserRole.ADMIN) {
      return {
        OR: [
          // All SEO assets
          { uploadType: 'SEO' },
          // Doc assets uploaded by the admin
          {
            uploadType: 'DOC',
            uploaderId: user.id,
          },
          // Doc assets explicitly shared with the admin
          {
            uploadType: 'DOC',
            shares: {
              some: {
                sharedWithId: user.id,
              },
            },
          },
        ],
      };
    }

    // SEO_Specialist can only see APPROVED assets they have permission to see
    if (user.role === UserRole.SEO_SPECIALIST) {
      return {
        AND: [
          // Must be approved
          { status: AssetStatus.APPROVED },
          // Must have permission based on visibility
          {
            OR: [
              // Public assets
              { visibility: VisibilityLevel.PUBLIC },
              // Company assets (if user has company)
              ...(user.companyId
                ? [
                    {
                      visibility: VisibilityLevel.COMPANY,
                      companyId: user.companyId,
                    },
                  ]
                : []),
              // Assets shared with this user
              {
                shares: {
                  some: {
                    sharedWithId: user.id,
                  },
                },
              },
              // Assets shared with SEO_SPECIALIST role
              {
                visibility: VisibilityLevel.ROLE,
                shares: {
                  some: {
                    targetType: 'ROLE',
                    targetId: UserRole.SEO_SPECIALIST,
                  },
                },
              },
            ],
          },
        ],
      };
    }

    // Content_Creator can see their own uploads and assets shared with them
    if (user.role === UserRole.CONTENT_CREATOR) {
      return {
        OR: [
          // Own uploads
          { uploaderId: user.id },
          // Assets explicitly shared with them
          {
            shares: {
              some: {
                sharedWithId: user.id,
              },
            },
          },
          // Public assets
          { visibility: VisibilityLevel.PUBLIC },
          // Company assets (if user has company)
          ...(user.companyId
            ? [
                {
                  visibility: VisibilityLevel.COMPANY,
                  companyId: user.companyId,
                },
              ]
            : []),
        ],
      };
    }

    // Default: no access
    return {
      id: 'impossible-id-no-access',
    };
  }

  /**
   * Check if user has a specific role
   * 
   * @param user - User to check
   * @param role - Role to check for
   * @returns true if user has the specified role
   */
  hasRole(user: PermissionUser, role: UserRole): boolean {
    return user.role === role;
  }

  /**
   * Check if user has any of the specified roles
   * 
   * @param user - User to check
   * @param roles - Array of roles to check for
   * @returns true if user has any of the specified roles
   */
  hasAnyRole(user: PermissionUser, roles: UserRole[]): boolean {
    return roles.includes(user.role);
  }

  /**
   * Check if user is an admin
   * 
   * @param user - User to check
   * @returns true if user is an admin
   */
  isAdmin(user: PermissionUser): boolean {
    return user.role === UserRole.ADMIN;
  }

  /**
   * Check if user is a content creator
   * 
   * @param user - User to check
   * @returns true if user is a content creator
   */
  isContentCreator(user: PermissionUser): boolean {
    return user.role === UserRole.CONTENT_CREATOR;
  }

  /**
   * Check if user is an SEO specialist
   * 
   * @param user - User to check
   * @returns true if user is an SEO specialist
   */
  isSEOSpecialist(user: PermissionUser): boolean {
    return user.role === UserRole.SEO_SPECIALIST;
  }
}

/**
 * Singleton instance of PermissionChecker
 */
export const permissionChecker = new PermissionChecker();
