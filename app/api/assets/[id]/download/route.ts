/**
 * Download API Routes
 * 
 * POST /api/assets/[id]/download - Initiate download (get signed URL)
 * 
 * Requirements: 9.1-9.5
 * 
 * Key Features:
 * - Generate signed URLs with expiration (Requirement 9.1)
 * - Log download records (Requirement 9.2)
 * - Optionally record platform intent (Requirement 9.3)
 * - Create audit log entry (Requirement 9.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { DownloadService } from '@/lib/services/DownloadService';
import { AuditService } from '@/lib/services/AuditService';
import { StorageService } from '@/lib/services/StorageService';
import { Platform } from '@/types';
import { Platform as PrismaPlatform } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';
import { getStorageConfig } from '@/lib/config';

const auditService = new AuditService(prisma as any);
const storageConfig = getStorageConfig();
const storageService = new StorageService(storageConfig);
const downloadService = new DownloadService(prisma as any, auditService, storageService);

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
 * POST /api/assets/[id]/download
 * 
 * Initiate asset download and get signed URL
 * 
 * Request Body:
 * {
 *   platformIntent?: 'X' | 'LINKEDIN' | 'INSTAGRAM' | 'META_ADS' | 'YOUTUBE';
 *   expiresIn?: number; // seconds, default 3600 (1 hour)
 * }
 * 
 * Response:
 * {
 *   downloadUrl: string;
 *   expiresAt: Date;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (no permission to download)
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
      const body = await request.json().catch(() => ({}));
      const { platformIntent, expiresIn } = body;

      // Validate platform intent if provided
      if (platformIntent && !Object.values(PrismaPlatform).includes(platformIntent as PrismaPlatform)) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              platformIntent: `Invalid platform. Must be one of: ${Object.values(PrismaPlatform).join(', ')}`,
            },
          },
          { status: 400 }
        );
      }

      // Validate expiresIn if provided
      let validExpiresIn: number | undefined;
      if (expiresIn !== undefined) {
        validExpiresIn = parseInt(expiresIn, 10);
        if (isNaN(validExpiresIn) || validExpiresIn < 60 || validExpiresIn > 86400) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              fields: {
                expiresIn: 'Expiration time must be between 60 seconds (1 minute) and 86400 seconds (24 hours)',
              },
            },
            { status: 400 }
          );
        }
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      console.log(`[Download] User ${user.id} requesting download for asset ${assetId}`);

      // Initiate download (generates signed URL and logs download)
      const downloadResponse = await downloadService.initiateDownload({
        assetId,
        downloadedById: user.id,
        platformIntent: platformIntent as Platform | undefined,
        ipAddress,
        userAgent,
        expiresIn: validExpiresIn,
      });

      console.log(`[Download] Successfully generated download URL for asset ${assetId}`);

      return NextResponse.json(downloadResponse, { status: 200 });
    } catch (error: any) {
      console.error('[Download] Error initiating download:', error);

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
        { error: 'Failed to initiate download', details: error.message },
        { status: 500 }
      );
    }
  })(request);
}
