/**
 * Platform Usage API Routes
 * 
 * POST /api/assets/[id]/usage - Log platform usage
 * GET /api/assets/[id]/usage - Get usage history
 * 
 * Requirements: 8.1-8.6
 * 
 * Key Features:
 * - Log platform usage with validation
 * - Require platform, campaign name, and usage date
 * - Optionally accept post URL
 * - Record user who logged the usage
 * - Create audit log entry
 * - Retrieve usage history with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { UsageService } from '@/lib/services/UsageService';
import { AuditService } from '@/lib/services/AuditService';
import { Platform } from '@/types';
import { Platform as PrismaPlatform } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const usageService = new UsageService(prisma as any, auditService);

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
 * POST /api/assets/[id]/usage
 * 
 * Log platform usage for an asset
 * 
 * Request Body:
 * {
 *   platform: 'X' | 'LINKEDIN' | 'INSTAGRAM' | 'META_ADS' | 'YOUTUBE';
 *   campaignName: string;
 *   postUrl?: string;
 *   usedAt?: string; // ISO date string
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   assetId: string;
 *   platform: string;
 *   campaignName: string;
 *   postUrl?: string;
 *   usedAt: Date;
 *   loggedById: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
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
      const { platform, campaignName, postUrl, usedAt } = body;

      // Validate required fields
      const errors: Record<string, string> = {};

      if (!platform) {
        errors.platform = 'Platform is required';
      } else if (!Object.values(PrismaPlatform).includes(platform as PrismaPlatform)) {
        errors.platform = `Invalid platform. Must be one of: ${Object.values(PrismaPlatform).join(', ')}`;
      }

      if (!campaignName || typeof campaignName !== 'string' || campaignName.trim().length === 0) {
        errors.campaignName = 'Campaign name is required';
      }

      if (Object.keys(errors).length > 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: errors,
          },
          { status: 400 }
        );
      }

      // Parse usedAt date if provided
      let parsedUsedAt: Date | undefined;
      if (usedAt) {
        parsedUsedAt = new Date(usedAt);
        if (isNaN(parsedUsedAt.getTime())) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              fields: {
                usedAt: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
              },
            },
            { status: 400 }
          );
        }
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Log platform usage
      const usage = await usageService.logUsage({
        assetId,
        platform: platform as Platform,
        campaignName: campaignName.trim(),
        postUrl: postUrl?.trim(),
        usedAt: parsedUsedAt,
        loggedById: user.id,
        ipAddress,
        userAgent,
      });

      return NextResponse.json(usage, { status: 201 });
    } catch (error: any) {
      console.error('Error logging platform usage:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (
        error.message.includes('required') ||
        error.message.includes('Invalid')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to log platform usage' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/assets/[id]/usage
 * 
 * Get platform usage history for an asset
 * 
 * Query Parameters:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * 
 * Response:
 * {
 *   usages: Array<{
 *     id: string;
 *     assetId: string;
 *     platform: string;
 *     campaignName: string;
 *     postUrl?: string;
 *     usedAt: Date;
 *     loggedById: string;
 *   }>;
 *   total: number;
 *   stats: {
 *     totalUsages: number;
 *     platformBreakdown: Record<string, number>;
 *   };
 * }
 * 
 * Errors:
 * - 401: Unauthorized
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

      // Get usage history
      const usages = await usageService.getUsageHistory(assetId, limit, offset);

      // Get usage stats
      const stats = await usageService.getUsageStats(assetId);

      return NextResponse.json({
        usages,
        total: stats.totalUsages,
        stats: {
          totalUsages: stats.totalUsages,
          platformBreakdown: stats.platformBreakdown,
        },
      });
    } catch (error: any) {
      console.error('Error retrieving platform usage:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to retrieve platform usage' },
        { status: 500 }
      );
    }
  })(request);
}
