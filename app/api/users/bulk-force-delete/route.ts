import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { UserService } from '@/lib/services/UserService';
import { getIpAddress, getUserAgent } from '@/lib/utils/errorHandling';

/**
 * Bulk force delete users endpoint - permanently removes multiple users and all their related data
 * This is a destructive operation that should be used with extreme caution
 * 
 * @route POST /api/users/bulk-force-delete
 * @access Admin only
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, user: any) => {
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

      const userService = new UserService();
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      const results = {
        success: [] as string[],
        failed: [] as { id: string; error: string }[],
      };

      // Process each user deletion
      for (const userId of userIds) {
        try {
          await userService.forceDeleteUser(userId, user.id, ipAddress, userAgent);
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
  },
  { requiredRole: 'ADMIN' }
);
