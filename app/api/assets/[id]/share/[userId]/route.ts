/**
 * Asset Share Revocation API Route
 * 
 * DELETE /api/assets/[id]/share/[userId] - Revoke asset sharing for a specific user
 * 
 * Requirements: 13.1-13.5
 * 
 * Key Features:
 * - Revoke asset sharing for a specific user
 * - Only uploader can revoke shares
 * - Remove AssetShare record
 * - Create audit log entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { ShareManager } from '@/lib/services/ShareManager';
import { NotificationService } from '@/lib/services/NotificationService';
import { AuditService } from '@/lib/services/AuditService';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const notificationService = new NotificationService(prisma as any);
const shareManager = new ShareManager(prisma as any, auditService, notificationService);

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
 * DELETE /api/assets/[id]/share/[userId]
 * 
 * Revoke asset sharing for a specific user
 * 
 * Response:
 * {
 *   message: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (only uploader can revoke)
 * - 404: Asset or share not found
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: assetId, userId: sharedWithId } = await params;

      if (!assetId) {
        return NextResponse.json(
          { error: 'Asset ID is required' },
          { status: 400 }
        );
      }

      if (!sharedWithId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Revoke the share
      await shareManager.revokeShare({
        assetId,
        sharedById: user.id,
        sharedWithId,
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        message: 'Share revoked successfully',
      });
    } catch (error: any) {
      console.error('Error revoking share:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('Only the uploader')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (error.message.includes('required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to revoke share' },
        { status: 500 }
      );
    }
  })(request);
}
