/**
 * Carousel Bulk Download API Route
 * POST /api/assets/[id]/download-carousel - Download all items in a carousel as a ZIP
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AuditService } from '@/lib/services/AuditService';
import { StorageService } from '@/lib/services/StorageService';
import { Platform as PrismaPlatform, AssetType } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';
import { getStorageConfig } from '@/lib/config';
import JSZip from 'jszip';

const auditService = new AuditService(prisma as any);
const storageConfig = getStorageConfig();
const storageService = new StorageService(storageConfig);

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
 * POST /api/assets/[id]/download-carousel
 * 
 * Download all carousel items as a ZIP file
 */
export async function POST(
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

      // Parse request body
      const body = await request.json().catch(() => ({}));
      const { platforms } = body;

      // Validate platforms array if provided
      if (platforms && Array.isArray(platforms)) {
        const invalidPlatforms = platforms.filter(
          (p: string) => !Object.values(PrismaPlatform).includes(p as PrismaPlatform)
        );
        if (invalidPlatforms.length > 0) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              fields: {
                platforms: `Invalid platforms: ${invalidPlatforms.join(', ')}`,
              },
            },
            { status: 400 }
          );
        }
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

      // Fetch carousel items
      const items = await prisma.carouselItem.findMany({
        where: { carouselId: assetId },
        orderBy: { order: 'asc' },
      });

      if (items.length === 0) {
        return NextResponse.json(
          { error: 'No items found in carousel' },
          { status: 404 }
        );
      }

      console.log(`[Carousel Download] Generating ZIP for ${items.length} items`);

      // Create ZIP file
      const zip = new JSZip();

      // Download each item and add to ZIP
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        try {
          // Generate signed URL for the item
          const signedUrlResponse = await storageService.generateSignedUrl({
            storageUrl: item.storageUrl,
            expiresIn: 300, // 5 minutes should be enough for ZIP creation
          });

          // Fetch the file content
          const fileResponse = await fetch(signedUrlResponse.signedUrl);
          if (!fileResponse.ok) {
            console.error(`Failed to fetch item ${item.id}:`, fileResponse.status);
            continue;
          }

          const fileBuffer = await fileResponse.arrayBuffer();
          
          // Extract file extension from storage URL or use mimeType
          const extension = item.storageUrl.split('.').pop() || 
                          (item.mimeType?.split('/')[1]) || 
                          'bin';
          
          // Add file to ZIP with a numbered filename
          const filename = `${String(i + 1).padStart(3, '0')}_${item.itemType.toLowerCase()}.${extension}`;
          zip.file(filename, fileBuffer);
          
          console.log(`[Carousel Download] Added ${filename} to ZIP`);
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error);
          // Continue with other items even if one fails
        }
      }

      // Generate ZIP file
      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Log download in database
      await prisma.assetDownload.create({
        data: {
          assetId,
          downloadedById: user.id,
          platforms: platforms || [],
          downloadedAt: new Date(),
        },
      });

      // Log in audit
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);
      
      await auditService.logAssetDownload(
        user.id,
        assetId,
        {
          operation: 'carousel_bulk_download',
          platforms: platforms || null,
          assetTitle: asset.title,
          assetType: asset.assetType,
          itemCount: items.length,
          userRole: user.role,
        },
        ipAddress,
        userAgent
      );

      console.log(`[Carousel Download] ZIP created successfully, size: ${zipBuffer.length} bytes`);

      // Return ZIP file
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${asset.title.replace(/[^a-z0-9]/gi, '_')}_carousel.zip"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      });
    } catch (error: any) {
      console.error('[Carousel Download] Error:', error);
      return NextResponse.json(
        { error: 'Failed to create carousel download', details: error.message },
        { status: 500 }
      );
    }
  })(request);
}
