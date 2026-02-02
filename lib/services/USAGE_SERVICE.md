# UsageService Documentation

## Overview

The `UsageService` manages platform usage tracking for assets in the DASCMS. It records where and when assets are used across different social media and advertising platforms, providing analytics and usage history.

## Requirements

Implements Requirements 8.1-8.6:
- 8.1: Platform selection required
- 8.2: Campaign name and usage date required
- 8.3: Post URL optional
- 8.4: Record user who logged usage
- 8.5: Display platform usage history
- 8.6: Create audit log entries

## Key Features

- **Platform Usage Logging**: Record asset usage across X, LinkedIn, Instagram, Meta Ads, and YouTube
- **Validation**: Ensures all required fields are provided
- **Usage History**: Retrieve complete usage history with pagination
- **Analytics**: Calculate usage statistics and platform breakdowns
- **Audit Logging**: All usage logging operations are recorded in audit logs

## API

### Constructor

```typescript
constructor(prisma: PrismaClient, auditService: AuditService)
```

### Methods

#### logUsage(params: LogUsageParams): Promise<PlatformUsage>

Logs platform usage for an asset.

**Parameters:**
- `assetId` (required): ID of the asset
- `platform` (required): Platform where asset was used (X, LINKEDIN, INSTAGRAM, META_ADS, YOUTUBE)
- `campaignName` (required): Name of the campaign
- `postUrl` (optional): URL of the post/ad
- `usedAt` (optional): Date when asset was used (defaults to current date)
- `loggedById` (required): ID of user logging the usage
- `ipAddress` (optional): IP address for audit logging
- `userAgent` (optional): User agent for audit logging

**Returns:** Created platform usage record

**Throws:**
- Error if platform is missing or invalid
- Error if campaign name is missing or empty
- Error if asset not found
- Error if user not found

**Example:**
```typescript
const usage = await usageService.logUsage({
  assetId: 'asset-123',
  platform: Platform.LINKEDIN,
  campaignName: 'Summer 2024 Campaign',
  postUrl: 'https://linkedin.com/post/abc123',
  usedAt: new Date('2024-06-15'),
  loggedById: 'user-456',
});
```

#### getUsageHistory(assetId: string, limit?: number, offset?: number): Promise<PlatformUsage[]>

Retrieves platform usage history for an asset.

