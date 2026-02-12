/**
 * Platform Usage API Route
 * 
 * GET /api/downloads/platform-usage - Get downloads of Content Creator's assets by SEO Specialists
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import prisma from '@/lib/prisma';
import { Platform, UserRole } from '@/types';

/**
 * GET /api/downloads/platform-usage
 * 
 * Get download history for assets created by the authenticated Content Creator
 * Shows which SEO Specialists downloaded their assets and for which platforms
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
 *     };
 *     asset: {
 *       id: string;
 *       title: string;
 *       assetType: string;
 *       description?: string;
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
      console.log('[Platform Usage] Fetching downloads for user:', user.id, 'role:', user.role);

      // Only Content Creators can access this endpoint
      if (user.role !== UserRole.CONTENT_CREATOR) {
        return NextResponse.json(
          { error: 'Only Content Creators can view platform usage data' },
          { status: 403 }
        );
      }

      // Get ALL downloads made by SEO Specialists (not filtered by asset owner)
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
              role: true,
            },
          },
          Asset: {
            select: {
              id: true,
              title: true,
              assetType: true,
              description: true,
              uploaderId: true,
              uploader: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      console.log('[Platform Usage] Found downloads:', downloads.length);

      // Get platform usage details for each download
      const downloadsWithUsage = await Promise.all(
        downloads.map(async (download) => {
          const platformUsages = await prisma.platformUsage.findMany({
            where: {
              assetId: download.assetId,
              loggedById: download.downloadedById,
            },
            select: {
              platform: true,
              postUrl: true,
              campaignName: true,
              usedAt: true,
            },
          });

          return {
            id: download.id,
            assetId: download.assetId,
            downloadedAt: download.downloadedAt,
            platforms: download.platforms as Platform[],
            platformIntent: download.platformIntent as Platform | undefined,
            downloadedBy: download.User,
            asset: {
              id: download.Asset.id,
              title: download.Asset.title,
              assetType: download.Asset.assetType,
              description: download.Asset.description,
              uploader: download.Asset.uploader,
            },
            platformUsages: platformUsages.length > 0 ? platformUsages.map(usage => ({
              platform: usage.platform as Platform,
              postUrl: usage.postUrl || undefined,
              campaignName: usage.campaignName,
              usedAt: usage.usedAt,
            })) : undefined,
          };
        })
      );

      console.log('[Platform Usage] Returning downloads with usage');

      return NextResponse.json(
        { downloads: downloadsWithUsage },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('[Platform Usage] Error fetching downloads:', error);
      console.error('[Platform Usage] Error stack:', error.stack);
      return NextResponse.json(
        { error: 'Failed to fetch platform usage data', details: error.message },
        { status: 500 }
      );
    }
  })(request);
}
