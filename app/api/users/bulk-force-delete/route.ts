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
 * Bulk force delete users endpoint - permanently removes multiple users and all their related data
 * This is a destructive operation that should be used with extreme caution
 * 
 * @route POST /api/users/bulk-force-delete
 * @access Admin only
 */
export async function POST(request: NextRequest) {
  return withAdmin(async (req, { user }) => {
    try {
      const { userIds } = await request.json();

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json(
          { error: 'userIds must be a non-empty array' },
          { status: 400 }
        );
      }

      // Prevent self-deletion
      if (userIds.includes(user.id)) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        );
      }

      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      const results = {
        success: [] as string[],
        failed: [] as { id: string; error: string }[],
      };

      // Process each user deletion
      for (const userId of userIds) {
        try {
          await userService.deleteUser(userId, user.id, ipAddress, userAgent);
          results.success.push(userId);
        } catch (error: any) {
          results.failed.push({
            id: userId,
            error: error.message || 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Force deleted ${results.success.length} user(s)`,
        results,
      });
    } catch (error: any) {
      console.error('Error in bulk force delete:', error);
      return NextResponse.json(
        { error: 'Failed to process bulk force delete' },
        { status: 500 }
      );
    }
  })(request);
}
