/**
 * Asset Sharing API Route
 * 
 * POST /api/assets/[id]/share - Share an asset with specific users
 * GET /api/assets/[id]/share - Get all shares for an asset
 * 
 * Requirements: 13.1-13.5
 * 
 * Key Features:
 * - Share Doc assets with specific users
 * - Only uploader can share their assets
 * - Create AssetShare records
 * - Send notifications to recipients
 * - Create audit log entries
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
 * POST /api/assets/[id]/share
 * 
 * Share an asset with specific users
 * 
 * Request Body:
 * {
 *   sharedWithIds: string[]; // Array of user IDs to share with
 *   targetType?: 'USER' | 'ROLE' | 'TEAM'; // Optional target type
 *   targetId?: string; // Optional target ID (role name or team ID)
 * }
 * 
 * Response:
 * {
 *   shares: Array<{
 *     id: string;
 *     assetId: string;
 *     sharedById: string;
 *     sharedWithId: string;
 *     targetType?: string;
 *     targetId?: string;
 *     createdAt: Date;
 *   }>;
 *   message: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (only uploader can share)
 * - 404: Asset not found
 * - 500: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: assetId } = await params;

      if (!assetId) {
        return NextResponse.json(
          { error: 'Asset ID is required' },
          { status: 400 }
        );
      }

      // Parse request body
      const body = await request.json();
      const { sharedWithIds, targetType, targetId } = body;

      // Validate sharedWithIds
      if (!sharedWithIds || !Array.isArray(sharedWithIds) || sharedWithIds.length === 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              sharedWithIds: 'At least one user ID is required',
            },
          },
          { status: 400 }
        );
      }

      // Validate targetType if provided
      if (targetType && !['USER', 'ROLE', 'TEAM'].includes(targetType)) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              targetType: 'Invalid target type. Must be one of: USER, ROLE, TEAM',
            },
          },
          { status: 400 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Share the asset
      const shares = await shareManager.shareAsset({
        assetId,
        sharedById: user.id,
        sharedWithIds,
        targetType,
        targetId,
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        shares,
        message: `Asset shared with ${shares.length} user(s)`,
      });
    } catch (error: any) {
      console.error('Error sharing asset:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (
        error.message.includes('Only the uploader') ||
        error.message.includes('Can only share')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (
        error.message.includes('required') ||
        error.message.includes('Cannot share asset with yourself')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to share asset' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/assets/[id]/share
 * 
 * Get all shares for an asset
 * 
 * Response:
 * {
 *   shares: Array<{
 *     id: string;
 *     assetId: string;
 *     sharedById: string;
 *     sharedWithId: string;
 *     targetType?: string;
 *     targetId?: string;
 *     createdAt: Date;
 *   }>;
 * }
 * 
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (only uploader can view shares)
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

      if (!assetId) {
        return NextResponse.json(
          { error: 'Asset ID is required' },
          { status: 400 }
        );
      }

      // Check if asset exists and user is the uploader
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          uploaderId: true,
        },
      });

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Only uploader can view shares
      if (asset.uploaderId !== user.id) {
        return NextResponse.json(
          { error: 'Only the uploader can view asset shares' },
          { status: 403 }
        );
      }

      // Get all shares for the asset
      const shares = await shareManager.getAssetShares(assetId);

      // Fetch user details for each share
      const sharesWithUsers = await Promise.all(
        shares.map(async (share) => {
          const sharedWithUser = await prisma.user.findUnique({
            where: { id: share.sharedWithId },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });

          return {
            ...share,
            sharedWith: sharedWithUser,
          };
        })
      );

      return NextResponse.json({ shares: sharesWithUsers });
    } catch (error: any) {
      console.error('Error getting asset shares:', error);

      return NextResponse.json(
        { error: 'Failed to get asset shares' },
        { status: 500 }
      );
    }
  })(request);
}
