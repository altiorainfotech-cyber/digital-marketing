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
import { VisibilityService } from '@/lib/services/VisibilityService';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';

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

      // Find the asset with all necessary fields for visibility check
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          storageUrl: true,
          assetType: true,
          uploaderId: true,
          visibility: true,
          companyId: true,
          status: true,
          uploadType: true,
        },
      });

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Check if user has permission to view this asset
      const visibilityService = new VisibilityService(prisma);
      const visibilityChecker = new VisibilityChecker(visibilityService);
      
      // Add missing User type fields for visibility check
      const userWithDates = {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      
      const canView = await visibilityChecker.canView(userWithDates, asset as any);
      
      if (!canView) {
        return NextResponse.json(
          { error: 'You do not have permission to view this asset' },
          { status: 403 }
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
