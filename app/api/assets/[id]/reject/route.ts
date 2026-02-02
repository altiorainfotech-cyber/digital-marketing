/**
 * Asset Rejection API Route
 * 
 * POST /api/assets/[id]/reject - Reject an asset with reason
 * 
 * Requirements: 5.1-5.6
 * 
 * Key Features:
 * - Admin-only access
 * - Reject asset with status transition to REJECTED
 * - Require rejection reason
 * - Send notification to uploader
 * - Create audit log entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { ApprovalService } from '@/lib/services/ApprovalService';
import { NotificationService } from '@/lib/services/NotificationService';
import { AuditService } from '@/lib/services/AuditService';
import { UserRole } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const approvalService = new ApprovalService(prisma as any, auditService);
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
 * POST /api/assets/[id]/reject
 * 
 * Reject an asset with reason (Admin only)
 * 
 * Request Body:
 * {
 *   reason: string; // Required
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   title: string;
 *   status: string;
 *   visibility: string;
 *   rejectedAt: Date;
 *   rejectedById: string;
 *   rejectionReason: string;
 * }
 * 
 * Errors:
 * - 400: Validation error (missing reason)
 * - 401: Unauthorized
 * - 403: Forbidden (non-Admin users)
 * - 404: Asset not found
 * - 500: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      // Verify user is Admin
      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Admin access required.' },
          { status: 403 }
        );
      }

      const { id: assetId } = await params;

      if (!assetId) {
        return NextResponse.json(
          { error: 'Asset ID is required' },
          { status: 400 }
        );
      }

      // Parse request body
      const body = await request.json();
      const { reason } = body;

      // Validate reason is provided
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              reason: 'Rejection reason is required',
            },
          },
          { status: 400 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Get asset details before rejection for notification
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          title: true,
          uploaderId: true,
        },
      });

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Reject the asset
      const rejectedAsset = await approvalService.rejectAsset({
        assetId,
        reviewerId: user.id,
        reason: reason.trim(),
        ipAddress,
        userAgent,
      });

      // Send notification to uploader (Requirement 5.5)
      await notificationService.notifyUploaderOfRejection(
        asset.id,
        asset.title,
        asset.uploaderId,
        user.id,
        reason.trim()
      );

      return NextResponse.json(rejectedAsset);
    } catch (error: any) {
      console.error('Error rejecting asset:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (
        error.message.includes('must be in PENDING_REVIEW') ||
        error.message.includes('required')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to reject asset' },
        { status: 500 }
      );
    }
  })(request);
}
