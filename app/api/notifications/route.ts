/**
 * Notifications API Routes
 * 
 * GET /api/notifications - List user notifications with filtering
 * 
 * Requirements: 16.1-16.6
 * 
 * Key Features:
 * - List notifications for authenticated user
 * - Support filtering by read/unread status, type, and date range
 * - Return notifications in descending order by creation date
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { NotificationService } from '@/lib/services/NotificationService';
import { NotificationType } from '@/types';
import { NotificationType as PrismaNotificationType } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const notificationService = new NotificationService(prisma as any);

/**
 * GET /api/notifications
 * 
 * List notifications for the authenticated user with optional filtering
 * 
 * Query Parameters:
 * - isRead?: 'true' | 'false' (optional filter)
 * - type?: NotificationType (optional filter)
 * - startDate?: ISO date string (optional filter)
 * - endDate?: ISO date string (optional filter)
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 * 
 * Response:
 * {
 *   notifications: Array<{
 *     id: string;
 *     userId: string;
 *     type: string;
 *     title: string;
 *     message: string;
 *     relatedResourceType?: string;
 *     relatedResourceId?: string;
 *     isRead: boolean;
 *     createdAt: Date;
 *     readAt?: Date;
 *   }>;
 *   total: number;
 *   unreadCount: number;
 * }
 * 
 * Errors:
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET = withAuth(async (request, { user }) => {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const isReadParam = searchParams.get('isRead');
    const type = searchParams.get('type') as PrismaNotificationType | null;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Parse isRead parameter
    let isRead: boolean | undefined;
    if (isReadParam !== null) {
      if (isReadParam === 'true') {
        isRead = true;
      } else if (isReadParam === 'false') {
        isRead = false;
      } else {
        return NextResponse.json(
          { error: 'Invalid isRead parameter. Must be "true" or "false".' },
          { status: 400 }
        );
      }
    }

    // Validate type if provided
    if (type && !Object.values(PrismaNotificationType).includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid type parameter. Must be one of: ${Object.values(PrismaNotificationType).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Parse date parameters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate parameter. Must be a valid ISO date string.' },
          { status: 400 }
        );
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate parameter. Must be a valid ISO date string.' },
          { status: 400 }
        );
      }
    }

    // Parse pagination parameters
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 100.' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter. Must be 0 or greater.' },
        { status: 400 }
      );
    }

    // Get notifications
    const notifications = await notificationService.getNotifications({
      userId: user.id,
      isRead,
      type: type as NotificationType | undefined,
      startDate,
      endDate,
      limit,
      offset,
    });

    // Get unread count
    const unreadCount = await notificationService.getUnreadCount(user.id);

    return NextResponse.json({
      notifications,
      total: notifications.length,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
});
