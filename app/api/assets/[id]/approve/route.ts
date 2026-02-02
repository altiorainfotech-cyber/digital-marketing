/**
 * Asset Approval API Route
 * 
 * POST /api/assets/[id]/approve - Approve an asset
 * 
 * Requirements: 5.1-5.6
 * 
 * Key Features:
 * - Admin-only access
 * - Approve asset with status transition to APPROVED
 * - Allow visibility modification during approval
 * - Send notification to uploader
 * - Create audit log entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { ApprovalService } from '@/lib/services/ApprovalService';
import { NotificationService } from '@/lib/services/NotificationService';
import { AuditService } from '@/lib/services/AuditService';
import { UserRole, VisibilityLevel } from '@/types';
import { VisibilityLevel as PrismaVisibilityLevel } from '@/app/generated/prisma';
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
 * POST /api/assets/[id]/approve
 * 
 * Approve an asset (Admin only)
 * 
 * Request Body:
 * {
 *   newVisibility?: 'UPLOADER_ONLY' | 'ADMIN_ONLY' | 'COMPANY' | 'TEAM' | 'ROLE' | 'SELECTED_USERS' | 'PUBLIC';
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   title: string;
 *   status: string;
 *   visibility: string;
 *   approvedAt: Date;
 *   approvedById: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
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
      const body = await request.json().catch(() => ({}));
      const { newVisibility, allowedRole } = body;

      // Validate newVisibility if provided
      if (newVisibility && !Object.values(PrismaVisibilityLevel).includes(newVisibility as PrismaVisibilityLevel)) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              newVisibility: `Invalid visibility level. Must be one of: ${Object.values(PrismaVisibilityLevel).join(', ')}`,
            },
          },
          { status: 400 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Get asset details before approval for notification
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

      // Approve the asset
      const approvedAsset = await approvalService.approveAsset({
        assetId,
        reviewerId: user.id,
        newVisibility: newVisibility as VisibilityLevel | undefined,
        allowedRole: allowedRole as string | undefined,
        ipAddress,
        userAgent,
      });

      // Send notification to uploader (Requirement 5.5)
      await notificationService.notifyUploaderOfApproval(
        asset.id,
        asset.title,
        asset.uploaderId,
        user.id
      );

      return NextResponse.json(approvedAsset);
    } catch (error: any) {
      console.error('Error approving asset:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (
        error.message.includes('must be in PENDING_REVIEW') ||
        error.message.includes('Invalid visibility')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to approve asset' },
        { status: 500 }
      );
    }
  })(request);
}
