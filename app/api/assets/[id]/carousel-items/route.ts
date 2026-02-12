/**
 * Carousel Items API Route
 * GET /api/assets/[id]/carousel-items - Fetch all items for a carousel asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-middleware';
import prisma from '@/lib/prisma';
import { AssetType } from '@/app/generated/prisma';
import { convertToPublicUrl } from '@/lib/utils/urlUtils';

export async function GET(
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

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Fetch the carousel asset
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

    // Fetch carousel items ordered by their order field
    const items = await prisma.carouselItem.findMany({
      where: { carouselId: assetId },
      orderBy: { order: 'asc' },
    });

    // Generate public URLs for each item using the utility function
    const r2PublicUrl = process.env.R2_PUBLIC_URL || '';
    const itemsWithUrls = items.map(item => ({
      ...item,
      publicUrl: convertToPublicUrl(item.storageUrl, r2PublicUrl),
    }));

    return NextResponse.json({ items: itemsWithUrls });
  } catch (error: any) {
    console.error('[Carousel Items API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carousel items' },
      { status: 500 }
    );
  }
}
