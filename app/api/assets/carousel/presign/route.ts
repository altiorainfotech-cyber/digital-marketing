/**
 * Carousel Item Presigned Upload URL API Route
 * 
 * POST /api/assets/carousel/presign - Get presigned URL for carousel item upload
 * 
 * This endpoint generates presigned URLs for carousel items WITHOUT creating Asset records.
 * Carousel items are stored as CarouselItem records linked to a parent carousel Asset.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { UploadHandler } from '@/lib/services/UploadHandler';
import { AssetType as PrismaAssetType, UploadType as PrismaUploadType } from '@/app/generated/prisma';
import { AssetType, UploadType } from '@/types';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

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
      carouselId,
      fileName,
      contentType,
    } = body;

    if (!carouselId || !fileName || !contentType) {
      return NextResponse.json(
        { error: 'Carousel ID, file name, and content type are required' },
        { status: 400 }
      );
    }

    // Verify carousel exists and belongs to user
    const carousel = await prisma.asset.findUnique({
      where: { id: carouselId },
    });

    if (!carousel) {
      return NextResponse.json(
        { error: 'Carousel not found' },
        { status: 404 }
      );
    }

    if (carousel.uploaderId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (carousel.assetType !== PrismaAssetType.CAROUSEL) {
      return NextResponse.json(
        { error: 'Asset is not a carousel' },
        { status: 400 }
      );
    }

    // Determine asset type from content type
    const itemType: AssetType = contentType.startsWith('video/') ? AssetType.VIDEO : AssetType.IMAGE;

    // Generate unique storage path for carousel item
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${nanoid()}.${fileExtension}`;
    const storageUrl = `carousel/${carouselId}/${uniqueFileName}`;

    // Generate presigned upload URL for R2
    const uploadResponse = await uploadHandler.generatePresignedUploadUrl({
      assetId: carouselId, // Use carousel ID for path generation
      assetType: itemType,
      uploadType: carousel.uploadType as UploadType,
      fileName: uniqueFileName,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      uploadUrl: uploadResponse.uploadUrl,
      storageUrl: uploadResponse.storageUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Carousel presign error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
});
