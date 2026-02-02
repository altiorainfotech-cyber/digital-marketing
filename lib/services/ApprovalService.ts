/**
 * ApprovalService
 * 
 * Manages asset approval and rejection workflow.
 * Handles status transitions, timestamps, and rejection reasons.
 * 
 * Requirements: 5.1-5.6
 * 
 * Key Features:
 * - Approve assets with status transition to APPROVED
 * - Reject assets with required rejection reason
 * - Record approval timestamps and approver IDs
 * - Handle rejection with rejectedAt, rejectedById, rejectionReason
 * - Allow visibility modification during approval
 * - Integrate with AuditService for logging
 */

import { PrismaClient, AssetStatus, VisibilityLevel } from '@/app/generated/prisma';
import { 
  ApprovalAction,
  User,
  Asset
} from '@/types';
import { AuditService } from './AuditService';

export interface ApproveAssetParams {
  assetId: string;
  reviewerId: string;
  newVisibility?: VisibilityLevel;
  allowedRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RejectAssetParams {
  assetId: string;
  reviewerId: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ApprovalResult {
  id: string;
  title: string;
  status: AssetStatus;
  visibility: VisibilityLevel;
  approvedAt?: Date;
  approvedById?: string;
  rejectedAt?: Date;
  rejectedById?: string;
  rejectionReason?: string;
}

export class ApprovalService {
  private prisma: PrismaClient;
  private auditService: AuditService;

  constructor(prisma: PrismaClient, auditService: AuditService) {
    this.prisma = prisma;
    this.auditService = auditService;
  }

  /**
   * Approve an asset
   * 
   * Requirements:
   * - 5.2: Set status to APPROVED and record approvedAt timestamp and approvedById
   * - 5.4: Allow visibility level modification during approval
   * - 5.6: Log approval action in audit log with detailed context
   * 
   * @param params - Approval parameters
   * @returns The approved asset
   * @throws Error if asset not found or not in PENDING_REVIEW status
   */
  async approveAsset(params: ApproveAssetParams): Promise<ApprovalResult> {
    const { assetId, reviewerId, newVisibility, allowedRole, ipAddress, userAgent } = params;

    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        allowedRole: true,
        uploaderId: true,
        approvedAt: true,
        approvedById: true,
        rejectedAt: true,
        rejectedById: true,
        rejectionReason: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Verify asset is in PENDING_REVIEW status
    if (asset.status !== AssetStatus.PENDING_REVIEW) {
      throw new Error(`Asset must be in PENDING_REVIEW status to approve. Current status: ${asset.status}`);
    }

    // Verify reviewer exists
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      throw new Error('Reviewer not found');
    }

    // Prepare update data
    const updateData: any = {
      status: AssetStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: reviewerId,
      // Clear rejection fields if previously rejected
      rejectedAt: null,
      rejectedById: null,
      rejectionReason: null,
    };

    // Track previous values for audit log
    const previousVisibility = asset.visibility;
    const previousAllowedRole = asset.allowedRole;

    // Apply visibility change if provided
    if (newVisibility !== undefined) {
      // Validate visibility level
      if (!Object.values(VisibilityLevel).includes(newVisibility)) {
        throw new Error(`Invalid visibility level: ${newVisibility}`);
      }
      updateData.visibility = newVisibility;
    }

    // Apply allowedRole if provided
    if (allowedRole !== undefined) {
      updateData.allowedRole = allowedRole;
    }

    // Update the asset
    const updatedAsset = await this.prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        allowedRole: true,
        approvedAt: true,
        approvedById: true,
        rejectedAt: true,
        rejectedById: true,
        rejectionReason: true,
      },
    });

    // Create Approval record
    await this.prisma.approval.create({
      data: {
        assetId,
        reviewerId,
        action: ApprovalAction.APPROVE,
      },
    });

    // Log approval in audit log with detailed context (Requirement 5.6, 12.5)
    const auditContext: any = {
      previousStatus: asset.status,
      newStatus: AssetStatus.APPROVED,
      approvedAt: updatedAsset.approvedAt,
      approvedById: reviewerId,
    };

    // Include visibility change in audit log if modified
    if (newVisibility !== undefined && newVisibility !== previousVisibility) {
      auditContext.previousVisibility = previousVisibility;
      auditContext.newVisibility = newVisibility;
      auditContext.visibilityChanged = true;
    }

    // Include allowedRole change in audit log if modified
    if (allowedRole !== undefined && allowedRole !== previousAllowedRole) {
      auditContext.previousAllowedRole = previousAllowedRole;
      auditContext.newAllowedRole = allowedRole;
      auditContext.allowedRoleChanged = true;
    }

    await this.auditService.logAssetApprove(
      reviewerId,
      assetId,
      auditContext,
      ipAddress,
      userAgent
    );

    // If visibility was changed, also log the visibility change separately
    if (newVisibility !== undefined && newVisibility !== previousVisibility) {
      await this.auditService.logVisibilityChange(
        reviewerId,
        assetId,
        {
          previousValue: previousVisibility,
          newValue: newVisibility,
          allowedRole: allowedRole,
          context: 'Changed during approval',
        },
        ipAddress,
        userAgent
      );
    }

    return {
      id: updatedAsset.id,
      title: updatedAsset.title,
      status: updatedAsset.status,
      visibility: updatedAsset.visibility,
      approvedAt: updatedAsset.approvedAt || undefined,
      approvedById: updatedAsset.approvedById || undefined,
      rejectedAt: updatedAsset.rejectedAt || undefined,
      rejectedById: updatedAsset.rejectedById || undefined,
      rejectionReason: updatedAsset.rejectionReason || undefined,
    };
  }

  /**
   * Reject an asset
   * 
   * Requirements:
   * - 5.3: Set status to REJECTED, require rejection reason, record rejectedAt and rejectedById
   * - 5.6: Log rejection action in audit log with detailed context
   * 
   * @param params - Rejection parameters
   * @returns The rejected asset
   * @throws Error if asset not found, not in PENDING_REVIEW status, or reason not provided
   */
  async rejectAsset(params: RejectAssetParams): Promise<ApprovalResult> {
    const { assetId, reviewerId, reason, ipAddress, userAgent } = params;

    // Validate rejection reason is provided
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        uploaderId: true,
        approvedAt: true,
        approvedById: true,
        rejectedAt: true,
        rejectedById: true,
        rejectionReason: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Verify asset is in PENDING_REVIEW status
    if (asset.status !== AssetStatus.PENDING_REVIEW) {
      throw new Error(`Asset must be in PENDING_REVIEW status to reject. Current status: ${asset.status}`);
    }

    // Verify reviewer exists
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      throw new Error('Reviewer not found');
    }

    // Update the asset
    const updatedAsset = await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        status: AssetStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: reviewerId,
        rejectionReason: reason.trim(),
        // Clear approval fields if previously approved
        approvedAt: null,
        approvedById: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        approvedAt: true,
        approvedById: true,
        rejectedAt: true,
        rejectedById: true,
        rejectionReason: true,
      },
    });

    // Create Approval record
    await this.prisma.approval.create({
      data: {
        assetId,
        reviewerId,
        action: ApprovalAction.REJECT,
        reason: reason.trim(),
      },
    });

    // Log rejection in audit log with detailed context (Requirement 5.6, 12.5)
    await this.auditService.logAssetReject(
      reviewerId,
      assetId,
      {
        previousStatus: asset.status,
        newStatus: AssetStatus.REJECTED,
        rejectedAt: updatedAsset.rejectedAt,
        rejectedById: reviewerId,
        reason: reason.trim(),
      },
      ipAddress,
      userAgent
    );

    return {
      id: updatedAsset.id,
      title: updatedAsset.title,
      status: updatedAsset.status,
      visibility: updatedAsset.visibility,
      approvedAt: updatedAsset.approvedAt || undefined,
      approvedById: updatedAsset.approvedById || undefined,
      rejectedAt: updatedAsset.rejectedAt || undefined,
      rejectedById: updatedAsset.rejectedById || undefined,
      rejectionReason: updatedAsset.rejectionReason || undefined,
    };
  }

  /**
   * Get pending assets for review
   * 
   * Requirements:
   * - 5.1: Display all assets with PENDING_REVIEW status
   * 
   * @returns Array of assets with PENDING_REVIEW status
   */
  async getPendingAssets(): Promise<any[]> {
    const assets = await this.prisma.asset.findMany({
      where: {
        status: AssetStatus.PENDING_REVIEW,
      },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        assetType: true,
        status: true,
        visibility: true,
        companyId: true,
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        uploadedAt: true,
        storageUrl: true,
        targetPlatforms: true,
        campaignName: true,
        approvedAt: true,
        approvedById: true,
        rejectedAt: true,
        rejectedById: true,
        rejectionReason: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return assets;
  }
}
