/**
 * Delete Notification API Route
 * 
 * DELETE /api/notifications/[id] - Delete a notification
 * 
 * Requirements: 16.6
 * 
 * Key Features:
 * - Delete individual notification
 * - Verify user owns the notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { NotificationService } from '@/lib/services/NotificationService';
import prisma from '@/lib/prisma';

const notificationService = new NotificationService(prisma as any);

/**
 * DELETE /api/notifications/[id]
 * 
 * Delete a notification
 * 
 * Response:
 * {
 *   message: string;
 * }
 * 
 * Errors:
 * - 400: Invalid notification ID
 * - 401: Unauthorized
 * - 403: Forbidden (notification doesn't belong to user)
 * - 404: Notification not found
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    try {
      const { id: notificationId } = await params;

      if (!notificationId) {
        return NextResponse.json(
          { error: 'Notification ID is required' },
          { status: 400 }
        );
      }

      // Delete notification
      await notificationService.deleteNotification(notificationId, user.id);

      return NextResponse.json({
        message: 'Notification deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);

      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }
  })(request);
}
