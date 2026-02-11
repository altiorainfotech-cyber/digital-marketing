/**
 * Carousel Finalize API Route
 * 
 * POST /api/assets/carousel/finalize - Finalize carousel upload and create items
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AssetType } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const { carouselId, items } = body;

    if (!carouselId) {
      return NextResponse.json(
        { error: 'Carousel ID is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
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

    // Create carousel items
    const carouselItems = await Promise.all(
      items.map((item: any, index: number) =>
        prisma.carouselItem.create({
          data: {
            carouselId,
            storageUrl: item.storageUrl,
            fileSize: item.fileSize,
            mimeType: item.mimeType,
            itemType: item.mimeType?.startsWith('video/') ? AssetType.VIDEO : AssetType.IMAGE,
            order: index,
          },
        })
      )
    );

    // Update carousel storage URL to first item
    if (carouselItems.length > 0) {
      await prisma.asset.update({
        where: { id: carouselId },
        data: {
          storageUrl: carouselItems[0].storageUrl,
          mimeType: carouselItems[0].mimeType,
          fileSize: carouselItems.reduce((sum, item) => sum + (item.fileSize || 0), 0),
        },
      });
    }

    return NextResponse.json({
      success: true,
      itemCount: carouselItems.length,
    });
  } catch (error: any) {
    console.error('Carousel finalize error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to finalize carousel' },
      { status: 500 }
    );
  }
});
