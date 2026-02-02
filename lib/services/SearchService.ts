/**
 * SearchService
 * 
 * Provides comprehensive search and filtering capabilities for assets.
 * 
 * Requirements: 15.1-15.6, 17.6
 * 
 * Key Features:
 * - Search by title, description, tags, company, asset type
 * - Filter by status, visibility, upload type, date range
 * - Sort by upload date, title, approval date, file size
 * - Integrate permission checks in search results
 * - Support ascending and descending order
 */

import { PrismaClient } from '@/app/generated/prisma';
import { 
  AssetType, 
  UploadType, 
  AssetStatus, 
  VisibilityLevel,
  User,
  Asset
} from '@/types';
import { VisibilityChecker } from './VisibilityChecker';

export interface SearchParams {
  // Search criteria
  query?: string; // Search in title, description, tags
  title?: string; // Search specifically in title
  description?: string; // Search specifically in description
  tags?: string[]; // Search for specific tags
  companyId?: string; // Filter by company
  assetType?: AssetType; // Filter by asset type
  
  // Filters
  status?: AssetStatus; // Filter by status
  visibility?: VisibilityLevel; // Filter by visibility
  uploadType?: UploadType; // Filter by upload type
  uploaderId?: string; // Filter by uploader
  
  // Date range filters
  uploadedAfter?: Date; // Filter assets uploaded after this date
  uploadedBefore?: Date; // Filter assets uploaded before this date
  approvedAfter?: Date; // Filter assets approved after this date
  approvedBefore?: Date; // Filter assets approved before this date
  
  // Sorting
  sortBy?: 'uploadedAt' | 'title' | 'approvedAt' | 'fileSize'; // Sort field
  sortOrder?: 'asc' | 'desc'; // Sort order
  
  // Pagination
  page?: number; // Page number (1-indexed)
  limit?: number; // Results per page
}

export interface SearchResult {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SearchService {
  private prisma: PrismaClient;
  private visibilityChecker: VisibilityChecker;

  constructor(
    prisma: PrismaClient,
    visibilityChecker: VisibilityChecker
  ) {
    this.prisma = prisma;
    this.visibilityChecker = visibilityChecker;
  }

