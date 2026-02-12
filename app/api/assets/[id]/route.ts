/**
 * Individual Asset API Routes
 * 
 * GET /api/assets/[id] - Get asset by ID
 * PATCH /api/assets/[id] - Update asset metadata
 * DELETE /api/assets/[id] - Delete asset
 * 
 * Requirements: 7.4, 17.1-17.6
 * 
 * Key Features:
 * - Permission-based access control
 * - Metadata validation and updates
 * - Audit logging integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AssetService } from '@/lib/services/AssetService';
import { AuditService } from '@/lib/services/AuditService';
import { VisibilityService } from '@/lib/services/VisibilityService';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';
import { UserRole, VisibilityLevel, UploadType } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const visibilityService = new VisibilityService(prisma as any);
const visibilityChecker = new VisibilityChecker(visibilityService);
const assetService = new AssetService(prisma as any, auditService, visibilityChecker);

/**
 * Extract IP address from request
 */
function getIpAddress(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * GET /api/assets/[id]
 * 
 * Get asset by ID with permission check
 * 
 * Response:
 * {
 *   id: string;
 *   title: string;
 *   description?: string;
 *   tags: string[];
 *   assetType: string;
 *   uploadType: string;
 *   status: string;
 *   visibility: string;
 *   companyId?: string;
 *   company?: { id: string; name: string; };
 *   uploaderId: string;
 *   uploader: { id: string; email: string; name: string; role: string; };
 *   storageUrl: string;
 *   fileSize?: number;
 *   mimeType?: string;
 *   uploadedAt: string;
 *   approvedAt?: string;
 *   approvedById?: string;
 *   rejectedAt?: string;
 *   rejectedById?: string;
 *   rejectionReason?: string;
 *   targetPlatforms: string[];
 *   campaignName?: string;
 * }
 * 
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (no permission to view)
 * - 404: Asset not found
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: assetId } = await params;

      // Use the permission-aware get method
      const asset = await assetService.getAssetByIdWithPermission(assetId, user as any);

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Get additional details (uploader, company) from database
      const fullAsset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          Company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!fullAsset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: fullAsset.id,
        title: fullAsset.title,
        description: fullAsset.description,
        tags: fullAsset.tags,
        assetType: fullAsset.assetType,
        uploadType: fullAsset.uploadType,
        status: fullAsset.status,
        visibility: fullAsset.visibility,
        companyId: fullAsset.companyId,
        company: fullAsset.Company,
        uploaderId: fullAsset.uploaderId,
        uploader: fullAsset.uploader,
        storageUrl: fullAsset.storageUrl,
        fileSize: fullAsset.fileSize,
        mimeType: fullAsset.mimeType,
        uploadedAt: fullAsset.uploadedAt,
        approvedAt: fullAsset.approvedAt,
        approvedById: fullAsset.approvedById,
        rejectedAt: fullAsset.rejectedAt,
        rejectedById: fullAsset.rejectedById,
        rejectionReason: fullAsset.rejectionReason,
        targetPlatforms: fullAsset.targetPlatforms,
        campaignName: fullAsset.campaignName,
      });
    } catch (error: any) {
      console.error('Error getting asset:', error);

      // Handle permission errors
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to view this asset' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to get asset' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PATCH /api/assets/[id]
 * 
 * Update asset metadata with permission check
 * 
 * Request Body (all fields optional):
 * {
 *   title?: string;
 *   description?: string;
 *   tags?: string[];
 *   targetPlatforms?: string[];
 *   campaignName?: string;
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   title: string;
 *   description?: string;
 *   tags: string[];
 *   assetType: string;
 *   uploadType: string;
 *   status: string;
 *   visibility: string;
 *   companyId?: string;
 *   uploaderId: string;
 *   storageUrl: string;
 *   fileSize?: number;
 *   mimeType?: string;
 *   uploadedAt: string;
 *   targetPlatforms: string[];
 *   campaignName?: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (no permission to edit)
 * - 404: Asset not found
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: assetId } = await params;
      const body = await request.json();
      const { title, description, tags, targetPlatforms, campaignName } = body;

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Update asset using permission-aware method
      const updatedAsset = await assetService.updateAssetWithPermission(
        {
          assetId,
          title,
          description,
          tags,
          targetPlatforms,
          campaignName,
          updatedBy: user.id,
          ipAddress,
          userAgent,
        },
        user as any
      );

      return NextResponse.json(updatedAsset);
    } catch (error: any) {
      console.error('Error updating asset:', error);

      // Handle specific error cases
      if (error.message === 'Asset not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to edit this asset' },
          { status: 403 }
        );
      }

      if (
        error.message.includes('required') ||
        error.message.includes('Invalid') ||
        error.message.includes('cannot exceed') ||
        error.message.includes('Cannot have more than')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update asset' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * DELETE /api/assets/[id]
 * 
 * Delete asset with permission check
 * 
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 * 
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (no permission to delete)
 * - 404: Asset not found
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: assetId } = await params;

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Delete asset using permission-aware method
      await assetService.deleteAssetWithPermission(assetId, user as any, ipAddress, userAgent);

      return NextResponse.json({
        success: true,
        message: 'Asset deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);

      if (error.message === 'Asset not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to delete this asset' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to delete asset', details: error.toString() },
        { status: 500 }
      );
    }
  })(request);
}
