/**
 * VisibilityChecker
 * 
 * Provides comprehensive permission checking for assets including:
 * - canView: Check if user can view an asset
 * - canEdit: Check if user can edit an asset
 * - canDelete: Check if user can delete an asset
 * - canApprove: Check if user can approve/reject an asset
 * 
 * Also provides visibility-based filtering logic for asset lists.
 * 
 * Requirements: 6.2-6.6, 7.1-7.3, 7.5
 */

import { UserRole, AssetStatus } from '@/app/generated/prisma';
import type { User, Asset, VisibilityCheckResult } from '@/types';
import { VisibilityService } from './VisibilityService';

export class VisibilityChecker {
  private visibilityService: VisibilityService;

  constructor(visibilityService: VisibilityService) {
    this.visibilityService = visibilityService;
  }

  /**
   * Check if a user can view an asset
   * 
   * View permission is based on visibility rules evaluated by VisibilityService
   * 
   * @param user - The user attempting to view the asset
   * @param asset - The asset being accessed
   * @returns Promise<boolean> true if user can view, false otherwise
   */
  async canView(user: User, asset: Asset): Promise<boolean> {
    return await this.visibilityService.canUserViewAsset(user, asset);
  }

  /**
   * Check if a user can edit an asset
   * 
   * Edit permission rules:
   * - Admin can edit any asset
   * - Uploader can edit their own assets if status is DRAFT or REJECTED
   * - No one else can edit
   * 
   * @param user - The user attempting to edit the asset
   * @param asset - The asset being edited
   * @returns boolean true if user can edit, false otherwise
   */
  canEdit(user: User, asset: Asset): boolean {
    // Admin can edit any asset
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Uploader can edit their own assets if status is DRAFT or REJECTED
    if (user.id === asset.uploaderId) {
      return asset.status === AssetStatus.DRAFT || asset.status === AssetStatus.REJECTED;
    }

    // No one else can edit
    return false;
  }

  /**
   * Check if a user can delete an asset
   * 
   * Delete permission rules:
   * - Admin can delete any asset
   * - Uploader can delete their own assets if status is DRAFT or REJECTED
   * - No one else can delete
   * 
   * @param user - The user attempting to delete the asset
   * @param asset - The asset being deleted
   * @returns boolean true if user can delete, false otherwise
   */
  canDelete(user: User, asset: Asset): boolean {
    // Admin can delete any asset
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Uploader can delete their own assets if status is DRAFT or REJECTED
    if (user.id === asset.uploaderId) {
      return asset.status === AssetStatus.DRAFT || asset.status === AssetStatus.REJECTED;
    }

    // No one else can delete
    return false;
  }

  /**
   * Check if a user can approve or reject an asset
   * 
   * Approval permission rules:
   * - Only Admin can approve/reject assets
   * - Asset must have uploadType = SEO
   * - Asset must have status = PENDING_REVIEW
   * 
   * @param user - The user attempting to approve/reject the asset
   * @param asset - The asset being approved/rejected
   * @returns boolean true if user can approve, false otherwise
   */
  canApprove(user: User, asset: Asset): boolean {
    // Only Admin can approve/reject
    if (user.role !== UserRole.ADMIN) {
      return false;
    }

    // Asset must be SEO type and in PENDING_REVIEW status
    return asset.uploadType === 'SEO' && asset.status === AssetStatus.PENDING_REVIEW;
  }

  /**
   * Get comprehensive permission check result for a user and asset
   * 
   * @param user - The user to check permissions for
   * @param asset - The asset to check permissions against
   * @returns Promise<VisibilityCheckResult> object with all permission flags
   */
  async checkAllPermissions(user: User, asset: Asset): Promise<VisibilityCheckResult> {
    const canView = await this.canView(user, asset);
    const canEdit = this.canEdit(user, asset);
    const canDelete = this.canDelete(user, asset);
    const canApprove = this.canApprove(user, asset);

    let reason: string | undefined;
    if (!canView) {
      reason = 'User does not have permission to view this asset';
    } else if (!canEdit && !canDelete && !canApprove) {
      reason = 'User has view-only access to this asset';
    }

    return {
      canView,
      canEdit,
      canDelete,
      canApprove,
      reason,
    };
  }

  /**
   * Filter a list of assets to only include those visible to the user
   * 
   * This method checks each asset against the user's visibility permissions
   * and returns only the assets the user can view.
   * 
   * @param user - The user requesting assets
   * @param assets - Array of assets to filter
   * @returns Promise<Asset[]> filtered array of visible assets
   */
  async filterVisibleAssets(user: User, assets: Asset[]): Promise<Asset[]> {
    const visibleAssets: Asset[] = [];

    for (const asset of assets) {
      const canView = await this.canView(user, asset);
      if (canView) {
        visibleAssets.push(asset);
      }
    }

    return visibleAssets;
  }

