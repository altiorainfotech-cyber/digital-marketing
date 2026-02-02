# ShareManager

The ShareManager service handles asset sharing operations for the DASCMS system.

## Overview

ShareManager enables users to share their private Doc assets with specific users, creating a collaborative environment while maintaining control over asset visibility.

## Requirements

Implements Requirements 13.1-13.5:
- 13.1: Allow selection of specific users for sharing
- 13.2: Create AssetShare records for each recipient
- 13.3: Shared users can access shared assets
- 13.4: Revoke sharing access
- 13.5: Log sharing actions in audit log

## Key Features

- **Share Assets**: Share Doc assets with specific users
- **Revoke Shares**: Remove sharing access from specific users
- **Automatic Visibility Management**: Automatically updates asset visibility when sharing
- **Notifications**: Sends notifications to recipients when assets are shared
- **Audit Logging**: Logs all sharing operations for compliance

## Usage

### Sharing an Asset

```typescript
import { ShareManager } from '@/lib/services/ShareManager';
import { AuditService } from '@/lib/services/AuditService';
import { NotificationService } from '@/lib/services/NotificationService';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma);
const notificationService = new NotificationService(prisma);
const shareManager = new ShareManager(prisma, auditService, notificationService);

// Share an asset with multiple users
const shares = await shareManager.shareAsset({
  assetId: 'asset-123',
  sharedById: 'user-456',
  sharedWithIds: ['user-789', 'user-012'],
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

console.log(`Asset shared with ${shares.length} users`);
```

### Revoking a Share

```typescript
// Revoke sharing for a specific user
await shareManager.revokeShare({
  assetId: 'asset-123',
  sharedById: 'user-456',
  sharedWithId: 'user-789',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

console.log('Share revoked successfully');
```

### Getting Asset Shares

```typescript
// Get all shares for an asset
const shares = await shareManager.getAssetShares('asset-123');

console.log(`Asset has ${shares.length} shares`);
shares.forEach(share => {
  console.log(`Shared with user: ${share.sharedWithId}`);
});
```

### Checking if Asset is Shared

```typescript
// Check if an asset is shared with a specific user
const isShared = await shareManager.isAssetSharedWithUser('asset-123', 'user-789');

if (isShared) {
  console.log('Asset is shared with this user');
}
```

## Validation Rules

### Sharing Validation

1. **Asset must exist**: The asset ID must reference a valid asset
2. **Sharer must be uploader**: Only the asset uploader can share the asset
3. **Asset visibility**: Can only share assets with `UPLOADER_ONLY` or `SELECTED_USERS` visibility
4. **Recipients must exist**: All recipient user IDs must reference valid users
5. **Cannot share with self**: The sharer cannot share the asset with themselves

### Revocation Validation

1. **Asset must exist**: The asset ID must reference a valid asset
2. **Revoker must be uploader**: Only the asset uploader can revoke shares
3. **Share must exist**: The share record must exist for the specified user

## Automatic Visibility Management

The ShareManager automatically manages asset visibility:

- **When sharing**: If asset visibility is `UPLOADER_ONLY`, it's automatically changed to `SELECTED_USERS`
- **When revoking**: If all shares are revoked and visibility is `SELECTED_USERS`, it's automatically changed back to `UPLOADER_ONLY`

These changes are logged in the audit log with detailed context.

## Integration with VisibilityService

The ShareManager works seamlessly with the VisibilityService:

- Shared assets are automatically included in visibility checks
- Users with explicit shares can view assets even if visibility is `UPLOADER_ONLY`
- The VisibilityService queries AssetShare records to determine access

## API Routes

### POST /api/assets/[id]/share

Share an asset with specific users.

**Request Body:**
```json
{
  "sharedWithIds": ["user-id-1", "user-id-2"],
  "targetType": "USER",
  "targetId": null
}
```

**Response:**
```json
{
  "shares": [
    {
      "id": "share-id-1",
      "assetId": "asset-123",
      "sharedById": "user-456",
      "sharedWithId": "user-id-1",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Asset shared with 2 user(s)"
}
```

### GET /api/assets/[id]/share

Get all shares for an asset (uploader only).

**Response:**
```json
{
  "shares": [
    {
      "id": "share-id-1",
      "assetId": "asset-123",
      "sharedById": "user-456",
      "sharedWithId": "user-id-1",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### DELETE /api/assets/[id]/share/[userId]

Revoke asset sharing for a specific user.

**Response:**
```json
{
  "message": "Share revoked successfully"
}
```

## Error Handling

The ShareManager throws descriptive errors for various validation failures:

- `"Asset not found"` - Asset ID is invalid
- `"Only the uploader can share this asset"` - Non-uploader attempting to share
- `"Can only share assets with UPLOADER_ONLY or SELECTED_USERS visibility"` - Invalid visibility
- `"One or more recipients not found"` - Invalid recipient user IDs
- `"Cannot share asset with yourself"` - Attempting to share with self
- `"Share not found"` - Attempting to revoke non-existent share

## Audit Logging

All sharing operations are logged with detailed context:

```typescript
{
  action: 'SHARE',
  resourceType: 'ASSET',
  resourceId: 'asset-123',
  metadata: {
    sharedWithIds: ['user-789', 'user-012'],
    sharedWithCount: 2,
    timestamp: '2024-01-01T00:00:00Z'
  }
}
```

Revocations are also logged:

```typescript
{
  action: 'SHARE',
  resourceType: 'ASSET',
  resourceId: 'asset-123',
  metadata: {
    action: 'revoke',
    revokedFromUserId: 'user-789',
    timestamp: '2024-01-01T00:00:00Z'
  }
}
```

## Notifications

When an asset is shared, the ShareManager automatically creates notifications for recipients:

```typescript
{
  type: 'ASSET_SHARED',
  title: 'Asset Shared With You',
  message: 'John Doe shared "Marketing Campaign Assets" with you',
  relatedResourceType: 'ASSET',
  relatedResourceId: 'asset-123'
}
```

## Best Practices

1. **Always check permissions**: Verify the user has permission to share before calling ShareManager
2. **Handle errors gracefully**: Catch and handle validation errors appropriately
3. **Provide user feedback**: Show clear messages to users about sharing success or failure
4. **Audit logging**: Always provide IP address and user agent for audit logging
5. **Batch operations**: When sharing with multiple users, use a single `shareAsset` call rather than multiple calls

## Example: Complete Sharing Flow

```typescript
import { ShareManager } from '@/lib/services/ShareManager';
import { VisibilityChecker } from '@/lib/services/VisibilityChecker';

// 1. Check if user can share the asset
const asset = await prisma.asset.findUnique({ where: { id: assetId } });
const canShare = visibilityChecker.canShare(user, asset);

if (!canShare) {
  throw new Error('You do not have permission to share this asset');
}

// 2. Share the asset
try {
  const shares = await shareManager.shareAsset({
    assetId,
    sharedById: user.id,
    sharedWithIds: recipientIds,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // 3. Return success response
  return {
    success: true,
    message: `Asset shared with ${shares.length} user(s)`,
    shares,
  };
} catch (error) {
  // 4. Handle errors
  console.error('Error sharing asset:', error);
  throw error;
}
```

## Related Services

- **VisibilityService**: Handles visibility rule evaluation including shared assets
- **VisibilityChecker**: Provides permission checking including `canShare` method
- **AuditService**: Logs all sharing operations
- **NotificationService**: Sends notifications to recipients
