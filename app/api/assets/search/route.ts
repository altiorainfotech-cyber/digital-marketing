/**
 * Asset Search API Route
 * 
 * GET /api/assets/search - Search and filter assets
 * 
 * Requirements: 15.1-15.6
 * 
 * Key Features:
 * - Search by title, description, tags, company, asset type
 * - Filter by status, visibility, upload type, date range
 * - Sort by upload date, title, approval date, file size
 * - Permission-based filtering
 * - Pagination support
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { SearchService } from '@/lib/services/SearchService';
import { VisibilityService } from '@/lib/services/VisibilityService';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';
import { AssetType, UploadType, AssetStatus, VisibilityLevel } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const visibilityService = new VisibilityService(prisma as any);
const visibilityChecker = new VisibilityChecker(visibilityService);
const searchService = new SearchService(prisma as any, visibilityChecker);

/**
 * Parse date string to Date object
 */
function parseDate(dateString: string | null): Date | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Parse tags from comma-separated string
 */
function parseTags(tagsString: string | null): string[] | undefined {
  if (!tagsString) return undefined;
  return tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
}

/**
 * GET /api/assets/search
 * 
 * Search and filter assets with permission checks
 * 
 * Query Parameters:
 * - query?: string - General search term (searches title, description, tags)
 * - title?: string - Search specifically in title
 * - description?: string - Search specifically in description
 * - tags?: string - Comma-separated tags to search for
 * - companyId?: string - Filter by company
 * - assetType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LINK' - Filter by asset type
 * - status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' - Filter by status
 * - visibility?: VisibilityLevel - Filter by visibility
 * - uploadType?: 'SEO' | 'DOC' - Filter by upload type
 * - uploaderId?: string - Filter by uploader
 * - uploadedAfter?: string - Filter assets uploaded after this date (ISO 8601)
 * - uploadedBefore?: string - Filter assets uploaded before this date (ISO 8601)
 * - approvedAfter?: string - Filter assets approved after this date (ISO 8601)
 * - approvedBefore?: string - Filter assets approved before this date (ISO 8601)
 * - sortBy?: 'uploadedAt' | 'title' | 'approvedAt' | 'fileSize' - Sort field (default: uploadedAt)
 * - sortOrder?: 'asc' | 'desc' - Sort order (default: desc)
 * - page?: number - Page number (default: 1)
 * - limit?: number - Results per page (default: 20, max: 100)
 * 
 * Response:
 * {
 *   assets: Array<Asset>;
 *   total: number;
 *   page: number;
 *   limit: number;
 *   totalPages: number;
 * }
 * 
 * Errors:
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);

    // Extract search parameters
    const query = searchParams.get('query');
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    const tagsString = searchParams.get('tags');
    const companyId = searchParams.get('companyId');
    const assetType = searchParams.get('assetType') as AssetType | null;
    const status = searchParams.get('status') as AssetStatus | null;
    const visibility = searchParams.get('visibility') as VisibilityLevel | null;
    const uploadType = searchParams.get('uploadType') as UploadType | null;
    const uploaderId = searchParams.get('uploaderId');
    const uploadedBy = searchParams.get('uploadedBy'); // 'me' for current user's uploads
    const assignedTo = searchParams.get('assignedTo'); // 'me' for assets assigned to current user
    const uploaderScope = searchParams.get('uploaderScope'); // 'mine' | 'all_creators' for CONTENT_CREATOR filtering
    const uploadedAfter = searchParams.get('uploadedAfter');
    const uploadedBefore = searchParams.get('uploadedBefore');
    const approvedAfter = searchParams.get('approvedAfter');
    const approvedBefore = searchParams.get('approvedBefore');
    const sortBy = searchParams.get('sortBy') as 'uploadedAt' | 'title' | 'approvedAt' | 'fileSize' | null;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // Validate enum parameters
    if (assetType && !Object.values(AssetType).includes(assetType)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            assetType: `Invalid asset type. Must be one of: ${Object.values(AssetType).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    if (status && !Object.values(AssetStatus).includes(status)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            status: `Invalid status. Must be one of: ${Object.values(AssetStatus).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    if (visibility && !Object.values(VisibilityLevel).includes(visibility)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            visibility: `Invalid visibility level. Must be one of: ${Object.values(VisibilityLevel).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    if (uploadType && !Object.values(UploadType).includes(uploadType)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            uploadType: `Invalid upload type. Must be one of: ${Object.values(UploadType).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    if (sortBy && !['uploadedAt', 'title', 'approvedAt', 'fileSize'].includes(sortBy)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            sortBy: 'Invalid sort field. Must be one of: uploadedAt, title, approvedAt, fileSize',
          },
        },
        { status: 400 }
      );
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            sortOrder: 'Invalid sort order. Must be one of: asc, desc',
          },
        },
        { status: 400 }
      );
    }

    // Parse pagination parameters
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;

    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            page: 'Page must be a positive integer',
          },
        },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            limit: 'Limit must be a positive integer',
          },
        },
        { status: 400 }
      );
    }

    // Parse tags
    const tags = parseTags(tagsString);

    // Parse dates
    const uploadedAfterDate = parseDate(uploadedAfter);
    const uploadedBeforeDate = parseDate(uploadedBefore);
    const approvedAfterDate = parseDate(approvedAfter);
    const approvedBeforeDate = parseDate(approvedBefore);

    // Validate date parameters
    if (uploadedAfter && !uploadedAfterDate) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            uploadedAfter: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
          },
        },
        { status: 400 }
      );
    }

    if (uploadedBefore && !uploadedBeforeDate) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            uploadedBefore: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
          },
        },
        { status: 400 }
      );
    }

    if (approvedAfter && !approvedAfterDate) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            approvedAfter: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
          },
        },
        { status: 400 }
      );
    }

    if (approvedBefore && !approvedBeforeDate) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: {
            approvedBefore: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
          },
        },
        { status: 400 }
      );
    }

    // Build search parameters
    const searchParamsObj: any = {
      page,
      limit,
    };

    if (query) searchParamsObj.query = query;
    if (title) searchParamsObj.title = title;
    if (description) searchParamsObj.description = description;
    if (tags) searchParamsObj.tags = tags;
    if (companyId) searchParamsObj.companyId = companyId;
    if (assetType) searchParamsObj.assetType = assetType;
    if (status) searchParamsObj.status = status;
    if (visibility) searchParamsObj.visibility = visibility;
    if (uploadType) searchParamsObj.uploadType = uploadType;
    if (uploaderId) searchParamsObj.uploaderId = uploaderId;
    
    // Handle uploadedBy parameter
    if (uploadedBy === 'me') {
      searchParamsObj.uploaderId = user.id;
    }
    
    // Handle uploaderScope parameter for CONTENT_CREATOR users
    if (uploaderScope && user.role === 'CONTENT_CREATOR') {
      if (uploaderScope === 'mine') {
        // Show only current user's uploads
        searchParamsObj.uploaderId = user.id;
      } else if (uploaderScope === 'all_creators') {
        // Show all CONTENT_CREATOR uploads
        searchParamsObj.uploaderRole = 'CONTENT_CREATOR';
      }
    }
    
    // Handle assignedTo parameter
    if (assignedTo === 'me') {
      searchParamsObj.assignedToUser = user.id;
      searchParamsObj.assignedToRole = user.role;
    }
    
    if (uploadedAfterDate) searchParamsObj.uploadedAfter = uploadedAfterDate;
    if (uploadedBeforeDate) searchParamsObj.uploadedBefore = uploadedBeforeDate;
    if (approvedAfterDate) searchParamsObj.approvedAfter = approvedAfterDate;
    if (approvedBeforeDate) searchParamsObj.approvedBefore = approvedBeforeDate;
    if (sortBy) searchParamsObj.sortBy = sortBy;
    if (sortOrder) searchParamsObj.sortOrder = sortOrder;

    // Execute search
    const result = await searchService.searchAssets(user as any, searchParamsObj);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error searching assets:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to search assets', details: error.message },
      { status: 500 }
    );
  }
});
