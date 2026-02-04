/**
 * Asset Debug API Route
 * 
 * GET /api/assets/[id]/debug - Debug asset storage and public URL generation
 * 
 * This endpoint helps troubleshoot asset preview issues by showing:
 * - Asset storage URL format
 * - Generated public URL
 * - Environment configuration
 * - URL conversion logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { getPublicUrl } from '@/lib/config';
import prisma from '@/lib/prisma';
import { UserRole } from '@/app/generated/prisma';

/**
 * GET /api/assets/[id]/debug
 * 
 * Debug asset URL generation (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      // Only allow admins to use debug endpoint
      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

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
          title: true,
          storageUrl: true,
          assetType: true,
          status: true,
          mimeType: true,
        },
      });

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Get environment configuration
      const r2PublicUrl = process.env.R2_PUBLIC_URL;
      const r2BucketName = process.env.R2_BUCKET_NAME;

      // Convert storage URL to public URL
      const publicUrl = getPublicUrl(asset.storageUrl);

      // Extract key from storage URL
      let extractedKey = '';
      const match = asset.storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
      if (match) {
        extractedKey = match[1];
      }

      // Build expected public URL
      const expectedPublicUrl = r2PublicUrl && extractedKey 
        ? `${r2PublicUrl}/${extractedKey}`
        : '';

      return NextResponse.json({
        asset: {
          id: asset.id,
          title: asset.title,
          assetType: asset.assetType,
          status: asset.status,
          mimeType: asset.mimeType,
        },
        urls: {
          storageUrl: asset.storageUrl,
          publicUrl: publicUrl,
          expectedPublicUrl: expectedPublicUrl,
          extractedKey: extractedKey,
        },
        environment: {
          r2PublicUrl: r2PublicUrl || '(not set)',
          r2BucketName: r2BucketName || '(not set)',
          nodeEnv: process.env.NODE_ENV,
        },
        checks: {
          hasR2PublicUrl: !!r2PublicUrl,
          storageUrlFormat: asset.storageUrl.startsWith('r2://') ? 'correct' : 'incorrect',
          publicUrlGenerated: !!publicUrl,
          publicUrlMatchesExpected: publicUrl === expectedPublicUrl,
        },
        recommendations: [
          !r2PublicUrl && 'Set R2_PUBLIC_URL environment variable',
          !asset.storageUrl.startsWith('r2://') && 'Storage URL format is incorrect',
          !publicUrl && 'Public URL could not be generated',
          publicUrl && !publicUrl.startsWith('http') && 'Public URL format is invalid',
        ].filter(Boolean),
      });
    } catch (error: any) {
      console.error('Error in debug endpoint:', error);
      return NextResponse.json(
        { error: 'Failed to debug asset', details: error.message },
        { status: 500 }
      );
    }
  })(request);
}
