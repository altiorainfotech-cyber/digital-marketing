/**
 * Mark All Notifications as Read API Route
 * 
 * PATCH /api/notifications/read-all - Mark all notifications as read
 * 
 * Requirements: 16.5
 * 
 * Key Features:
 * - Mark all unread notifications as read for the authenticated user
 * - Return count of updated notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { NotificationService } from '@/lib/services/NotificationService';
import prisma from '@/lib/prisma';

const notificationService = new NotificationService(prisma as any);

/**
 * PATCH /api/notifications/read-all
 * 
 * Mark all notifications as read for the authenticated user
 * 
 * Response:
 * {
 *   count: number; // Number of notifications marked as read
 *   message: string;
 * }
 * 
 * Errors:
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const PATCH = withAuth(async (request, { user }) => {
  try {
    // Mark all notifications as read
    const count = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({
      count,
      message: `${count} notification${count !== 1 ? 's' : ''} marked as read`,
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
});
