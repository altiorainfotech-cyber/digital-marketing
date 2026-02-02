/**
 * Download History API Routes
 * 
 * GET /api/assets/[id]/downloads - Get download history
 * 
 * Requirements: 9.4, 9.5
 * 
 * Key Features:
 * - Retrieve download history with user and timestamp (Requirement 9.4)
 * - Support pagination
 * - Include user details for admin views
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { DownloadService } from '@/lib/services/DownloadService';
import { AuditService } from '@/lib/services/AuditService';
import { StorageService } from '@/lib/services/StorageService';
import { UserRole } from '@/types';
import prisma from '@/lib/prisma';
import { getStorageConfig } from '@/lib/config';

const auditService = new AuditService(prisma as any);
const storageConfig = getStorageConfig();
const storageService = new StorageService(storageConfig);
const downloadService = new DownloadService(prisma as any, auditService, storageService);

/**
 * GET /api/assets/[id]/downloads
 * 
 * Get download history for an asset
 * 
 * Query Parameters:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - includeUsers: boolean (default: false) - Include user details (Admin only)
 * 
 * Response:
 * {
 *   downloads: Array<{
 *     id: string;
 *     assetId: string;
 *     downloadedById: string;
 *     downloadedAt: Date;
 *     platformIntent?: string;
 *     user?: { // Only if includeUsers=true and user is Admin
 *       id: string;
 *       name: string;
 *       email: string;
 *     };
 *   }>;
 *   total: number;
 * }
 * 
 * Errors:
 * - 400: Invalid parameters
 * - 401: Unauthorized
 * - 403: Forbidden (non-Admin trying to include user details)
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

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const includeUsers = searchParams.get('includeUsers') === 'true';

      // Validate pagination parameters
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter. Must be a positive number.' },
          { status: 400 }
        );
      }

      if (isNaN(offset) || offset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter. Must be a non-negative number.' },
          { status: 400 }
        );
      }

      // Check if user is Admin for includeUsers option
      if (includeUsers && user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only Admin users can view download history with user details' },
          { status: 403 }
        );
      }

      // Get download history
      let downloads;
      if (includeUsers && user.role === UserRole.ADMIN) {
        downloads = await downloadService.getDownloadHistoryWithUsers(assetId, limit, offset);
      } else {
        downloads = await downloadService.getDownloadHistory(assetId, limit, offset);
      }

      // Get total count
      const total = await downloadService.getDownloadCount(assetId);

      return NextResponse.json({
        downloads,
        total,
      });
    } catch (error: any) {
      console.error('Error retrieving download history:', error);

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
        { error: 'Failed to retrieve download history' },
        { status: 500 }
      );
    }
  })(request);
}
