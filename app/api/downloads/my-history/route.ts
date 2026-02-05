/**
 * My Download History API Route
 * 
 * GET /api/downloads/my-history - Get current user's download history
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import prisma from '@/lib/prisma';
import { Platform } from '@/types';

/**
 * GET /api/downloads/my-history
 * 
 * Get download history for the authenticated user
 * 
 * Response:
 * {
 *   downloads: Array<{
 *     id: string;
 *     assetId: string;
 *     downloadedAt: Date;
 *     platforms: Platform[];
 *     asset: {
 *       id: string;
 *       title: string;
 *       assetType: string;
 *       description?: string;
 *     };
 *   }>;
 * }
 */
export async function GET(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    try {
      const downloads = await prisma.assetDownload.findMany({
        where: {
          downloadedById: user.id,
        },
        orderBy: {
          downloadedAt: 'desc',
        },
        select: {
          id: true,
          assetId: true,
          downloadedAt: true,
          platforms: true,
          Asset: {
            select: {
              id: true,
              title: true,
              assetType: true,
              description: true,
              storageUrl: true,
            },
          },
        },
      });

      const formattedDownloads = downloads.map((download) => ({
        id: download.id,
        assetId: download.assetId,
        downloadedAt: download.downloadedAt,
        platforms: download.platforms as Platform[],
        asset: download.Asset,
      }));

      return NextResponse.json(
        { downloads: formattedDownloads },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('[My Download History] Error fetching downloads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch download history', details: error.message },
        { status: 500 }
      );
    }
  })(request);
}
