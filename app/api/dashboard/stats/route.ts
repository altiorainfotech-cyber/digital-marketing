/**
 * Dashboard Statistics API
 * 
 * GET /api/dashboard/stats - Get role-specific dashboard statistics
 * 
 * Returns statistics based on the authenticated user's role:
 * - ADMIN: Total users, companies, pending approvals, system health
 * - CONTENT_CREATOR: My assets, pending uploads, approved assets, views
 * - SEO_SPECIALIST: Approved assets, downloaded assets, platform usage, recent views
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authConfig';
import prisma from '@/lib/prisma';
import { AssetStatus } from '@/app/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;
    let stats = {};

    switch (user.role) {
      case 'ADMIN':
        // Admin statistics
        const [totalUsers, totalCompanies, pendingApprovals, totalAssets] = await Promise.all([
          prisma.user.count(),
          prisma.company.count(),
          prisma.asset.count({
            where: { status: AssetStatus.PENDING_REVIEW }
          }),
          prisma.asset.count()
        ]);

        stats = {
          totalUsers,
          totalCompanies,
          pendingApprovals,
          totalAssets,
          systemHealth: '99.9%' // TODO: Calculate from actual uptime metrics
        };
        break;

      case 'CONTENT_CREATOR':
        // Content Creator statistics
        const [myAssets, pendingUploads, approvedAssets, totalDownloads] = await Promise.all([
          prisma.asset.count({
            where: { uploaderId: user.id }
          }),
          prisma.asset.count({
            where: { 
              uploaderId: user.id,
              status: AssetStatus.PENDING_REVIEW
            }
          }),
          prisma.asset.count({
            where: { 
              uploaderId: user.id,
              status: AssetStatus.APPROVED
            }
          }),
          prisma.assetDownload.count({
            where: {
              Asset: { uploaderId: user.id }
            }
          })
        ]);

        stats = {
          myAssets,
          pendingUploads,
          approvedAssets,
          totalDownloads
        };
        break;

      case 'SEO_SPECIALIST':
        // SEO Specialist statistics
        const [approvedAssetsCount, myDownloads, platformsUsed, recentViews] = await Promise.all([
          prisma.asset.count({
            where: { 
              status: AssetStatus.APPROVED,
              ...(user.companyId ? { companyId: user.companyId } : {})
            }
          }),
          prisma.assetDownload.count({
            where: { downloadedById: user.id }
          }),
          prisma.platformUsage.groupBy({
            by: ['platform'],
            where: {
              Asset: user.companyId ? { companyId: user.companyId } : undefined
            }
          }).then(result => result.length),
          prisma.assetDownload.count({
            where: {
              downloadedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              },
              Asset: user.companyId ? { companyId: user.companyId } : undefined
            }
          })
        ]);

        stats = {
          approvedAssets: approvedAssetsCount,
          downloadedAssets: myDownloads,
          platformsUsed,
          recentViews
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid user role' },
          { status: 400 }
        );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
