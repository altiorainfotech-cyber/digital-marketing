/**
 * SEO Assets API Route
 * 
 * GET /api/seo/assets - List approved assets for SEO Specialists
 * 
 * Requirements: 7.6
 * 
 * Key Features:
 * - Returns only APPROVED assets
 * - Filters by visibility rules (COMPANY, ROLE, SELECTED_USERS, PUBLIC)
 * - Excludes UPLOADER_ONLY and ADMIN_ONLY assets (unless user is uploader)
 * - Applies permission checks for each asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AssetStatus, VisibilityLevel, UploadType } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

/**
 * GET /api/seo/assets
 * 
 * List approved assets for SEO Specialists
 * 
 * Query Parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20)
 * - company?: string (optional filter)
 * - platform?: string (optional filter)
 * 
 * Response:
 * {
 *   assets: Array<Asset>;
 *   total: number;
 *   page: number;
 *   limit: number;
 * }
 * 
 * Business Logic:
 * - Return only assets with status == APPROVED
 * - Filter by visibility rules (COMPANY, ROLE, SELECTED_USERS, PUBLIC)
 * - Exclude UPLOADER_ONLY and ADMIN_ONLY assets (unless user is uploader)
 * - Apply permission checks for each asset
 * 
 * Errors:
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET = withAuth(async (request, { user }) => {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const companyFilter = searchParams.get('company');
    const platformFilter = searchParams.get('platform');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      status: AssetStatus.APPROVED,
      uploadType: UploadType.SEO, // Only SEO assets
    };

    if (companyFilter) {
      where.companyId = companyFilter;
    }

    if (platformFilter) {
      where.targetPlatforms = {
        has: platformFilter,
      };
    }

    // Query assets
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          Company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    // Filter by visibility rules
    // Requirement 7.6: Return only APPROVED assets visible to their role, company, or team
    const filteredAssets = assets.filter((asset) => {
      // Can see own uploads
      if (asset.uploaderId === user.id) {
        return true;
      }

      // Can see PUBLIC assets
      if (asset.visibility === VisibilityLevel.PUBLIC) {
        return true;
      }

      // Can see COMPANY assets if same company
      if (
        asset.visibility === VisibilityLevel.COMPANY &&
        asset.companyId === user.companyId
      ) {
        return true;
      }

      // Can see ROLE assets if role matches
      // TODO: Check AssetShare for role-based sharing
      if (asset.visibility === VisibilityLevel.ROLE) {
        return false; // For now, exclude ROLE visibility
      }

      // Can see SELECTED_USERS assets if explicitly shared
      // TODO: Check AssetShare for user-based sharing
      if (asset.visibility === VisibilityLevel.SELECTED_USERS) {
        return false; // For now, exclude SELECTED_USERS visibility
      }

      // Cannot see UPLOADER_ONLY or ADMIN_ONLY assets
      if (
        asset.visibility === VisibilityLevel.UPLOADER_ONLY ||
        asset.visibility === VisibilityLevel.ADMIN_ONLY
      ) {
        return false;
      }

      return false;
    });

    // Map to response format
    const responseAssets = filteredAssets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      description: asset.description,
      tags: asset.tags,
      assetType: asset.assetType,
      uploadType: asset.uploadType,
      status: asset.status,
      visibility: asset.visibility,
      companyId: asset.companyId,
      company: asset.Company,
      uploaderId: asset.uploaderId,
      uploader: asset.uploader,
      storageUrl: asset.storageUrl,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
      uploadedAt: asset.uploadedAt,
      approvedAt: asset.approvedAt,
      targetPlatforms: asset.targetPlatforms,
      campaignName: asset.campaignName,
    }));

    return NextResponse.json({
      assets: responseAssets,
      total: filteredAssets.length,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Error listing SEO assets:', error);
    return NextResponse.json(
      { error: 'Failed to list SEO assets' },
      { status: 500 }
    );
  }
});