  /**
   * Search and filter assets with permission checks
   * 
   * Requirements:
   * - 15.1: Search by title, description, tags, company, asset type
   * - 15.2: Filter by status, visibility, upload type, date range
   * - 15.3: Only return assets user has permission to view
   * - 15.4: Sort by upload date, title, approval date, file size
   * - 15.5: Return results within 2 seconds for up to 10,000 assets
   * - 17.6: Include description and tags in search results
   * 
   * @param user - User performing the search
   * @param params - Search parameters
   * @returns SearchResult with filtered and sorted assets
   */
  async searchAssets(user: User, params: SearchParams): Promise<SearchResult> {
    const {
      query,
      title,
      description,
      tags,
      companyId,
      assetType,
      status,
      visibility,
      uploadType,
      uploaderId,
      uploadedAfter,
      uploadedBefore,
      approvedAfter,
      approvedBefore,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = params;

    // Build where clause for Prisma query
    const where: any = {};

    // General query search (title, description, tags)
    if (query && query.trim().length > 0) {
      const searchTerm = query.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm] } },
      ];
    }

    // Specific field searches
    if (title && title.trim().length > 0) {
      where.title = { contains: title.trim(), mode: 'insensitive' };
    }

    if (description && description.trim().length > 0) {
      where.description = { contains: description.trim(), mode: 'insensitive' };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Filter by company
    if (companyId) {
      where.companyId = companyId;
    }

    // Filter by asset type
    if (assetType) {
      where.assetType = assetType;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by visibility
    if (visibility) {
      where.visibility = visibility;
    }

    // Filter by upload type
    if (uploadType) {
      where.uploadType = uploadType;
    }

    // Filter by uploader
    if (uploaderId) {
      where.uploaderId = uploaderId;
    }

    // Date range filters
    if (uploadedAfter || uploadedBefore) {
      where.uploadedAt = {};
      if (uploadedAfter) {
        where.uploadedAt.gte = uploadedAfter;
      }
      if (uploadedBefore) {
        where.uploadedAt.lte = uploadedBefore;
      }
    }

    if (approvedAfter || approvedBefore) {
      where.approvedAt = {};
      if (approvedAfter) {
        where.approvedAt.gte = approvedAfter;
      }
      if (approvedBefore) {
        where.approvedAt.lte = approvedBefore;
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'uploadedAt') {
      orderBy.uploadedAt = sortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'approvedAt') {
      orderBy.approvedAt = sortOrder;
    } else if (sortBy === 'fileSize') {
      orderBy.fileSize = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              companyId: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    // Filter assets by permission (Requirement 15.3)
    const visibleAssets = await this.visibilityChecker.filterVisibleAssets(
      user,
      assets as Asset[]
    );

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      assets: visibleAssets,
      total: visibleAssets.length,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get assets by IDs with permission checks
   * 
   * @param user - User requesting assets
   * @param assetIds - Array of asset IDs
   * @returns Array of assets user has permission to view
   */
  async getAssetsByIds(user: User, assetIds: string[]): Promise<Asset[]> {
    if (assetIds.length === 0) {
      return [];
    }

    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter by permission
    return await this.visibilityChecker.filterVisibleAssets(user, assets as Asset[]);
  }

  /**
   * Search assets by tags
   * 
   * @param user - User performing the search
   * @param tags - Array of tags to search for
   * @param matchAll - If true, asset must have all tags; if false, any tag matches
   * @returns Array of assets matching the tag criteria
   */
  async searchByTags(
    user: User,
    tags: string[],
    matchAll: boolean = false
  ): Promise<Asset[]> {
    if (tags.length === 0) {
      return [];
    }

    const where: any = {};

    if (matchAll) {
      // Asset must have all tags
      where.AND = tags.map((tag) => ({
        tags: { has: tag },
      }));
    } else {
      // Asset must have at least one tag
      where.tags = { hasSome: tags };
    }

    const assets = await this.prisma.asset.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter by permission
    return await this.visibilityChecker.filterVisibleAssets(user, assets as Asset[]);
  }

  /**
   * Get recently uploaded assets
   * 
   * @param user - User requesting assets
   * @param limit - Maximum number of assets to return
   * @returns Array of recently uploaded assets
   */
  async getRecentAssets(user: User, limit: number = 10): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      orderBy: {
        uploadedAt: 'desc',
      },
      take: limit,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter by permission
    return await this.visibilityChecker.filterVisibleAssets(user, assets as Asset[]);
  }

  /**
   * Get recently approved assets
   * 
   * @param user - User requesting assets
   * @param limit - Maximum number of assets to return
   * @returns Array of recently approved assets
   */
  async getRecentlyApprovedAssets(user: User, limit: number = 10): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: {
        status: AssetStatus.APPROVED,
        approvedAt: { not: null },
      },
      orderBy: {
        approvedAt: 'desc',
      },
      take: limit,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter by permission
    return await this.visibilityChecker.filterVisibleAssets(user, assets as Asset[]);
  }

  /**
   * Get assets by company with permission checks
   * 
   * @param user - User requesting assets
   * @param companyId - Company ID
   * @param sortBy - Sort field
   * @param sortOrder - Sort order
   * @returns Array of assets for the company
   */
  async getAssetsByCompany(
    user: User,
    companyId: string,
    sortBy: 'uploadedAt' | 'title' | 'approvedAt' | 'fileSize' = 'uploadedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<Asset[]> {
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const assets = await this.prisma.asset.findMany({
      where: {
        companyId,
      },
      orderBy,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter by permission
    return await this.visibilityChecker.filterVisibleAssets(user, assets as Asset[]);
  }
}
