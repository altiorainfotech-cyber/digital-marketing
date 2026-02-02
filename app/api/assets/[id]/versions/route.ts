/**
 * Asset Versioning API Routes
 * 
 * POST /api/assets/[id]/versions - Upload new version
 * GET /api/assets/[id]/versions - Get version history
 * 
 * Requirements: 14.1-14.5
 * 
 * Key Features:
 * - Create AssetVersion records (Requirement 14.1)
 * - Preserve previous versions (Requirement 14.2)
 * - Display current version by default (Requirement 14.3)
 * - Display all versions with timestamps (Requirement 14.4)
 * - Log version creation in audit log (Requirement 14.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AssetService } from '@/lib/services/AssetService';
import { AuditService } from '@/lib/services/AuditService';
import { VisibilityService } from '@/lib/services/VisibilityService';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';
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
 * POST /api/assets/[id]/versions
 * 
 * Upload a new version of an existing asset
 * 
 * Request Body:
 * {
 *   storageUrl: string;
 *   fileSize?: number;
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   assetId: string;
 *   versionNumber: number;
 *   storageUrl: string;
 *   fileSize?: number;
 *   createdAt: Date;
 *   createdById: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (no permission to edit asset)
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
      const { storageUrl, fileSize } = body;

      // Validate required fields
      if (!storageUrl || typeof storageUrl !== 'string' || storageUrl.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              storageUrl: 'Storage URL is required',
            },
          },
          { status: 400 }
        );
      }

      // Validate fileSize if provided
      if (fileSize !== undefined && (typeof fileSize !== 'number' || fileSize < 0)) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              fileSize: 'File size must be a positive number',
            },
          },
          { status: 400 }
        );
      }

      // Check if asset exists and user has permission to edit
      const asset = await assetService.getAssetById(assetId);

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Check if user has permission to edit the asset
      const canEdit = visibilityChecker.canEdit(user as any, asset as any);

      if (!canEdit) {
        return NextResponse.json(
          { error: 'Insufficient permissions to edit this asset' },
          { status: 403 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Upload new version
      const version = await assetService.uploadNewVersion(
        assetId,
        storageUrl.trim(),
        fileSize,
        user.id,
        ipAddress,
        userAgent
      );

      return NextResponse.json(version, { status: 201 });
    } catch (error: any) {
      console.error('Error uploading new version:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (
        error.message.includes('Invalid') ||
        error.message.includes('required')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      if (error.message.includes('permission') || error.message.includes('access')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to upload new version' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/assets/[id]/versions
 * 
 * Get version history for an asset
 * 
 * Response:
 * {
 *   versions: [
 *     {
 *       id: string;
 *       assetId: string;
 *       versionNumber: number;
 *       storageUrl: string;
 *       fileSize?: number;
 *       createdAt: Date;
 *       createdById: string;
 *     }
 *   ]
 * }
 * 
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (no permission to view asset)
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

      // Check if asset exists and user has permission to view
      const asset = await assetService.getAssetById(assetId);

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Check if user has permission to view the asset
      const canView = await visibilityChecker.canView(user as any, asset as any);

      if (!canView) {
        return NextResponse.json(
          { error: 'Insufficient permissions to access this asset' },
          { status: 403 }
        );
      }

      // Get version history
      const versions = await assetService.getVersionHistory(assetId);

      return NextResponse.json({ versions }, { status: 200 });
    } catch (error: any) {
      console.error('Error getting version history:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('permission') || error.message.includes('access')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to get version history' },
        { status: 500 }
      );
    }
  })(request);
}
