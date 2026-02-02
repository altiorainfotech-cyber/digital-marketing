/**
 * Bulk User Deactivation API Route
 * 
 * POST /api/users/bulk-deactivate - Deactivate multiple users (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { UserService } from '@/lib/services/UserService';
import { AuditService } from '@/lib/services/AuditService';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const userService = new UserService(prisma as any, auditService);

function getIpAddress(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

export const POST = withAdmin(async (request, { user }) => {
  try {
    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Prevent self-deactivation
    if (userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    const results = {
      success: [] as string[],
      failed: [] as { userId: string; error: string }[],
    };

    // Deactivate each user
    for (const userId of userIds) {
      try {
        await userService.deactivateUser(userId, user.id, ipAddress, userAgent);
        results.success.push(userId);
      } catch (error: any) {
        results.failed.push({
          userId,
          error: error.message || 'Failed to deactivate user',
        });
      }
    }

    return NextResponse.json({
      message: `Deactivated ${results.success.length} of ${userIds.length} users`,
      results,
    });
  } catch (error: any) {
    console.error('Error in bulk deactivation:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate users' },
      { status: 500 }
    );
  }
});
