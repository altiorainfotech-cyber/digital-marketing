/**
 * Admin SEO Downloads API Route
 * 
 * GET /api/admin/seo-downloads - Get all downloads by SEO Specialists (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import prisma from '@/lib/prisma';
import { Platform, UserRole } from '@/types';

/**
 * GET /api/admin/seo-downloads
 * 
 * Get all download history for SEO Specialists (admin access only)
 * Shows which SEO Specialists downloaded which assets and for which platforms
 * 
 * Response:
 * {
 *   downloads: Array<{
 *     id: string;
 *     assetId: string;
 *     downloadedAt: Date;
 *     platforms: Platform[];
 *     platformIntent?: Platform;
 *     downloadedBy: {
 *       id: string;
 *       name: string;
 *       email: string;
 *       company?: { id: string; name: string; } | null;
 *     };
 *     asset: {
 *       id: string;
 *       title: string;
 *       assetType: string;
 *       description?: string;
 *       uploader: {
 *         id: string;
 *         name: string;
 *         email: string;
 *       };
 *       company?: { id: string; name: string; } | null;
 *     };
 *     platformUsages?: Array<{
 *       platform: Platform;
 *       postUrl?: string;
 *       campaignName: string;
 *       usedAt: Date;
 *     }>;
 *   }>;
 * }
 */
export async function GET(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    try {
      console.log('[Admin SEO Downloads] Fetching downloads for admin:', user.id);

      // Only admins can access this endpoint
      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only administrators can view SEO download data' },
          { status: 403 }
        );
      }

      // Get ALL downloads made by SEO Specialists
      const downloads = await prisma.assetDownload.findMany({
        where: {
          User: {
            role: UserRole.SEO_SPECIALIST,
          },
        },
        orderBy: {
          downloadedAt: 'desc',
        },
        select: {
          id: true,
          assetId: true,
          downloadedAt: true,
          platforms: true,
          platformIntent: true,
          downloadedById: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              companyId: true,
              Company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          Asset: {
            select: {
              id: true,
              title: true,
              assetType: true,
              description: true,
              uploaderId: true,
              companyId: true,
              uploader: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              Company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Transform the data to match the expected format
      const formattedDownloads = downloads.map((download) => ({
        id: download.id,
        assetId: download.assetId,
        downloadedAt: download.downloadedAt.toISOString(),
        platforms: download.platforms as Platform[],
        platformIntent: download.platformIntent as Platform | undefined,
        downloadedBy: {
          id: download.User.id,
          name: download.User.name || 'Unknown User',
          email: download.User.email,
          company: download.User.Company,
        },
        asset: {
          id: download.Asset.id,
          title: download.Asset.title,
          assetType: download.Asset.assetType,
          description: download.Asset.description || undefined,
          uploader: {
            id: download.Asset.uploader.id,
            name: download.Asset.uploader.name || 'Unknown',
            email: download.Asset.uploader.email,
          },
          company: download.Asset.Company,
        },
      }));

      console.log(`[Admin SEO Downloads] Found ${formattedDownloads.length} downloads`);

      return NextResponse.json({
        downloads: formattedDownloads,
      });
    } catch (error) {
      console.error('[Admin SEO Downloads] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SEO download data' },
        { status: 500 }
      );
    }
  })(request);
}
