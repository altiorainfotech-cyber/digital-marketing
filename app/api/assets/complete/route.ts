/**
 * Asset Upload Completion API Route
 * 
 * POST /api/assets/complete - Complete upload and finalize asset record
 * 
 * Requirements: 3.8, 3.10, 3.11, 10.6
 * 
 * Key Features:
 * - Finalizes asset upload after file is uploaded to storage
 * - Updates asset metadata (file size, MIME type, etc.)
 * - Handles "Submit for Review" vs "Save Draft"
 * - Notifies admins when asset is submitted for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AuditService } from '@/lib/services/AuditService';
import { NotificationService } from '@/lib/services/NotificationService';
import { UploadType, AssetStatus, UserRole } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const notificationService = new NotificationService(prisma as any);

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
 * POST /api/assets/complete
 * 
 * Finalize asset upload after file is uploaded to storage
 * 
 * Request Body:
 * {
 *   assetId: string;
 *   storagePath?: string; // Optional, if different from presigned URL
 *   metadata?: {
 *     size?: number;
 *     width?: number;
 *     height?: number;
 *     duration?: number;
 *   };
 *   submitForReview?: boolean; // If true and mode==SEO, set status = PENDING_REVIEW
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   asset: Asset;
 * }
 * 
 * Business Logic:
 * - Update asset storagePath, fileSize, mimeType, metadata
 * - If submitForReview == true and uploadType == SEO: set status = PENDING_REVIEW, notify all Admins
 * - If submitForReview == false or not provided: keep status = DRAFT
 * - Create audit log entry
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Asset not found
 * - 500: Internal server error
 */
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const { assetId, storagePath, metadata, submitForReview } = body;

    // Validate required fields
    if (!assetId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            assetId: 'Asset ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Find the asset
    const asset = await prisma.asset.findUnique({
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
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Verify user is the uploader
    if (asset.uploaderId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only complete your own uploads' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (storagePath) {
      updateData.storageUrl = storagePath;
    }

    if (metadata?.size) {
      updateData.fileSize = metadata.size;
    }

    // Determine if we should change status to PENDING_REVIEW
    if (submitForReview && asset.uploadType === UploadType.SEO) {
      updateData.status = AssetStatus.PENDING_REVIEW;
    }

    // Update the asset
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Extract IP address and user agent for audit logging
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Log asset completion in audit log
    await auditService.logAssetUpdate(
      user.id,
      assetId,
      {
        changes: {
          completed: true,
          submitForReview: submitForReview || false,
          status: updateData.status,
        },
        previousValues: {
          status: asset.status,
        },
      },
      ipAddress,
      userAgent
    );

    // If submitted for review, notify all admins
    // Requirement 3.10: Notify all Admin users when SEO asset is submitted for review
    if (submitForReview && asset.uploadType === UploadType.SEO) {
      await notificationService.notifyAdminsOfUpload(
        asset.id,
        asset.title,
        user.id
      );
    }

    return NextResponse.json({
      success: true,
      asset: {
        id: updatedAsset.id,
        title: updatedAsset.title,
        description: updatedAsset.description,
        tags: updatedAsset.tags,
        assetType: updatedAsset.assetType,
        uploadType: updatedAsset.uploadType,
        status: updatedAsset.status,
        visibility: updatedAsset.visibility,
        companyId: updatedAsset.companyId,
        uploaderId: updatedAsset.uploaderId,
        storageUrl: updatedAsset.storageUrl,
        fileSize: updatedAsset.fileSize,
        mimeType: updatedAsset.mimeType,
        uploadedAt: updatedAsset.uploadedAt,
        targetPlatforms: updatedAsset.targetPlatforms,
        campaignName: updatedAsset.campaignName,
      },
    });
  } catch (error: any) {
    console.error('Error completing asset upload:', error);

    return NextResponse.json(
      { error: 'Failed to complete asset upload' },
      { status: 500 }
    );
  }
});