**Parameters:**
- `assetId` (required): ID of the asset
- `limit` (optional): Number of results to return (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Returns:** Array of platform usage records, ordered by usage date descending

**Example:**
```typescript
const history = await usageService.getUsageHistory('asset-123', 20, 0);
```

#### getUsageStats(assetId: string, recentLimit?: number): Promise<UsageStats>

Calculates usage statistics for an asset.

**Parameters:**
- `assetId` (required): ID of the asset
- `recentLimit` (optional): Number of recent usages to include (default: 10, max: 50)

**Returns:** Usage statistics including:
- `totalUsages`: Total number of times asset was used
- `platformBreakdown`: Count per platform
- `recentUsages`: Most recent usage records

**Example:**
```typescript
const stats = await usageService.getUsageStats('asset-123');
console.log(`Total usages: ${stats.totalUsages}`);
console.log(`LinkedIn: ${stats.platformBreakdown.LINKEDIN}`);
console.log(`X: ${stats.platformBreakdown.X}`);
```

#### getUsageCount(assetId: string): Promise<number>

Gets the total usage count for an asset.

**Parameters:**
- `assetId` (required): ID of the asset

**Returns:** Total number of platform usages

#### getUsagesByPlatform(platform: Platform, limit?: number, offset?: number): Promise<PlatformUsage[]>

Retrieves usages filtered by platform.

**Parameters:**
- `platform` (required): Platform to filter by
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Number to skip (default: 0)

**Returns:** Array of platform usage records

#### getUsagesByCampaign(campaignName: string, limit?: number, offset?: number): Promise<PlatformUsage[]>

Retrieves usages filtered by campaign name (partial match, case-insensitive).

**Parameters:**
- `campaignName` (required): Campaign name to search for
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Number to skip (default: 0)

**Returns:** Array of platform usage records

## Usage Examples

### Basic Usage Logging

```typescript
import { UsageService } from '@/lib/services/UsageService';
import { AuditService } from '@/lib/services/AuditService';
import { Platform } from '@/types';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma);
const usageService = new UsageService(prisma, auditService);

// Log usage
const usage = await usageService.logUsage({
  assetId: 'asset-123',
  platform: Platform.INSTAGRAM,
  campaignName: 'Product Launch 2024',
  postUrl: 'https://instagram.com/p/xyz789',
  loggedById: 'user-456',
});
```

### Retrieve Usage History

```typescript
// Get usage history with pagination
const history = await usageService.getUsageHistory('asset-123', 20, 0);

history.forEach(usage => {
  console.log(`${usage.platform}: ${usage.campaignName} on ${usage.usedAt}`);
});
```

### Get Usage Analytics

```typescript
// Get comprehensive usage statistics
const stats = await usageService.getUsageStats('asset-123');

console.log(`Total Usages: ${stats.totalUsages}`);
console.log('\nPlatform Breakdown:');
Object.entries(stats.platformBreakdown).forEach(([platform, count]) => {
  if (count > 0) {
    console.log(`  ${platform}: ${count}`);
  }
});

console.log('\nRecent Usages:');
stats.recentUsages.forEach(usage => {
  console.log(`  ${usage.campaignName} on ${usage.platform}`);
});
```

### Filter by Platform

```typescript
// Get all LinkedIn usages
const linkedinUsages = await usageService.getUsagesByPlatform(
  Platform.LINKEDIN,
  50,
  0
);
```

### Search by Campaign

```typescript
// Find all usages for campaigns containing "Summer"
const summerCampaigns = await usageService.getUsagesByCampaign('Summer');
```

## API Routes

### POST /api/assets/[id]/usage

Log platform usage for an asset.

**Request Body:**
```json
{
  "platform": "LINKEDIN",
  "campaignName": "Summer Campaign 2024",
  "postUrl": "https://linkedin.com/post/abc123",
  "usedAt": "2024-06-15T10:00:00Z"
}
```

**Response:**
```json
{
  "id": "usage-123",
  "assetId": "asset-456",
  "platform": "LINKEDIN",
  "campaignName": "Summer Campaign 2024",
  "postUrl": "https://linkedin.com/post/abc123",
  "usedAt": "2024-06-15T10:00:00.000Z",
  "loggedById": "user-789"
}
```

### GET /api/assets/[id]/usage

Get usage history for an asset.

**Query Parameters:**
- `limit`: Number of results (default: 50)
- `offset`: Number to skip (default: 0)

**Response:**
```json
{
  "usages": [
    {
      "id": "usage-123",
      "assetId": "asset-456",
      "platform": "LINKEDIN",
      "campaignName": "Summer Campaign 2024",
      "postUrl": "https://linkedin.com/post/abc123",
      "usedAt": "2024-06-15T10:00:00.000Z",
      "loggedById": "user-789"
    }
  ],
  "total": 42,
  "stats": {
    "totalUsages": 42,
    "platformBreakdown": {
      "X": 10,
      "LINKEDIN": 15,
      "INSTAGRAM": 8,
      "META_ADS": 5,
      "YOUTUBE": 4
    }
  }
}
```

## Validation Rules

1. **Platform**: Required, must be one of: X, LINKEDIN, INSTAGRAM, META_ADS, YOUTUBE
2. **Campaign Name**: Required, cannot be empty or whitespace-only
3. **Post URL**: Optional, trimmed if provided
4. **Used At**: Optional, defaults to current date/time if not provided
5. **Asset**: Must exist in database
6. **User**: Must exist in database

## Error Handling

The service throws descriptive errors for various failure scenarios:

- `"Platform is required"` - Platform parameter is missing
- `"Invalid platform: {value}"` - Platform value is not valid
- `"Campaign name is required"` - Campaign name is missing or empty
- `"Asset not found"` - Asset ID does not exist
- `"User not found"` - User ID does not exist

## Audit Logging

All platform usage logging operations create audit log entries with:
- User ID of the person logging the usage
- Action: CREATE
- Resource Type: ASSET
- Resource ID: Asset ID
- Metadata including:
  - Operation: "platform_usage"
  - Platform
  - Campaign name
  - Post URL (if provided)
  - Usage date
  - Asset title and type

## Database Schema

Platform usage records are stored in the `PlatformUsage` table:

```prisma
model PlatformUsage {
  id           String   @id @default(cuid())
  assetId      String
  asset        Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  platform     Platform
  campaignName String
  postUrl      String?
  usedAt       DateTime @default(now())
  loggedById   String
  loggedBy     User     @relation(fields: [loggedById], references: [id])
  
  @@index([assetId])
  @@index([platform])
}
```

## Related Services

- **AuditService**: Used for creating audit log entries
- **UsageRepository**: Data access layer for advanced queries and analytics
- **AssetService**: Manages assets that have usage tracked

## Testing

Comprehensive unit tests are available in `tests/services/UsageService.test.ts` covering:
- Required field validation
- Platform validation
- Asset and user existence checks
- Optional field handling
- Default value behavior
- Audit logging
- Usage history retrieval
- Statistics calculation
- Filtering and pagination

Run tests with:
```bash
npm test -- UsageService.test.ts
```
