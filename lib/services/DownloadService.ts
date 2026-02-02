/**
 * DownloadService
 * 
 * Manages asset download tracking and secure URL generation.
 * Generates signed URLs with expiration and logs all download activity.
 * 
 * Requirements: 9.1-9.5
 * 
 * Key Features:
 * - Generates signed URLs for secure asset access (Requirement 9.1)
 * - Logs download records with user ID, asset ID, and timestamp (Requirement 9.2)
 * - Optionally records platform intent (Requirement 9.3)
 * - Provides download history for admins (Requirement 9.4)
 * - Integrates with AuditService for logging (Requirement 9.5)
 */

import { PrismaClient } from '@/app/generated/prisma';
import { Platform, AssetDownload, DownloadRequest, DownloadResponse } from '@/types';
import { AuditService } from './AuditService';
import { StorageService } from './StorageService';

export interface InitiateDownloadParams {
  assetId: string;
  downloadedById: string;
  platformIntent?: Platform;
  ipAddress?: string;
  userAgent?: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

export class DownloadService {
  private prisma: PrismaClient;
  private auditService: AuditService;
  private storageService: StorageService;

  constructor(
    prisma: PrismaClient,
    auditService: AuditService,
    storageService: StorageService
  ) {
    this.prisma = prisma;
    this.auditService = auditService;
    this.storageService = storageService;
  }

  /**
   * Initiate asset download
   * 
   * Generates a signed URL for secure access and logs the download.
   * 
   * Validates:
   * - Asset exists
   * - User exists
   * - Platform intent is valid (if provided)
   * 
   * Records:
   * - Download record with user ID, asset ID, timestamp (Requirement 9.2)
   * - Optional platform intent (Requirement 9.3)
   * - Audit log entry (Requirement 9.5)
   * 
   * Returns:
   * - Signed URL with expiration (Requirement 9.1)
   * 
   * @param params - Download initiation parameters
   * @returns Download response with signed URL and expiration
   * @throws Error if validation fails or asset/user not found
   */
  async initiateDownload(params: InitiateDownloadParams): Promise<DownloadResponse> {
    const {
      assetId,
      downloadedById,
      platformIntent,
      ipAddress,
      userAgent,
      expiresIn = 3600, // Default 1 hour
    } = params;

    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
        uploaderId: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: downloadedById },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate platform intent if provided (Requirement 9.3)
    if (platformIntent && !Object.values(Platform).includes(platformIntent)) {
      throw new Error(`Invalid platform intent: ${platformIntent}`);
    }

    // Generate signed URL with expiration (Requirement 9.1)
    const signedUrlResponse = await this.storageService.generateSignedUrl({
      storageUrl: asset.storageUrl,
      expiresIn,
    });

    // Create download record (Requirement 9.2)
    const download = await this.prisma.assetDownload.create({
      data: {
        assetId,
        downloadedById,
        platformIntent: platformIntent || null,
        downloadedAt: new Date(),
      },
      select: {
        id: true,
        assetId: true,
        downloadedById: true,
        downloadedAt: true,
        platformIntent: true,
      },
    });

    // Log download in audit log (Requirement 9.5)
    await this.auditService.logAssetDownload(
      downloadedById,
      assetId,
      {
        operation: 'download',
        platformIntent: platformIntent || null,
        assetTitle: asset.title,
        assetType: asset.assetType,
        downloadId: download.id,
        expiresAt: signedUrlResponse.expiresAt.toISOString(),
      },
      ipAddress,
      userAgent
    );

    return {
      downloadUrl: signedUrlResponse.signedUrl,
      expiresAt: signedUrlResponse.expiresAt,
    };
  }

