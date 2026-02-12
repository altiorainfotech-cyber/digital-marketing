/**
 * Complete Carousel Upload API Route
 * POST /api/assets/[id]/carousel-items/complete - Save carousel items after upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-middleware';
import prisma from '@/lib/prisma';
import { AssetType } from '@/app/generated/prisma';

interface CarouselItemData {
  storageUrl: string;
  fileSize: number;
  mimeType: string;
  itemType: AssetType;
  order: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication
  const authContext = await verifyAuth(request);
  if (!authContext) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { id: assetId } = await params;
    const body = await request.json();
    const { items } = body as { items: CarouselItemData[] };

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Verify the asset exists and is a carousel
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    if (asset.assetType !== AssetType.CAROUSEL) {
      return NextResponse.json(
        { error: 'Asset is not a carousel' },
        { status: 400 }
      );
    }

    // Verify user owns the asset
    if (asset.uploaderId !== authContext.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this asset' },
        { status: 403 }
      );
    }

    // Create carousel items
    const createdItems = await Promise.all(
      items.map((item) =>
        prisma.carouselItem.create({
          data: {
            carouselId: assetId,
            storageUrl: item.storageUrl,
            fileSize: item.fileSize,
            mimeType: item.mimeType,
            itemType: item.itemType,
            order: item.order,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      itemCount: createdItems.length,
    });
  } catch (error: any) {
    console.error('[Complete Carousel API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete carousel upload' },
      { status: 500 }
    );
  }
}
