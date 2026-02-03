/**
 * Asset Public URL API Route
 * 
 * GET /api/assets/[id]/public-url - Get public URL for viewing asset
 * 
 * Returns the public HTTP URL for viewing images and videos directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { getPublicUrl } from '@/lib/config';
import prisma from '@/lib/prisma';

/**
 * GET /api/assets/[id]/public-url
 * 
 * Get public URL for asset viewing
 * 
 * Response:
 * {
 *   publicUrl: string;
 *   assetType: string;
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: assetId } = await params;

      if (!assetId) {
        return NextResponse.json(
          { error: 'Asset ID is required' },
          { status: 400 }
        );
      }

      // Find the asset
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          storageUrl: true,
          assetType: true,
        },
      });

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Convert storage URL to public URL
      const publicUrl = getPublicUrl(asset.storageUrl);

      return NextResponse.json({
        publicUrl,
        assetType: asset.assetType,
      });
    } catch (error: any) {
      console.error('Error getting public URL:', error);
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      );
    }
  })(request);
}