  /**
   * Get asset IDs that are visible to a user
   * 
   * This is a convenience method that delegates to VisibilityService
   * for efficient bulk visibility checking.
   * 
   * @param user - The user requesting asset IDs
   * @returns Promise<string[]> array of visible asset IDs
   */
  async getVisibleAssetIds(user: User): Promise<string[]> {
    return await this.visibilityService.getVisibleAssetIds(user);
  }

  /**
   * Check if a user can download an asset
   * 
   * Download permission is the same as view permission
   * 
   * @param user - The user attempting to download the asset
   * @param asset - The asset being downloaded
   * @returns Promise<boolean> true if user can download, false otherwise
   */
  async canDownload(user: User, asset: Asset): Promise<boolean> {
    return await this.canView(user, asset);
  }

  /**
   * Check if a user can share an asset
   * 
   * Share permission rules:
   * - Only the uploader can share their own assets
   * - Asset must have visibility = UPLOADER_ONLY or SELECTED_USERS
   * - Admin cannot share other users' private assets
   * 
   * @param user - The user attempting to share the asset
   * @param asset - The asset being shared
   * @returns boolean true if user can share, false otherwise
   */
  canShare(user: User, asset: Asset): boolean {
    // Only uploader can share their own assets
    if (user.id !== asset.uploaderId) {
      return false;
    }

    // Can only share UPLOADER_ONLY or SELECTED_USERS assets
    return asset.visibility === 'UPLOADER_ONLY' || asset.visibility === 'SELECTED_USERS';
  }

  /**
   * Check if a user can modify visibility of an asset
   * 
   * Visibility modification rules:
   * - Admin can modify visibility of any SEO asset
   * - Uploader cannot modify visibility (only Admin can)
   * - Doc assets cannot have visibility modified (always UPLOADER_ONLY)
   * 
   * @param user - The user attempting to modify visibility
   * @param asset - The asset whose visibility is being modified
   * @returns boolean true if user can modify visibility, false otherwise
   */
  canModifyVisibility(user: User, asset: Asset): boolean {
    // Only Admin can modify visibility
    if (user.role !== UserRole.ADMIN) {
      return false;
    }

    // Can only modify visibility of SEO assets
    return asset.uploadType === 'SEO';
  }

  /**
   * Filter assets based on role-specific rules
   * 
   * Role-based filtering rules:
   * - Content_Creator: Own uploads (all statuses) + explicitly shared assets
   * - SEO_Specialist: Own uploads (all statuses) + APPROVED assets they have permission to see
   * - Admin: ALL assets regardless of type, status, or visibility (full admin access)
   * 
   * Requirements: 7.1, 7.2, 7.3
   * 
   * @param user - The user requesting assets
   * @param assets - Array of assets to filter
   * @returns Promise<Asset[]> filtered array based on role rules
   */
  async filterAssetsByRole(user: User, assets: Asset[]): Promise<Asset[]> {
    const filteredAssets: Asset[] = [];

    for (const asset of assets) {
      // Admin can see ALL assets (full access)
      if (user.role === UserRole.ADMIN) {
        filteredAssets.push(asset);
        continue;
      }

      // Users can ALWAYS see their own uploads regardless of status
      if (asset.uploaderId === user.id) {
        filteredAssets.push(asset);
        continue;
      }

      // Check basic visibility for assets uploaded by others
      const canView = await this.canView(user, asset);
      if (!canView) {
        continue;
      }

      // Apply role-specific rules for assets uploaded by others
      if (user.role === UserRole.CONTENT_CREATOR) {
        // Content_Creator: Own uploads (already handled above) + explicitly shared assets
        // (visibility check already handles this)
        filteredAssets.push(asset);
      } else if (user.role === UserRole.SEO_SPECIALIST) {
        // SEO_Specialist: Own uploads (already handled above) + Only APPROVED assets they have permission to see
        if (asset.status === AssetStatus.APPROVED) {
          filteredAssets.push(asset);
        }
      }
    }

    return filteredAssets;
  }

  /**
   * Check if a user can log platform usage for an asset
   * 
   * Platform usage logging rules:
   * - User must be able to view the asset
   * - Asset must be APPROVED (for SEO assets)
   * 
   * @param user - The user attempting to log platform usage
   * @param asset - The asset for which usage is being logged
   * @returns Promise<boolean> true if user can log usage, false otherwise
   */
  async canLogPlatformUsage(user: User, asset: Asset): Promise<boolean> {
    // Must be able to view the asset
    const canView = await this.canView(user, asset);
    if (!canView) {
      return false;
    }

    // SEO assets must be APPROVED
    if (asset.uploadType === 'SEO' && asset.status !== AssetStatus.APPROVED) {
      return false;
    }

    return true;
  }
}
