/**
 * UsageService
 * 
 * Manages platform usage tracking for assets.
 * Records where and when assets are used across different platforms.
 * 
 * Requirements: 8.1-8.6
 * 
 * Key Features:
 * - Logs platform usage with validation
 * - Requires platform selection, campaign name, and usage date
 * - Optionally accepts post/ad URL
 * - Records the user who logged the usage
 * - Integrates with AuditService for logging
 */

import { PrismaClient } from '@/app/generated/prisma';
import { Platform, PlatformUsage } from '@/types';
import { AuditService } from './AuditService';

export interface LogUsageParams {
  assetId: string;
  platform: Platform;
  campaignName: string;
  postUrl?: string;
  usedAt?: Date;
  loggedById: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UsageStats {
  assetId: string;
  totalUsages: number;
  platformBreakdown: Record<Platform, number>;
  recentUsages: PlatformUsage[];
}

export class UsageService {
  private prisma: PrismaClient;
  private auditService: AuditService;

  constructor(prisma: PrismaClient, auditService: AuditService) {
    this.prisma = prisma;
    this.auditService = auditService;
  }

  /**
   * Log platform usage for an asset
   * 
   * Validates:
   * - Platform is required (Requirement 8.1)
   * - Campaign name is required (Requirement 8.2)
   * - Usage date is required (Requirement 8.2)
   * - Post URL is optional (Requirement 8.3)
   * - Asset exists
   * 
   * Records:
   * - User who logged the usage (Requirement 8.4)
   * - Platform usage in database
   * - Audit log entry (Requirement 8.6)
   * 
   * @param params - Usage logging parameters
   * @returns The created platform usage record
   * @throws Error if validation fails or asset not found
   */
  async logUsage(params: LogUsageParams): Promise<PlatformUsage> {
    const {
      assetId,
      platform,
      campaignName,
      postUrl,
      usedAt,
      loggedById,
      ipAddress,
      userAgent,
    } = params;

    // Requirement 8.1: Platform is required
    if (!platform) {
      throw new Error('Platform is required');
    }

    // Validate platform value
    if (!Object.values(Platform).includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    // Requirement 8.2: Campaign name is required
    if (!campaignName || campaignName.trim().length === 0) {
      throw new Error('Campaign name is required');
    }

    // Requirement 8.2: Usage date is required (default to now if not provided)
    const finalUsedAt = usedAt || new Date();

    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        assetType: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: loggedById },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create platform usage record
    const usage = await this.prisma.platformUsage.create({
      data: {
        assetId,
        platform,
        campaignName: campaignName.trim(),
        postUrl: postUrl?.trim() || null,
        usedAt: finalUsedAt,
        loggedById,
      },
      select: {
        id: true,
        assetId: true,
        platform: true,
        campaignName: true,
        postUrl: true,
        usedAt: true,
        loggedById: true,
      },
    });

    // Log platform usage in audit log (Requirement 8.6)
    await this.auditService.createAuditLog({
      userId: loggedById,
      action: 'CREATE' as any,
      resourceType: 'ASSET' as any,
      resourceId: assetId,
      metadata: {
        operation: 'platform_usage',
        platform,
        campaignName: campaignName.trim(),
        postUrl: postUrl?.trim() || null,
        usedAt: finalUsedAt.toISOString(),
        assetTitle: asset.title,
        assetType: asset.assetType,
      },
      ipAddress,
      userAgent,
      assetId,
    });

    return {
      id: usage.id,
      assetId: usage.assetId,
      platform: usage.platform as Platform,
      campaignName: usage.campaignName,
      postUrl: usage.postUrl || undefined,
      usedAt: usage.usedAt,
      loggedById: usage.loggedById,
    };
  }

