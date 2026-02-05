/**
 * Asset Presigned Upload URL API Route
 * 
 * POST /api/assets/presign - Get presigned URL for upload
 * 
 * Requirements: 3.1-3.12, 4.1-4.7, 10.4
 * 
 * Key Features:
 * - Generates presigned URLs for direct upload to Cloudflare services
 * - Creates asset record with DRAFT status
 * - Validates upload type and company requirements
 * - Routes to appropriate storage service based on asset type
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AssetService } from '@/lib/services/AssetService';
import { UploadHandler } from '@/lib/services/UploadHandler';
import { AuditService } from '@/lib/services/AuditService';
import { VisibilityService } from '@/lib/services/VisibilityService';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';
import { AssetType, UploadType, VisibilityLevel } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const visibilityService = new VisibilityService(prisma as any);
const visibilityChecker = new VisibilityChecker(visibilityService);
const assetService = new AssetService(prisma as any, auditService, visibilityChecker);

// Initialize UploadHandler with storage config
const uploadHandler = new UploadHandler({
  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  streamAccountId: process.env.STREAM_ACCOUNT_ID || '',
  streamApiToken: process.env.STREAM_API_TOKEN || '',
  imagesAccountId: process.env.IMAGES_ACCOUNT_ID || '',
  imagesApiToken: process.env.IMAGES_API_TOKEN || '',
});

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
 * POST /api/assets/presign
 * 
 * Generate presigned URL for direct upload to Cloudflare services
 * 
 * Request Body:
 * {
 *   title: string;
 *   description?: string;
 *   tags?: string[];
 *   assetType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
 *   uploadType: 'SEO' | 'DOC';
 *   companyId?: string; // Required for SEO uploads
 *   fileName: string;
 *   contentType: string;
 *   targetPlatforms?: string[];
 *   campaignName?: string;
 *   visibility?: VisibilityLevel; // Only for Admin users
 *   url?: string; // For LINK type assets
 * }
 * 
 * Response:
 * {
 *   assetId: string;
 *   uploadUrl?: string; // Not provided for LINK type
 *   storageUrl: string;
 *   expiresAt?: string;
 * }
 * 
 * Business Logic:
 * - If mode == "SEO": require companyId, create Asset with visibility = ADMIN_ONLY (unless Admin specifies otherwise), status = DRAFT
 * - If mode == "DOC": create Asset with visibility = UPLOADER_ONLY, status = DRAFT, companyId = null
 * - If user is Admin and provides visibility, use that value
 * - Return presigned URL for R2, Stream, or Images based on assetType
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const {
      title,
      description,
      tags,
      assetType,
      uploadType,
      companyId,
      fileName,
      contentType,
      targetPlatforms,
      campaignName,
      visibility,
      url,
    } = body;

    // Validate required fields
    if (!title || !assetType || !uploadType) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            title: !title ? 'Title is required' : undefined,
            assetType: !assetType ? 'Asset type is required' : undefined,
            uploadType: !uploadType ? 'Upload type is required' : undefined,
          },
        },
        { status: 400 }
      );
    }

    // For non-LINK assets, require fileName and contentType
    if (assetType !== AssetType.LINK && (!fileName || !contentType)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            fileName: !fileName ? 'File name is required' : undefined,
            contentType: !contentType ? 'Content type is required' : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Validate asset type
    if (!Object.values(AssetType).includes(assetType as AssetType)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            assetType: `Invalid asset type. Must be one of: ${Object.values(AssetType).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate upload type
    if (!Object.values(UploadType).includes(uploadType as UploadType)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            uploadType: `Invalid upload type. Must be one of: ${Object.values(UploadType).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Extract IP address and user agent for audit logging
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Create asset record with DRAFT status
    // The AssetService will handle validation and default values
    const asset = await assetService.createAsset({
      title,
      description,
      tags,
      assetType,
      uploadType,
      companyId,
      uploaderId: user.id,
      storageUrl: '', // Will be updated in complete endpoint
      targetPlatforms,
      campaignName,
      submitForReview: false, // Always DRAFT for presign
      visibility,
      userRole: user.role as any,
      ipAddress,
      userAgent,
      url,
    });

    // For LINK type, no upload needed
    if (assetType === AssetType.LINK) {
      return NextResponse.json({
        assetId: asset.id,
        uploadUrl: undefined,
        storageUrl: asset.storageUrl,
      });
    }

    // Generate presigned upload URL
    const uploadResponse = await uploadHandler.generatePresignedUploadUrl({
      assetId: asset.id,
      assetType,
      uploadType,
      fileName,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    // The uploadResponse.storageUrl now contains the correct full path
    // Update asset with the actual storage URL
    await prisma.asset.update({
      where: { id: asset.id },
      data: { storageUrl: uploadResponse.storageUrl },
    });

    return NextResponse.json({
      assetId: uploadResponse.assetId,
      uploadUrl: uploadResponse.uploadUrl,
      storageUrl: uploadResponse.storageUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);

    // Handle specific error cases
    if (
      error.message.includes('required') ||
      error.message.includes('Invalid') ||
      error.message.includes('cannot exceed') ||
      error.message.includes('Cannot have more than') ||
      error.message.includes('not found')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
});
