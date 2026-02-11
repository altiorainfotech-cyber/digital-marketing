/**
 * Carousel Asset Upload API Route
 * 
 * POST /api/assets/carousel - Create carousel asset with multiple files
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AssetService } from '@/lib/services/AssetService';
import { UploadHandler } from '@/lib/services/UploadHandler';
import { AuditService } from '@/lib/services/AuditService';
import { VisibilityService } from '@/lib/services/VisibilityService';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';
import { AssetType, UploadType, VisibilityLevel, AssetStatus } from '@/app/generated/prisma';
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

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const {
      title,
      description,
      tags = [],
      uploadType,
      companyId,
      targetPlatforms = [],
      campaignName,
      visibility,
      submitForReview = false,
      fileCount,
    } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!uploadType || !Object.values(UploadType).includes(uploadType)) {
      return NextResponse.json(
        { error: 'Valid upload type is required' },
        { status: 400 }
      );
    }

    if (uploadType === UploadType.SEO && !companyId) {
      return NextResponse.json(
        { error: 'Company is required for SEO uploads' },
        { status: 400 }
      );
    }

    if (!fileCount || fileCount < 2) {
      return NextResponse.json(
        { error: 'At least 2 files are required for carousel' },
        { status: 400 }
      );
    }

    // Create carousel asset
    const carousel = await assetService.createAsset({
      title: title.trim(),
      description: description?.trim(),
      tags: Array.isArray(tags) ? tags : [],
      assetType: AssetType.CAROUSEL,
      uploadType,
      companyId: uploadType === UploadType.SEO ? companyId : undefined,
      uploaderId: user.id,
      storageUrl: 'carousel://placeholder', // Placeholder URL, will be updated after upload
      targetPlatforms: Array.isArray(targetPlatforms) ? targetPlatforms : [],
      campaignName: campaignName?.trim(),
      visibility,
      status: submitForReview ? AssetStatus.PENDING_REVIEW : AssetStatus.DRAFT,
    });

    return NextResponse.json({
      carouselId: carousel.id,
    });
  } catch (error: any) {
    console.error('Carousel creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create carousel' },
      { status: 500 }
    );
  }
});
