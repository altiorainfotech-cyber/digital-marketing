/**
 * AuditRepository
 * 
 * Data access layer for audit log operations.
 * Provides query methods with filtering and pagination support.
 * 
 * Requirements: 12.3
 * 
 * Key Features:
 * - Query audit logs with filtering by user, action, and date range
 * - Pagination support for large result sets
 * - Efficient database queries with proper indexing
 */

import { PrismaClient, AuditLog, Prisma } from '@/app/generated/prisma';
import { AuditAction, ResourceType } from '@/types';

export interface AuditLogQuery {
  userId?: string;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AuditRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Query audit logs with filtering and pagination
   * 
   * Supports filtering by:
   * - userId: Filter logs by specific user
   * - action: Filter by audit action type
   * - resourceType: Filter by resource type
   * - resourceId: Filter by specific resource ID
   * - startDate: Filter logs created on or after this date
   * - endDate: Filter logs created on or before this date
   * 
   * Supports pagination:
   * - limit: Number of results per page (default: 20, max: 100)
   * - offset: Number of results to skip
   * 
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated audit logs with metadata
   */
  async queryAuditLogs(query: AuditLogQuery): Promise<PaginatedAuditLogs> {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = query;

    // Validate and cap limit
    const validLimit = Math.min(Math.max(1, limit), 100);

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Execute queries in parallel for better performance
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: validLimit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          asset: {
            select: {
              id: true,
              title: true,
              assetType: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / validLimit);
    const page = Math.floor(offset / validLimit) + 1;

    return {
      logs,
      total,
      page,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Get audit logs by user ID
   * 
   * @param userId - ID of the user
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated audit logs for the user
   */
  async getAuditLogsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedAuditLogs> {
    return this.queryAuditLogs({ userId, limit, offset });
  }

  /**
   * Get audit logs by action type
   * 
   * @param action - Audit action type
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated audit logs for the action
   */
  async getAuditLogsByAction(
    action: AuditAction,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedAuditLogs> {
    return this.queryAuditLogs({ action, limit, offset });
  }

  /**
   * Get audit logs by date range
   * 
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated audit logs within the date range
   */
  async getAuditLogsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedAuditLogs> {
    return this.queryAuditLogs({ startDate, endDate, limit, offset });
  }

  /**
   * Get audit logs by resource
   * 
   * @param resourceType - Type of resource
   * @param resourceId - ID of the resource
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated audit logs for the resource
   */
  async getAuditLogsByResource(
    resourceType: ResourceType,
    resourceId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedAuditLogs> {
    return this.queryAuditLogs({ resourceType, resourceId, limit, offset });
  }

  /**
   * Get a single audit log by ID
   * 
   * @param id - ID of the audit log
   * @returns The audit log or null if not found
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        asset: {
          select: {
            id: true,
            title: true,
            assetType: true,
          },
        },
      },
    });
  }

  /**
   * Get recent audit logs
   * 
   * Returns the most recent audit logs across all users and actions.
   * Useful for admin dashboards and monitoring.
   * 
   * @param limit - Number of results to return (default: 50)
   * @returns Recent audit logs
   */
  async getRecentAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    const validLimit = Math.min(Math.max(1, limit), 100);

    return this.prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: validLimit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        asset: {
          select: {
            id: true,
            title: true,
            assetType: true,
          },
        },
      },
    });
  }

  /**
   * Get audit log count by filters
   * 
   * Returns the total count of audit logs matching the filters.
   * Useful for analytics and reporting.
   * 
   * @param query - Query parameters for filtering
   * @returns Total count of matching audit logs
   */
  async getAuditLogCount(query: Omit<AuditLogQuery, 'limit' | 'offset'>): Promise<number> {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
    } = query;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (resourceId) {
      where.resourceId = resourceId;
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

    return this.prisma.auditLog.count({ where });
  }

  /**
   * Get audit logs for a specific asset
   * 
   * Returns all audit logs related to a specific asset.
   * Useful for tracking asset history.
   * 
   * @param assetId - ID of the asset
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated audit logs for the asset
   */
  async getAuditLogsForAsset(
    assetId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedAuditLogs> {
    const validLimit = Math.min(Math.max(1, limit), 100);

    const where: Prisma.AuditLogWhereInput = {
      OR: [
        { assetId },
        { resourceId: assetId, resourceType: 'ASSET' },
      ],
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: validLimit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          asset: {
            select: {
              id: true,
              title: true,
              assetType: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / validLimit);
    const page = Math.floor(offset / validLimit) + 1;

    return {
      logs,
      total,
      page,
      limit: validLimit,
      totalPages,
    };
  }
}
