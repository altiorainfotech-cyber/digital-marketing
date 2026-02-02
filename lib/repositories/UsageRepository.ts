/**
 * UsageRepository
 * 
 * Data access layer for platform usage operations.
 * Provides query methods for usage history and aggregation for analytics.
 * 
 * Requirements: 8.5
 * 
 * Key Features:
 * - Query usage history with filtering
 * - Aggregate usage statistics by platform, campaign, date range
 * - Efficient database queries with proper indexing
 */

import { PrismaClient, PlatformUsage as PrismaPlatformUsage, Prisma } from '@/app/generated/prisma';
import { Platform, PlatformUsage } from '@/types';

export interface UsageQuery {
  assetId?: string;
  platform?: Platform;
  campaignName?: string;
  loggedById?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedUsages {
  usages: PlatformUsage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlatformStats {
  platform: Platform;
  count: number;
  percentage: number;
}

export interface CampaignStats {
  campaignName: string;
  count: number;
  platforms: Platform[];
  assets: string[];
}

export interface UsageAnalytics {
  totalUsages: number;
  platformStats: PlatformStats[];
  topCampaigns: CampaignStats[];
  usagesByDate: Record<string, number>;
}

export class UsageRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Query platform usages with filtering and pagination
   * 
   * Supports filtering by:
   * - assetId: Filter usages by specific asset
   * - platform: Filter by platform type
   * - campaignName: Filter by campaign name (partial match)
   * - loggedById: Filter by user who logged the usage
   * - startDate: Filter usages on or after this date
   * - endDate: Filter usages on or before this date
   * 
   * Supports pagination:
   * - limit: Number of results per page (default: 20, max: 100)
   * - offset: Number of results to skip
   * 
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated platform usages with metadata
   */
  async queryUsages(query: UsageQuery): Promise<PaginatedUsages> {
    const {
      assetId,
      platform,
      campaignName,
      loggedById,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = query;

    // Validate and cap limit
    const validLimit = Math.min(Math.max(1, limit), 100);

    // Build where clause
    const where: Prisma.PlatformUsageWhereInput = {};

    if (assetId) {
      where.assetId = assetId;
    }

    if (platform) {
      where.platform = platform;
    }

    if (campaignName) {
      where.campaignName = {
        contains: campaignName,
        mode: 'insensitive',
      };
    }

    if (loggedById) {
      where.loggedById = loggedById;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.usedAt = {};
      if (startDate) {
        where.usedAt.gte = startDate;
      }
      if (endDate) {
        where.usedAt.lte = endDate;
      }
    }

    // Execute queries in parallel for better performance
    const [usages, total] = await Promise.all([
      this.prisma.platformUsage.findMany({
        where,
        orderBy: {
          usedAt: 'desc',
        },
        take: validLimit,
        skip: offset,
        include: {
          asset: {
            select: {
              id: true,
              title: true,
              assetType: true,
            },
          },
          loggedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.platformUsage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / validLimit);
    const page = Math.floor(offset / validLimit) + 1;

    return {
      usages: usages.map((usage) => ({
        id: usage.id,
        assetId: usage.assetId,
        platform: usage.platform as Platform,
        campaignName: usage.campaignName,
        postUrl: usage.postUrl || undefined,
        usedAt: usage.usedAt,
        loggedById: usage.loggedById,
      })),
      total,
      page,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Get usage analytics for reporting
   * 
   * Provides aggregated statistics including:
   * - Total usage count
   * - Platform breakdown with percentages
   * - Top campaigns by usage count
   * - Usage trends by date
   * 
   * Requirement 8.5: Aggregation for analytics
   * 
   * @param filters - Optional filters (assetId, startDate, endDate)
   * @returns Usage analytics
   */
  async getUsageAnalytics(filters?: {
    assetId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UsageAnalytics> {
    const where: Prisma.PlatformUsageWhereInput = {};

    if (filters?.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.usedAt = {};
      if (filters.startDate) {
        where.usedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.usedAt.lte = filters.endDate;
      }
    }

    // Get all usages matching filters
    const usages = await this.prisma.platformUsage.findMany({
      where,
      select: {
        id: true,
        platform: true,
        campaignName: true,
        assetId: true,
        usedAt: true,
      },
    });

    const totalUsages = usages.length;

    // Calculate platform stats
    const platformCounts: Record<string, number> = {};
    usages.forEach((usage) => {
      platformCounts[usage.platform] = (platformCounts[usage.platform] || 0) + 1;
    });

    const platformStats: PlatformStats[] = Object.entries(platformCounts).map(
      ([platform, count]) => ({
        platform: platform as Platform,
        count,
        percentage: totalUsages > 0 ? (count / totalUsages) * 100 : 0,
      })
    );

    // Sort by count descending
    platformStats.sort((a, b) => b.count - a.count);

    // Calculate campaign stats
    const campaignMap: Record<
      string,
      { count: number; platforms: Set<Platform>; assets: Set<string> }
    > = {};

    usages.forEach((usage) => {
      if (!campaignMap[usage.campaignName]) {
        campaignMap[usage.campaignName] = {
          count: 0,
          platforms: new Set(),
          assets: new Set(),
        };
      }
      campaignMap[usage.campaignName].count++;
      campaignMap[usage.campaignName].platforms.add(usage.platform as Platform);
      campaignMap[usage.campaignName].assets.add(usage.assetId);
    });

    const topCampaigns: CampaignStats[] = Object.entries(campaignMap)
      .map(([campaignName, data]) => ({
        campaignName,
        count: data.count,
        platforms: Array.from(data.platforms),
        assets: Array.from(data.assets),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 campaigns

    // Calculate usages by date
    const usagesByDate: Record<string, number> = {};
    usages.forEach((usage) => {
      const dateKey = usage.usedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      usagesByDate[dateKey] = (usagesByDate[dateKey] || 0) + 1;
    });

    return {
      totalUsages,
      platformStats,
      topCampaigns,
      usagesByDate,
    };
  }

  /**
   * Get usages by asset
   * 
   * @param assetId - ID of the asset
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated usages for the asset
   */
  async getUsagesByAsset(
    assetId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedUsages> {
    return this.queryUsages({ assetId, limit, offset });
  }

  /**
   * Get usages by platform
   * 
   * @param platform - Platform to filter by
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated usages for the platform
   */
  async getUsagesByPlatform(
    platform: Platform,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedUsages> {
    return this.queryUsages({ platform, limit, offset });
  }

  /**
   * Get usages by campaign
   * 
   * @param campaignName - Campaign name to filter by (partial match)
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated usages for the campaign
   */
  async getUsagesByCampaign(
    campaignName: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedUsages> {
    return this.queryUsages({ campaignName, limit, offset });
  }

  /**
   * Get usages by date range
   * 
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Paginated usages within the date range
   */
  async getUsagesByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedUsages> {
    return this.queryUsages({ startDate, endDate, limit, offset });
  }

  /**
   * Get usage count by filters
   * 
   * @param filters - Optional filters (assetId, platform, campaignName, startDate, endDate)
   * @returns Total count of matching usages
   */
  async getUsageCount(filters?: {
    assetId?: string;
    platform?: Platform;
    campaignName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const where: Prisma.PlatformUsageWhereInput = {};

    if (filters?.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters?.platform) {
      where.platform = filters.platform;
    }

    if (filters?.campaignName) {
      where.campaignName = {
        contains: filters.campaignName,
        mode: 'insensitive',
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.usedAt = {};
      if (filters.startDate) {
        where.usedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.usedAt.lte = filters.endDate;
      }
    }

    return this.prisma.platformUsage.count({ where });
  }

  /**
   * Get recent usages
   * 
   * Returns the most recent platform usages across all assets.
   * Useful for dashboards and monitoring.
   * 
   * @param limit - Number of results to return (default: 50)
   * @returns Recent platform usages
   */
  async getRecentUsages(limit: number = 50): Promise<PlatformUsage[]> {
    const validLimit = Math.min(Math.max(1, limit), 100);

    const usages = await this.prisma.platformUsage.findMany({
      orderBy: {
        usedAt: 'desc',
      },
      take: validLimit,
      include: {
        asset: {
          select: {
            id: true,
            title: true,
            assetType: true,
          },
        },
        loggedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return usages.map((usage) => ({
      id: usage.id,
      assetId: usage.assetId,
      platform: usage.platform as Platform,
      campaignName: usage.campaignName,
      postUrl: usage.postUrl || undefined,
      usedAt: usage.usedAt,
      loggedById: usage.loggedById,
    }));
  }

  /**
   * Get platform breakdown for an asset
   * 
   * Returns usage count per platform for a specific asset.
   * 
   * @param assetId - ID of the asset
   * @returns Platform breakdown with counts
   */
  async getPlatformBreakdown(assetId: string): Promise<PlatformStats[]> {
    const usages = await this.prisma.platformUsage.findMany({
      where: { assetId },
      select: {
        platform: true,
      },
    });

    const totalUsages = usages.length;
    const platformCounts: Record<string, number> = {};

    usages.forEach((usage) => {
      platformCounts[usage.platform] = (platformCounts[usage.platform] || 0) + 1;
    });

    const platformStats: PlatformStats[] = Object.entries(platformCounts).map(
      ([platform, count]) => ({
        platform: platform as Platform,
        count,
        percentage: totalUsages > 0 ? (count / totalUsages) * 100 : 0,
      })
    );

    // Sort by count descending
    platformStats.sort((a, b) => b.count - a.count);

    return platformStats;
  }

  /**
   * Get top campaigns
   * 
   * Returns the most used campaigns across all assets.
   * 
   * @param limit - Number of campaigns to return (default: 10)
   * @returns Top campaigns with usage counts
   */
  async getTopCampaigns(limit: number = 10): Promise<CampaignStats[]> {
    const validLimit = Math.min(Math.max(1, limit), 50);

    const usages = await this.prisma.platformUsage.findMany({
      select: {
        campaignName: true,
        platform: true,
        assetId: true,
      },
    });

    const campaignMap: Record<
      string,
      { count: number; platforms: Set<Platform>; assets: Set<string> }
    > = {};

    usages.forEach((usage) => {
      if (!campaignMap[usage.campaignName]) {
        campaignMap[usage.campaignName] = {
          count: 0,
          platforms: new Set(),
          assets: new Set(),
        };
      }
      campaignMap[usage.campaignName].count++;
      campaignMap[usage.campaignName].platforms.add(usage.platform as Platform);
      campaignMap[usage.campaignName].assets.add(usage.assetId);
    });

    const topCampaigns: CampaignStats[] = Object.entries(campaignMap)
      .map(([campaignName, data]) => ({
        campaignName,
        count: data.count,
        platforms: Array.from(data.platforms),
        assets: Array.from(data.assets),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, validLimit);

    return topCampaigns;
  }
}
