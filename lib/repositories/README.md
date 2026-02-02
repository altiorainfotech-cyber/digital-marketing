# Repositories

This directory contains the data access layer for the DASCMS application.

## AuditRepository

The `AuditRepository` provides query methods for accessing audit log data with filtering and pagination support.

### Features

- **Filtering**: Query audit logs by user, action, resource type, resource ID, and date range
- **Pagination**: Support for limit and offset with automatic page calculation
- **Performance**: Parallel queries for data and count to improve performance
- **Relations**: Includes user and asset relations in query results
- **Validation**: Automatic validation and capping of limit values (max 100)

### Usage

```typescript
import prisma from '@/lib/prisma';
import { AuditRepository } from '@/lib/repositories';
import { AuditAction, ResourceType } from '@/types';

const auditRepository = new AuditRepository(prisma);

// Query with filters
const result = await auditRepository.queryAuditLogs({
  userId: 'user-123',
  action: AuditAction.CREATE,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 20,
  offset: 0,
});

console.log(`Found ${result.total} logs, showing page ${result.page} of ${result.totalPages}`);
result.logs.forEach(log => {
  console.log(`${log.user.name} performed ${log.action} on ${log.resourceType}`);
});
```

### Methods

#### `queryAuditLogs(query: AuditLogQuery): Promise<PaginatedAuditLogs>`

Main query method that supports all filtering and pagination options.

**Parameters:**
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by audit action type
- `resourceType` (optional): Filter by resource type
- `resourceId` (optional): Filter by specific resource ID
- `startDate` (optional): Filter logs created on or after this date
- `endDate` (optional): Filter logs created on or before this date
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Returns:**
```typescript
{
  logs: AuditLog[];      // Array of audit log entries
  total: number;         // Total count of matching logs
  page: number;          // Current page number
  limit: number;         // Results per page
  totalPages: number;    // Total number of pages
}
```

#### `getAuditLogsByUser(userId: string, limit?: number, offset?: number): Promise<PaginatedAuditLogs>`

Get all audit logs for a specific user.

#### `getAuditLogsByAction(action: AuditAction, limit?: number, offset?: number): Promise<PaginatedAuditLogs>`

Get all audit logs for a specific action type.

#### `getAuditLogsByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<PaginatedAuditLogs>`

Get all audit logs within a date range.

#### `getAuditLogsByResource(resourceType: ResourceType, resourceId: string, limit?: number, offset?: number): Promise<PaginatedAuditLogs>`

Get all audit logs for a specific resource.

#### `getAuditLogById(id: string): Promise<AuditLog | null>`

Get a single audit log by ID.

#### `getRecentAuditLogs(limit?: number): Promise<AuditLog[]>`

Get the most recent audit logs (useful for dashboards).

#### `getAuditLogCount(query: Omit<AuditLogQuery, 'limit' | 'offset'>): Promise<number>`

Get the total count of audit logs matching the filters.

#### `getAuditLogsForAsset(assetId: string, limit?: number, offset?: number): Promise<PaginatedAuditLogs>`

Get all audit logs related to a specific asset.

### Requirements

Implements **Requirement 12.3**: Admin views audit logs with filtering by user, action, and date range.

### Testing

The repository includes comprehensive unit tests covering:
- Filtering by all supported parameters
- Pagination with limit and offset
- Combining multiple filters
- Edge cases (limit capping, minimum values)
- Relations (user and asset data)
- Ordering (most recent first)

To run tests:
```bash
npm test -- tests/repositories/AuditRepository.test.ts
```

### Database Indexes

The AuditLog model includes indexes on:
- `userId` - For filtering by user
- `action` - For filtering by action type
- `resourceType` - For filtering by resource type
- `createdAt` - For date range filtering and ordering

These indexes ensure efficient query performance even with large datasets.

### Performance Considerations

- Queries use parallel execution for data and count operations
- Limit is automatically capped at 100 to prevent excessive memory usage
- Results are ordered by `createdAt DESC` for most recent first
- Includes only necessary relations to minimize data transfer

### Integration

The AuditRepository is used by:
- Admin audit log viewer (GET /api/audit-logs)
- Asset detail pages (showing asset history)
- User activity tracking
- Compliance reporting

