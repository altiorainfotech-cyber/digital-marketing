# VisibilityService

## Overview

The `VisibilityService` class handles visibility rule evaluation for assets based on the 7 visibility levels defined in the DASCMS system. It determines whether a user can view an asset based on the asset's visibility settings and the user's role, company, and explicit shares.

## Visibility Levels

The system supports 7 visibility levels:

1. **UPLOADER_ONLY**: Only the uploader can view the asset
2. **ADMIN_ONLY**: Admin users and the uploader can view the asset
3. **COMPANY**: All users in the asset's company can view the asset
4. **TEAM**: All users in the asset's team can view the asset (not yet implemented)
5. **ROLE**: Users with a specific role can view the asset (via AssetShare records)
6. **SELECTED_USERS**: Only explicitly selected users can view the asset (via AssetShare records)
7. **PUBLIC**: All authenticated users can view the asset

## Key Methods

### `canUserViewAsset(user: User, asset: Asset): Promise<boolean>`

Main method to check if a user can view an asset based on visibility rules.

**Parameters:**
- `user`: The user attempting to view the asset
- `asset`: The asset being accessed

**Returns:** `Promise<boolean>` - true if the user can view the asset, false otherwise

**Example:**
```typescript
const visibilityService = new VisibilityService(prisma);
const canView = await visibilityService.canUserViewAsset(user, asset);
if (canView) {
  // Allow access to asset
} else {
  // Deny access
}
```

### `getVisibleAssetIds(user: User): Promise<string[]>`

Get all asset IDs that are visible to a user based on visibility rules.

**Parameters:**
- `user`: The user requesting assets

**Returns:** `Promise<string[]>` - Array of asset IDs that the user can view

**Example:**
```typescript
const visibilityService = new VisibilityService(prisma);
const visibleAssetIds = await visibilityService.getVisibleAssetIds(user);
// Use visibleAssetIds to filter asset queries
```

### Individual Visibility Evaluation Methods

The service provides individual methods for evaluating each visibility level:

- `evaluateUploaderOnly(user: User, asset: Asset): boolean`
- `evaluateAdminOnly(user: User, asset: Asset): boolean`
- `evaluateCompany(user: User, asset: Asset): boolean`
- `evaluateTeam(user: User, asset: Asset): boolean`
- `evaluateRole(user: User, asset: Asset): Promise<boolean>`
- `evaluateSelectedUsers(user: User, asset: Asset): Promise<boolean>`
- `evaluatePublic(): boolean`

These methods can be used for specific visibility checks or testing purposes.

## Visibility Rules

### UPLOADER_ONLY
- **Rule**: `user.id === asset.uploaderId`
- **Use Case**: Private documents (Doc assets)
- **Example**: A user uploads a private note that only they can see

### ADMIN_ONLY
- **Rule**: `user.role === ADMIN || user.id === asset.uploaderId`
- **Use Case**: SEO assets pending review
- **Example**: A Content Creator uploads an SEO asset that defaults to ADMIN_ONLY visibility

### COMPANY
- **Rule**: `user.companyId === asset.companyId` (both must be defined)
- **Use Case**: Company-wide assets
- **Example**: An approved marketing asset visible to all users in the company

### TEAM
- **Rule**: Not yet implemented (returns false)
- **Use Case**: Team-specific assets
- **Example**: Assets shared within a specific team

### ROLE
- **Rule**: AssetShare record exists with `targetType='ROLE'` and `targetId=user.role`
- **Use Case**: Role-based asset sharing
- **Example**: All SEO_SPECIALIST users can view certain assets

### SELECTED_USERS
- **Rule**: AssetShare record exists with `sharedWithId=user.id`
- **Use Case**: Explicit user-to-user sharing
- **Example**: A user shares a private document with specific colleagues

### PUBLIC
- **Rule**: Always true for authenticated users
- **Use Case**: Publicly available assets
- **Example**: Approved marketing assets available to all users

## Usage in API Routes

```typescript
import { VisibilityService } from '@/lib/services';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const assetId = req.url.split('/').pop();
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  
  if (!asset) {
    return new Response('Not found', { status: 404 });
  }

  const visibilityService = new VisibilityService(prisma);
  const canView = await visibilityService.canUserViewAsset(session.user, asset);
  
  if (!canView) {
    return new Response('Forbidden', { status: 403 });
  }

  return Response.json(asset);
}
```

## Integration with AssetShare

The `ROLE` and `SELECTED_USERS` visibility levels rely on the `AssetShare` model:

```typescript
model AssetShare {
  id           String   @id @default(cuid())
  assetId      String
  sharedById   String
  sharedWithId String
  targetType   String?  // 'USER' | 'ROLE' | 'TEAM'
  targetId     String?  // role name or team ID
  createdAt    DateTime @default(now())
}
```

- For `SELECTED_USERS`: Create AssetShare records with `sharedWithId` set to specific user IDs
- For `ROLE`: Create AssetShare records with `targetType='ROLE'` and `targetId` set to the role name

## Requirements Validation

This service validates the following requirements:

- **Requirement 6.1**: Support for all 7 visibility levels
- **Requirement 6.2**: UPLOADER_ONLY visibility shows asset only to uploader
- **Requirement 6.3**: ADMIN_ONLY visibility shows asset to Admin and uploader
- **Requirement 6.4**: COMPANY visibility shows asset to all users of that company
- **Requirement 6.5**: TEAM visibility shows asset to all users of that team
- **Requirement 6.6**: ROLE visibility shows asset to all users with that role
- **Requirement 6.7**: SELECTED_USERS visibility shows asset only to explicitly selected users
- **Requirement 6.8**: PUBLIC visibility shows asset to all authenticated users
- **Requirement 6.9**: Visibility changes are logged in the Audit Log (handled by AuditService)

## Testing

The service includes comprehensive unit tests covering:
- All 7 visibility levels
- Edge cases (missing company, missing user company, etc.)
- Role-based access
- Explicit sharing via AssetShare records
- Validation methods

Run tests with:
```bash
npm test -- VisibilityService.test.ts
```

## Future Enhancements

1. **Team Support**: Implement team-based visibility when the Team model is added to the schema
2. **Caching**: Add caching for frequently accessed visibility checks
3. **Bulk Operations**: Optimize `getVisibleAssetIds` for large datasets
4. **Performance**: Add database indexes for AssetShare queries
