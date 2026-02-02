/**
 * NotificationService
 * 
 * Manages in-app notifications for users.
 * Creates notifications for key events like asset uploads, approvals, rejections, and sharing.
 * 
 * Requirements: 3.8, 5.5, 16.1-16.6
 * 
 * Key Features:
 * - Create notifications for Admin on SEO asset upload
 * - Create notifications for uploader on status change (approval/rejection)
 * - Create notifications for asset sharing
 * - Store notifications in database
 * - Support marking notifications as read
 * - Support filtering and querying notifications
 */

import { PrismaClient, NotificationType, ResourceType, AssetStatus } from '@/app/generated/prisma';
import { 
  UserRole
} from '@/types';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedResourceType?: ResourceType;
  relatedResourceId?: string;
}

export interface NotificationResult {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedResourceType?: ResourceType;
  relatedResourceId?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationQuery {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a notification
   * 
   * Requirements: 16.1-16.6
   * 
   * @param params - Notification parameters
   * @returns The created notification
   */
  async createNotification(params: CreateNotificationParams): Promise<NotificationResult> {
    const {
      userId,
      type,
      title,
      message,
      relatedResourceType,
      relatedResourceId,
    } = params;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedResourceType: relatedResourceType || null,
        relatedResourceId: relatedResourceId || null,
        isRead: false,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        message: true,
        relatedResourceType: true,
        relatedResourceId: true,
        isRead: true,
        createdAt: true,
        readAt: true,
      },
    });

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedResourceType: notification.relatedResourceType || undefined,
      relatedResourceId: notification.relatedResourceId || undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt || undefined,
    };
  }

  /**
   * Notify all Admin users about a new SEO asset upload
   * 
   * Requirements: 3.8, 3.10 - Notify all Admins when SEO asset is submitted for review
   * 
   * @param assetId - ID of the uploaded asset
   * @param assetTitle - Title of the uploaded asset
   * @param uploaderId - ID of the user who uploaded the asset
   * @returns Array of created notifications
   */
  async notifyAdminsOfUpload(
    assetId: string,
    assetTitle: string,
    uploaderId: string
  ): Promise<NotificationResult[]> {
    // Get uploader info
    const uploader = await this.prisma.user.findUnique({
      where: { id: uploaderId },
      select: { name: true },
    });

    const uploaderName = uploader?.name || 'A user';

    // Get all Admin users
    const admins = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
      },
    });

    // Create notifications for all Admins
    const notifications = await Promise.all(
      admins.map((admin) =>
        this.createNotification({
          userId: admin.id,
          type: NotificationType.ASSET_UPLOADED,
          title: 'New Asset Pending Review',
          message: `${uploaderName} submitted "${assetTitle}" for review.`,
          relatedResourceType: ResourceType.ASSET,
          relatedResourceId: assetId,
        })
      )
    );

    return notifications;
  }

  /**
   * Notify uploader about asset approval
   * 
   * Requirements: 5.5 - Create notification for uploader when asset status changes
   * 
   * @param assetId - ID of the approved asset
   * @param assetTitle - Title of the approved asset
   * @param uploaderId - ID of the uploader
   * @param reviewerId - ID of the reviewer who approved
   * @returns The created notification
   */
  async notifyUploaderOfApproval(
    assetId: string,
    assetTitle: string,
    uploaderId: string,
    reviewerId: string
  ): Promise<NotificationResult> {
    // Get reviewer info
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      select: { name: true },
    });

    const reviewerName = reviewer?.name || 'An admin';

    return await this.createNotification({
      userId: uploaderId,
      type: NotificationType.ASSET_APPROVED,
      title: 'Asset Approved',
      message: `${reviewerName} approved your asset "${assetTitle}".`,
      relatedResourceType: ResourceType.ASSET,
      relatedResourceId: assetId,
    });
  }

  /**
   * Notify uploader about asset rejection
   * 
   * Requirements: 5.5 - Create notification for uploader when asset status changes
   * 
   * @param assetId - ID of the rejected asset
   * @param assetTitle - Title of the rejected asset
   * @param uploaderId - ID of the uploader
   * @param reviewerId - ID of the reviewer who rejected
   * @param reason - Rejection reason
   * @returns The created notification
   */
  async notifyUploaderOfRejection(
    assetId: string,
    assetTitle: string,
    uploaderId: string,
    reviewerId: string,
    reason: string
  ): Promise<NotificationResult> {
    // Get reviewer info
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      select: { name: true },
    });

    const reviewerName = reviewer?.name || 'An admin';

    return await this.createNotification({
      userId: uploaderId,
      type: NotificationType.ASSET_REJECTED,
      title: 'Asset Rejected',
      message: `${reviewerName} rejected your asset "${assetTitle}". Reason: ${reason}`,
      relatedResourceType: ResourceType.ASSET,
      relatedResourceId: assetId,
    });
  }

  /**
   * Notify user about asset being shared with them
   * 
   * Requirements: 16.3 - Create notification when Doc asset is shared
   * 
   * @param assetId - ID of the shared asset
   * @param assetTitle - Title of the shared asset
   * @param sharedWithId - ID of the user receiving the share
   * @param sharedById - ID of the user sharing the asset
   * @returns The created notification
   */
  async notifyUserOfShare(
    assetId: string,
    assetTitle: string,
    sharedWithId: string,
    sharedById: string
  ): Promise<NotificationResult> {
    // Get sharer info
    const sharer = await this.prisma.user.findUnique({
      where: { id: sharedById },
      select: { name: true },
    });

    const sharerName = sharer?.name || 'A user';

    return await this.createNotification({
      userId: sharedWithId,
      type: NotificationType.ASSET_SHARED,
      title: 'Asset Shared With You',
      message: `${sharerName} shared "${assetTitle}" with you.`,
      relatedResourceType: ResourceType.ASSET,
      relatedResourceId: assetId,
    });
  }

  /**
   * Mark a notification as read
   * 
   * Requirements: 16.5 - Mark notification as read
   * 
   * @param notificationId - ID of the notification
   * @param userId - ID of the user (for verification)
   * @returns The updated notification
   * @throws Error if notification not found or user doesn't own it
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationResult> {
    // Check if notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to mark this notification as read');
    }

    // Update notification
    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        message: true,
        relatedResourceType: true,
        relatedResourceId: true,
        isRead: true,
        createdAt: true,
        readAt: true,
      },
    });

    return {
      id: updatedNotification.id,
      userId: updatedNotification.userId,
      type: updatedNotification.type,
      title: updatedNotification.title,
      message: updatedNotification.message,
      relatedResourceType: updatedNotification.relatedResourceType || undefined,
      relatedResourceId: updatedNotification.relatedResourceId || undefined,
      isRead: updatedNotification.isRead,
      createdAt: updatedNotification.createdAt,
      readAt: updatedNotification.readAt || undefined,
    };
  }

  /**
   * Mark all notifications as read for a user
   * 
   * Requirements: 16.5 - Mark all notifications as read
   * 
   * @param userId - ID of the user
   * @returns Count of updated notifications
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete a notification
   * 
   * Requirements: 16.6 - Delete notification
   * 
   * @param notificationId - ID of the notification
   * @param userId - ID of the user (for verification)
   * @throws Error if notification not found or user doesn't own it
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // Check if notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to delete this notification');
    }

    // Delete notification
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Get notifications for a user with filtering
   * 
   * Requirements: 16.4, 16.6 - Display notifications with filtering
   * 
   * @param query - Query parameters
   * @returns Array of notifications
   */
  async getNotifications(query: NotificationQuery): Promise<NotificationResult[]> {
    const {
      userId,
      isRead,
      type,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = query;

    const where: any = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        message: true,
        relatedResourceType: true,
        relatedResourceId: true,
        isRead: true,
        createdAt: true,
        readAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedResourceType: notification.relatedResourceType || undefined,
      relatedResourceId: notification.relatedResourceId || undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt || undefined,
    }));
  }

  /**
   * Get unread notification count for a user
   * 
   * Requirements: 16.4 - Display unread notifications prominently
   * 
   * @param userId - ID of the user
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
