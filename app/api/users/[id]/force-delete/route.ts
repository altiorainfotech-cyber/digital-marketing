import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { UserService } from '@/lib/services/UserService';
import { AuditService } from '@/lib/services/AuditService';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const userService = new UserService(prisma as any, auditService);

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
 * Force delete user endpoint - permanently removes user and all related data
 * This is a destructive operation that should be used with caution
 * 
 * @route DELETE /api/users/[id]/force-delete
 * @access Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async (req, { user }) => {
    try {
      const { id: userId } = await params;

      // Prevent self-deletion
      if (userId === user.id) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Delete user and all related data
      await userService.deleteUser(userId, user.id, ipAddress, userAgent);

      return NextResponse.json({
        success: true,
        message: 'User and all related data permanently deleted',
      });
    } catch (error: any) {
      console.error('Error force deleting user:', error);

      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to force delete user' },
        { status: 500 }
      );
    }
  })(request);
}
