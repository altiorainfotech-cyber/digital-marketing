import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { UserService } from '@/lib/services/UserService';
import { getIpAddress, getUserAgent } from '@/lib/utils/errorHandling';

/**
 * Force delete user endpoint - permanently removes user and all related data
 * This is a destructive operation that should be used with caution
 * 
 * @route DELETE /api/users/[id]/force-delete
 * @access Admin only
 */
export const DELETE = withAuth(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    user: any
  ) => {
    try {
      const { id: userId } = await context.params;
      const userService = new UserService();

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

      // Force delete user and all related data
      await userService.forceDeleteUser(userId, user.id, ipAddress, userAgent);

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
  },
  { requiredRole: 'ADMIN' }
);
