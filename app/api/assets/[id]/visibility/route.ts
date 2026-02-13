/**
 * Asset Visibility Update API Route
 * 
 * PATCH /api/assets/[id]/visibility - Update asset visibility (Admin only)
 * 
 * Requirements: Admin-only visibility control for approved assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { AuditService } from '@/lib/services/AuditService';
import { UserRole, VisibilityLevel } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);

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
 * PATCH /api/assets/[id]/visibility
 * 
 * Update asset visibility level (Admin only)
 * 
 * Request Body:
 * {
 *   visibility: VisibilityLevel;
 *   allowedRole?: UserRole; // Required when visibility is ROLE
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   visibility: VisibilityLevel;
 *   allowedRole?: UserRole;
 *   message: string;
 * }
 * 
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Asset not found
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: assetId } = await params;

      // Only admins can update visibility
      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only administrators can update asset visibility' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { visibility, allowedRole } = body;

    // Validate visibility level
    if (!visibility || !Object.values(VisibilityLevel).includes(visibility)) {
      return NextResponse.json(
        { error: 'Valid visibility level is required' },
        { status: 400 }
      );
    }

    // Validate allowedRole if visibility is ROLE
    if (visibility === VisibilityLevel.ROLE) {
      if (!allowedRole || !Object.values(UserRole).includes(allowedRole)) {
        return NextResponse.json(
          { error: 'Valid role is required when visibility is ROLE' },
          { status: 400 }
        );
      }
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const previousVisibility = asset.visibility;

    // Update asset visibility
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        visibility,
        ...(visibility === VisibilityLevel.ROLE && allowedRole ? { allowedRole } : {}),
      },
    });

    // Log visibility change
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    await auditService.logVisibilityChange(
      user.id,
      assetId,
      {
        previousVisibility,
        newVisibility: visibility,
        ...(allowedRole ? { allowedRole } : {}),
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      id: updatedAsset.id,
      visibility: updatedAsset.visibility,
      allowedRole: updatedAsset.allowedRole,
      message: 'Visibility updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating asset visibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update visibility' },
      { status: 500 }
    );
  }
  })(request);
}