  /**
   * Get download history for an asset
   * 
   * Requirement 9.4: Display download history with user and timestamp
   * 
   * @param assetId - ID of the asset
   * @param limit - Number of results to return (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of download records
   */
  async getDownloadHistory(
    assetId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AssetDownload[]> {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const downloads = await this.prisma.assetDownload.findMany({
      where: { assetId },
      orderBy: {
        downloadedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        downloadedById: true,
        downloadedAt: true,
        platformIntent: true,
      },
    });

    return downloads.map((download) => ({
      id: download.id,
      assetId: download.assetId,
      downloadedById: download.downloadedById,
      downloadedAt: download.downloadedAt,
      platformIntent: download.platformIntent as Platform | undefined,
    }));
  }

  /**
   * Get download history with user details
   * 
   * Enhanced version that includes user information for each download.
   * Useful for admin views.
   * 
   * Requirement 9.4: Display download history with user and timestamp
   * 
   * @param assetId - ID of the asset
   * @param limit - Number of results to return (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of download records with user details
   */
  async getDownloadHistoryWithUsers(
    assetId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<AssetDownload & { user: { id: string; name: string; email: string } }>> {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const downloads = await this.prisma.assetDownload.findMany({
      where: { assetId },
      orderBy: {
        downloadedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        downloadedById: true,
        downloadedAt: true,
        platformIntent: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return downloads.map((download) => ({
      id: download.id,
      assetId: download.assetId,
      downloadedById: download.downloadedById,
      downloadedAt: download.downloadedAt,
      platformIntent: download.platformIntent as Platform | undefined,
      user: download.User,
    }));
  }

  /**
   * Get download count for an asset
   * 
   * @param assetId - ID of the asset
   * @returns Total number of downloads
   */
  async getDownloadCount(assetId: string): Promise<number> {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    return await this.prisma.assetDownload.count({
      where: { assetId },
    });
  }

  /**
   * Get downloads by user
   * 
   * @param userId - ID of the user
   * @param limit - Number of results to return (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of download records
   */
  async getDownloadsByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AssetDownload[]> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const downloads = await this.prisma.assetDownload.findMany({
      where: { downloadedById: userId },
      orderBy: {
        downloadedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        downloadedById: true,
        downloadedAt: true,
        platformIntent: true,
      },
    });

    return downloads.map((download) => ({
      id: download.id,
      assetId: download.assetId,
      downloadedById: download.downloadedById,
      downloadedAt: download.downloadedAt,
      platformIntent: download.platformIntent as Platform | undefined,
    }));
  }

  /**
   * Get downloads by platform intent
   * 
   * @param platform - Platform to filter by
   * @param limit - Number of results to return (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of download records
   */
  async getDownloadsByPlatform(
    platform: Platform,
    limit: number = 50,
    offset: number = 0
  ): Promise<AssetDownload[]> {
    // Validate platform value
    if (!Object.values(Platform).includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const downloads = await this.prisma.assetDownload.findMany({
      where: { platformIntent: platform },
      orderBy: {
        downloadedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        downloadedById: true,
        downloadedAt: true,
        platformIntent: true,
      },
    });

    return downloads.map((download) => ({
      id: download.id,
      assetId: download.assetId,
      downloadedById: download.downloadedById,
      downloadedAt: download.downloadedAt,
      platformIntent: download.platformIntent as Platform | undefined,
    }));
  }

  /**
   * Get recent downloads across all assets
   * 
   * Useful for admin dashboard to see recent download activity.
   * 
   * @param limit - Number of results to return (default: 20)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of download records with asset and user details
   */
  async getRecentDownloads(
    limit: number = 20,
    offset: number = 0
  ): Promise<Array<AssetDownload & { 
    Asset: { id: string; title: string; assetType: string };
    user: { id: string; name: string; email: string };
  }>> {
    const validLimit = Math.min(Math.max(1, limit), 100);

    const downloads = await this.prisma.assetDownload.findMany({
      orderBy: {
        downloadedAt: 'desc',
      },
      take: validLimit,
      skip: offset,
      select: {
        id: true,
        assetId: true,
        downloadedById: true,
        downloadedAt: true,
        platformIntent: true,
        Asset: {
          select: {
            id: true,
            title: true,
            assetType: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return downloads.map((download) => ({
      id: download.id,
      assetId: download.assetId,
      downloadedById: download.downloadedById,
      downloadedAt: download.downloadedAt,
      platformIntent: download.platformIntent as Platform | undefined,
      asset: download.Asset,
      user: download.User,
    }));
  }
}
