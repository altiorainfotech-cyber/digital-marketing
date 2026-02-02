/**
 * Asset Management API Routes
 * 
 * POST /api/assets - Create asset record after upload (alternative to complete)
 * GET /api/assets - List assets with role-based filtering
 * 
 * Requirements: 3.1-3.12, 4.1-4.7, 7.1-7.6, 17.1-17.6
 * 
 * Key Features:
 * - Role-based asset filtering
 * - Visibility-based access control
 * - Support for SEO and Doc upload types
 * - Audit logging integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AssetService } from '@/lib/services/AssetService';
import { AuditService } from '@/lib/services/AuditService';
import { VisibilityService } from '@/lib/services/VisibilityService';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';
import { AssetType, UploadType, VisibilityLevel, UserRole, AssetStatus } from '@/types';
import prisma from '@/lib/prisma';
import { parseAndValidateBody, parseAndValidateQuery, createAssetSchema, listAssetsSchema } from '@/lib/validation';
import { handleApiError, parseServiceError } from '@/lib/errors/api-handler';

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
 * POST /api/assets
 * 
 * Create asset record after upload (alternative to presign/complete flow)
 * 
 * Request Body:
 * {
 *   title: string;
 *   description?: string;
 *   tags?: string[];
 *   assetType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
 *   uploadType: 'SEO' | 'DOC';
 *   companyId?: string; // Required for SEO uploads
 *   storageUrl: string;
 *   fileSize?: number;
 *   mimeType?: string;
 *   targetPlatforms?: string[];
 *   campaignName?: string;
 *   submitForReview?: boolean; // For SEO uploads
 *   visibility?: VisibilityLevel; // Only for Admin users
 *   url?: string; // For LINK type assets
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   title: string;
 *   description?: string;
 *   tags: string[];
 *   assetType: string;
 *   uploadType: string;
 *   status: string;
 *   visibility: string;
 *   companyId?: string;
 *   uploaderId: string;
 *   storageUrl: string;
 *   fileSize?: number;
 *   mimeType?: string;
 *   uploadedAt: string;
 *   targetPlatforms: string[];
 *   campaignName?: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const POST = withAuth(async (request, { user }) => {
  try {
    // Validate request body using Zod schema
    const validatedData = await parseAndValidateBody(request, createAssetSchema);

    // Extract IP address and user agent for audit logging
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Create asset using AssetService
    const asset = await assetService.createAsset({
      title: validatedData.title,
      description: validatedData.description,
      tags: validatedData.tags,
      assetType: validatedData.assetType as AssetType,
      uploadType: validatedData.uploadType as UploadType,
      companyId: validatedData.companyId,
      uploaderId: user.id,
      storageUrl: validatedData.storageUrl || validatedData.url || '',
      fileSize: validatedData.fileSize,
      mimeType: validatedData.mimeType,
      targetPlatforms: validatedData.targetPlatforms,
      campaignName: validatedData.campaignName,
      submitForReview: validatedData.submitForReview,
      visibility: validatedData.visibility as VisibilityLevel | undefined,
      userRole: user.role as any,
      ipAddress,
      userAgent,
      url: validatedData.url,
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return handleApiError(parseServiceError(error), {
      userId: user.id,
      action: 'CREATE_ASSET',
      resourceType: 'ASSET',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });
  }
});

/**
 * GET /api/assets
 * 
 * List assets with role-based filtering
 * 
 * Query Parameters:
 * - uploadType?: 'SEO' | 'DOC' (optional filter)
 * - status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' (optional filter)
 * - companyId?: string (optional filter)
 * 
 * Response:
 * {
 *   assets: Array<Asset>;
 *   total: number;
 * }
 * 
 * Role-based filtering:
 * - Admin: See all SEO assets, but not UPLOADER_ONLY Doc assets unless explicitly shared
 * - Content_Creator: See own uploads and assets shared with them
 * - SEO_Specialist: See own uploads and APPROVED assets they have permission to see
 * 
 * Errors:
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET = withAuth(async (request, { user }) => {
  try {
    // Validate query parameters using Zod schema
    const validatedQuery = parseAndValidateQuery(request, listAssetsSchema);

    // Build filters from validated query
    const filters: any = {};

    if (validatedQuery.uploadType) {
      filters.uploadType = validatedQuery.uploadType;
    }

    if (validatedQuery.status) {
      filters.status = validatedQuery.status;
    }

    if (validatedQuery.companyId) {
      filters.companyId = validatedQuery.companyId;
    }

    // Use the permission-aware list method
    // This automatically filters assets based on user role and visibility rules
    const assets = await assetService.listAssetsWithPermission(user as any, filters);

    return NextResponse.json({
      assets,
      total: assets.length,
    });
  } catch (error: any) {
    console.error('Error listing assets:', error);
    return handleApiError(parseServiceError(error), {
      userId: user.id,
      action: 'LIST_ASSETS',
      resourceType: 'ASSET',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });
  }
});