  /**
   * Get platform usage history for an asset
   * 
   * Requirement 8.5: Display all platform usage history
   * 
   * @param assetId - ID of the asset
   * @param limit - Number of results to return (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of platform usage records
   */
  async getUsageHistory(
    assetId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PlatformUsage[]> {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const usages = await this.prisma.platformUsage.findMany({
      where: { assetId },
      orderBy: {
        usedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        platform: true,
        campaignName: true,
        postUrl: true,
        usedAt: true,
        loggedById: true,
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
   * Get usage statistics for an asset
   * 
   * Provides aggregated statistics including:
   * - Total usage count
   * - Platform breakdown (count per platform)
   * - Recent usages
   * 
   * Requirement 8.5: Display platform usage history with analytics
   * 
   * @param assetId - ID of the asset
   * @param recentLimit - Number of recent usages to include (default: 10)
   * @returns Usage statistics
   */
  async getUsageStats(
    assetId: string,
    recentLimit: number = 10
  ): Promise<UsageStats> {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Get all usages for the asset
    const allUsages = await this.prisma.platformUsage.findMany({
      where: { assetId },
      select: {
        id: true,
        assetId: true,
        platform: true,
        campaignName: true,
        postUrl: true,
        usedAt: true,
        loggedById: true,
      },
      orderBy: {
        usedAt: 'desc',
      },
    });

    // Calculate total usages
    const totalUsages = allUsages.length;

    // Calculate platform breakdown
    const platformBreakdown: Record<Platform, number> = {
      [Platform.ADS]: 0,
      [Platform.X]: 0,
      [Platform.LINKEDIN]: 0,
      [Platform.INSTAGRAM]: 0,
      [Platform.META]: 0,
      [Platform.YOUTUBE]: 0,
      [Platform.SEO]: 0,
      [Platform.BLOGS]: 0,
      [Platform.SNAPCHAT]: 0,
    };

    allUsages.forEach((usage) => {
      const platform = usage.platform as Platform;
      if (platform in platformBreakdown) {
        platformBreakdown[platform]++;
      }
    });

    // Get recent usages
    const validLimit = Math.min(Math.max(1, recentLimit), 50);
    const recentUsages = allUsages.slice(0, validLimit).map((usage) => ({
      id: usage.id,
      assetId: usage.assetId,
      platform: usage.platform as Platform,
      campaignName: usage.campaignName,
      postUrl: usage.postUrl || undefined,
      usedAt: usage.usedAt,
      loggedById: usage.loggedById,
    }));

    return {
      assetId,
      totalUsages,
      platformBreakdown,
      recentUsages,
    };
  }

  /**
   * Get usage count for an asset
   * 
   * @param assetId - ID of the asset
   * @returns Total number of platform usages
   */
  async getUsageCount(assetId: string): Promise<number> {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    return await this.prisma.platformUsage.count({
      where: { assetId },
    });
  }

  /**
   * Get usages by platform
   * 
   * @param platform - Platform to filter by
   * @param limit - Number of results to return (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of platform usage records
   */
  async getUsagesByPlatform(
    platform: Platform,
    limit: number = 50,
    offset: number = 0
  ): Promise<PlatformUsage[]> {
    // Validate platform value
    if (!Object.values(Platform).includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const usages = await this.prisma.platformUsage.findMany({
      where: { platform },
      orderBy: {
        usedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        platform: true,
        campaignName: true,
        postUrl: true,
        usedAt: true,
        loggedById: true,
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
   * Get usages by campaign name
   * 
   * @param campaignName - Campaign name to filter by
   * @param limit - Number of results to return (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of platform usage records
   */
  async getUsagesByCampaign(
    campaignName: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PlatformUsage[]> {
    if (!campaignName || campaignName.trim().length === 0) {
      throw new Error('Campaign name is required');
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const usages = await this.prisma.platformUsage.findMany({
      where: {
        campaignName: {
          contains: campaignName.trim(),
          mode: 'insensitive',
        },
      },
      orderBy: {
        usedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        platform: true,
        campaignName: true,
        postUrl: true,
        usedAt: true,
        loggedById: true,
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
}
