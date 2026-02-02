/**
 * Mark Notification as Read API Route
 * 
 * PATCH /api/notifications/[id]/read - Mark a notification as read
 * 
 * Requirements: 16.5
 * 
 * Key Features:
 * - Mark individual notification as read
 * - Verify user owns the notification
 * - Update readAt timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { NotificationService } from '@/lib/services/NotificationService';
import prisma from '@/lib/prisma';

const notificationService = new NotificationService(prisma as any);

/**
 * PATCH /api/notifications/[id]/read
 * 
 * Mark a notification as read
 * 
 * Response:
 * {
 *   id: string;
 *   userId: string;
 *   type: string;
 *   title: string;
 *   message: string;
 *   relatedResourceType?: string;
 *   relatedResourceId?: string;
 *   isRead: boolean;
 *   createdAt: Date;
 *   readAt: Date;
 * }
 * 
 * Errors:
 * - 400: Invalid notification ID
 * - 401: Unauthorized
 * - 403: Forbidden (notification doesn't belong to user)
 * - 404: Notification not found
 * - 500: Internal server error
 */
export async function PATCH(
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

      // Mark notification as read
      const notification = await notificationService.markAsRead(notificationId, user.id);

      return NextResponse.json(notification);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);

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
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }
  })(request);
}
