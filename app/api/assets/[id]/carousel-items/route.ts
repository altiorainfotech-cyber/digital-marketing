/**
 * Carousel Items API Route
 * GET /api/assets/[id]/carousel-items - Fetch all items for a carousel asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import prisma from '@/lib/prisma';
import { AssetType } from '@/app/generated/prisma';

export const GET = withAuth(async (request, { user, params }) => {
  try {
    const assetId = params?.id as string;

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

    // Generate public URLs for each item
    const publicUrl = process.env.R2_PUBLIC_URL || '';
    const itemsWithUrls = items.map(item => ({
      ...item,
      publicUrl: publicUrl ? `${publicUrl}/${item.storageUrl}` : '',
    }));

    return NextResponse.json({ items: itemsWithUrls });
  } catch (error: any) {
    console.error('[Carousel Items API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carousel items' },
      { status: 500 }
    );
  }
});
