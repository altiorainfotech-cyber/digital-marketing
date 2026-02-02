/**
 * Pending Assets API Route
 * 
 * GET /api/assets/pending - List pending assets for Admin review
 * 
 * Requirements: 5.1
 * 
 * Key Features:
 * - Admin-only access
 * - Returns all assets with PENDING_REVIEW status
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { ApprovalService } from '@/lib/services/ApprovalService';
import { AuditService } from '@/lib/services/AuditService';
import { UserRole } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const approvalService = new ApprovalService(prisma as any, auditService);

/**
 * GET /api/assets/pending
 * 
 * List all assets with PENDING_REVIEW status (Admin only)
 * 
 * Response:
 * {
 *   assets: Array<{
 *     id: string;
 *     title: string;
 *     status: string;
 *     visibility: string;
 *     approvedAt?: Date;
 *     approvedById?: string;
 *     rejectedAt?: Date;
 *     rejectedById?: string;
 *     rejectionReason?: string;
 *   }>;
 *   total: number;
 * }
 * 
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (non-Admin users)
 * - 500: Internal server error
 */
export const GET = withAuth(async (request, { user }) => {
  try {
    // Verify user is Admin
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    // Get pending assets
    const assets = await approvalService.getPendingAssets();

    return NextResponse.json({
      assets,
      total: assets.length,
    });
  } catch (error: any) {
    console.error('Error fetching pending assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending assets' },
      { status: 500 }
    );
  }
});
