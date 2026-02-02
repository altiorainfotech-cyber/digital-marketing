/**
 * User Reactivation API Route
 * 
 * POST /api/users/[id]/reactivate - Reactivate user account (Admin only)
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async (req, { user }) => {
    try {
      const { id: userId } = await params;

      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      const reactivatedUser = await userService.reactivateUser(
        userId,
        user.id,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: 'User reactivated successfully',
        user: reactivatedUser,
      });
    } catch (error: any) {
      console.error('Error reactivating user:', error);

      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message === 'User is already active') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to reactivate user' },
        { status: 500 }
      );
    }
  })(request);
}
