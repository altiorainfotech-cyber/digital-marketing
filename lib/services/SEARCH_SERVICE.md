# SearchService Documentation

## Overview

The SearchService provides comprehensive search and filtering capabilities for assets in the DASCMS system. It integrates with the VisibilityChecker to ensure that search results respect user permissions and visibility rules.

## Requirements

- **15.1**: Search by title, description, tags, company, asset type
- **15.2**: Filter by status, visibility, upload type, date range
- **15.3**: Only return assets user has permission to view
- **15.4**: Sort by upload date, title, approval date, file size
- **15.5**: Return results within 2 seconds for up to 10,000 assets
- **17.6**: Include description and tags in search results

## Features

### Search Capabilities

1. **General Query Search**: Search across title, description, and tags simultaneously
2. **Field-Specific Search**: Search in specific fields (title, description, tags)
3. **Tag Search**: Search for assets with specific tags (any match or all match)
4. **Company Filter**: Filter assets by company
5. **Asset Type Filter**: Filter by IMAGE, VIDEO, DOCUMENT, or LINK
6. **Status Filter**: Filter by DRAFT, PENDING_REVIEW, APPROVED, or REJECTED
7. **Visibility Filter**: Filter by visibility level
8. **Upload Type Filter**: Filter by SEO or DOC uploads
9. **Date Range Filters**: Filter by upload date or approval date ranges

### Sorting

- Sort by: `uploadedAt`, `title`, `approvedAt`, `fileSize`
- Sort order: `asc` (ascending) or `desc` (descending)
- Default: Sort by `uploadedAt` in descending order (newest first)

### Pagination

- Page-based pagination with configurable page size
- Default: 20 results per page
- Maximum: 100 results per page

### Permission Integration

All search results are automatically filtered based on:
- User role (Admin, Content_Creator, SEO_Specialist)
- Asset visibility rules
- Explicit asset shares

## API Usage

### Basic Search

```typescript
const searchService = new SearchService(prisma, visibilityChecker);

const result = await searchService.searchAssets(user, {
  query: 'marketing',
  page: 1,
  limit: 20,
});

console.log(result.assets); // Array of matching assets
console.log(result.total); // Total number of results
console.log(result.totalPages); // Total number of pages
```

### Advanced Filtering

```typescript
const result = await searchService.searchAssets(user, {
  // Search criteria
  query: 'campaign',
  tags: ['social', 'instagram'],
  
  // Filters
  companyId: 'company-123',
  assetType: AssetType.IMAGE,
  status: AssetStatus.APPROVED,
  uploadType: UploadType.SEO,
  
  // Date range
  uploadedAfter: new Date('2024-01-01'),
  uploadedBefore: new Date('2024-12-31'),
  
  // Sorting
  sortBy: 'approvedAt',
  sortOrder: 'desc',
  
  // Pagination
  page: 1,
  limit: 50,
});
```

### Tag Search

```typescript
// Search for assets with ANY of the specified tags
const anyMatch = await searchService.searchByTags(
  user,
  ['marketing', 'social', 'campaign'],
  false // matchAll = false
);

// Search for assets with ALL of the specified tags
const allMatch = await searchService.searchByTags(
  user,
  ['marketing', 'social', 'campaign'],
  true // matchAll = true
);
```

### Recent Assets

```typescript
// Get 10 most recently uploaded assets
const recent = await searchService.getRecentAssets(user, 10);

// Get 10 most recently approved assets
const recentlyApproved = await searchService.getRecentlyApprovedAssets(user, 10);
```

### Company Assets

```typescript
// Get all assets for a company, sorted by title
const companyAssets = await searchService.getAssetsByCompany(
  user,
  'company-123',
  'title',
  'asc'
);
```

## API Endpoint

### GET /api/assets/search

Search and filter assets with permission checks.

**Query Parameters:**

- `query` (string): General search term (searches title, description, tags)
- `title` (string): Search specifically in title
- `description` (string): Search specifically in description
- `tags` (string): Comma-separated tags to search for
- `companyId` (string): Filter by company
- `assetType` (enum): Filter by asset type (IMAGE, VIDEO, DOCUMENT, LINK)
- `status` (enum): Filter by status (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- `visibility` (enum): Filter by visibility level
- `uploadType` (enum): Filter by upload type (SEO, DOC)
- `uploaderId` (string): Filter by uploader
- `uploadedAfter` (ISO 8601 date): Filter assets uploaded after this date
- `uploadedBefore` (ISO 8601 date): Filter assets uploaded before this date
- `approvedAfter` (ISO 8601 date): Filter assets approved after this date
- `approvedBefore` (ISO 8601 date): Filter assets approved before this date
- `sortBy` (enum): Sort field (uploadedAt, title, approvedAt, fileSize)
- `sortOrder` (enum): Sort order (asc, desc)
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)

**Example Request:**

```bash
GET /api/assets/search?query=marketing&status=APPROVED&sortBy=approvedAt&sortOrder=desc&page=1&limit=20
```

**Response:**

```json
{
  "assets": [
    {
      "id": "asset-123",
      "title": "Marketing Campaign Image",
      "description": "Social media marketing campaign",
      "tags": ["marketing", "social", "campaign"],
      "assetType": "IMAGE",
      "uploadType": "SEO",
      "status": "APPROVED",
      "visibility": "COMPANY",
      "companyId": "company-123",
      "uploaderId": "user-456",
      "storageUrl": "https://...",
      "fileSize": 1024000,
      "mimeType": "image/jpeg",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "approvedAt": "2024-01-16T14:20:00Z",
      "targetPlatforms": ["INSTAGRAM", "X"],
      "campaignName": "Spring 2024"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

## Performance Considerations

1. **Database Indexes**: The Asset model has indexes on:
   - `uploaderId`
   - `companyId`
   - `status`
   - `visibility`

2. **Query Optimization**: 
   - Uses Prisma's efficient query builder
   - Parallel execution of count and data queries
   - Selective field inclusion to reduce data transfer

3. **Permission Filtering**: 
   - Permission checks are performed after database query
   - For large result sets, consider implementing database-level permission filtering

4. **Pagination**: 
   - Always use pagination for large datasets
   - Default limit of 20 results balances performance and usability
   - Maximum limit of 100 prevents excessive data transfer

## Security

1. **Permission Checks**: All search results are filtered by VisibilityChecker
2. **Input Validation**: All query parameters are validated before use
3. **SQL Injection Prevention**: Prisma ORM provides automatic protection
4. **Rate Limiting**: Consider implementing rate limiting for search endpoints

## Testing

The SearchService includes comprehensive unit tests covering:
- Query search functionality
- Field-specific searches
- Filtering by various criteria
- Date range filtering
- Sorting in different orders
- Pagination
- Permission-based filtering
- Tag search (any match and all match)
- Recent assets retrieval
- Company-specific asset retrieval

Run tests with:
```bash
npm test -- SearchService.test.ts
```

## Future Enhancements

1. **Full-Text Search**: Implement PostgreSQL full-text search for better performance
2. **Search Analytics**: Track popular search terms and filters
3. **Saved Searches**: Allow users to save frequently used search criteria
4. **Search Suggestions**: Provide autocomplete suggestions for search terms
5. **Advanced Filters**: Add more filter options (file size range, MIME type, etc.)
6. **Faceted Search**: Show filter counts before applying filters
