# AuditService Documentation

## Overview

The `AuditService` class manages audit logging for all system operations in the DASCMS application. It creates immutable audit log entries for compliance and security tracking, ensuring that every significant operation is recorded with complete context.

## Purpose

- **Compliance**: Maintain a complete audit trail for regulatory compliance
- **Security**: Track all system actions for security monitoring and incident response
- **Accountability**: Record who did what, when, and why
- **Debugging**: Provide detailed context for troubleshooting issues

## Requirements

This service implements the following requirements:
- **Requirement 12.1**: Create audit log entries for all asset operations
- **Requirement 12.2**: Record user ID, action type, timestamp, and affected resource
- **Requirement 12.5**: Include detailed context for sensitive operations (approval, rejection, visibility changes)

## Key Features

1. **Universal Logging**: Creates audit logs for all operations (create, update, delete, approve, reject, download, share, visibility changes, login, logout)
2. **Immutable Records**: Audit logs cannot be modified or deleted once created
3. **Detailed Context**: Includes metadata, IP address, user agent, and operation-specific details
4. **Sensitive Operation Tracking**: Captures previous and new values for sensitive operations
5. **Timestamp Tracking**: Automatically adds timestamps to all audit log entries

## Usage

### Basic Setup

```typescript
import { PrismaClient } from '@/app/generated/prisma';
import { AuditService } from '@/lib/services/AuditService';

const prisma = new PrismaClient();
const auditService = new AuditService(prisma);
```

### Asset Operations

#### Log Asset Creation

```typescript
await auditService.logAssetCreate(
  userId,
  assetId,
  {
    assetType: 'IMAGE',
    uploadType: 'SEO',
    visibility: 'ADMIN_ONLY',
    title: 'Marketing Banner',
  },
  ipAddress,
  userAgent
);
```

#### Log Asset Update

```typescript
await auditService.logAssetUpdate(
  userId,
  assetId,
  {
    fieldsChanged: ['title', 'description'],
    previousValues: { title: 'Old Title' },
    newValues: { title: 'New Title' },
  },
  ipAddress,
  userAgent
);
```

#### Log Asset Deletion

```typescript
await auditService.logAssetDelete(
  userId,
  assetId,
  {
    title: 'Deleted Asset',
    assetType: 'IMAGE',
    uploadType: 'SEO',
  },
  ipAddress,
  userAgent
);
```

### Approval Operations

#### Log Asset Approval

```typescript
await auditService.logAssetApprove(
  adminUserId,
  assetId,
  {
    previousValue: { status: 'PENDING_REVIEW', visibility: 'ADMIN_ONLY' },
    newValue: { status: 'APPROVED', visibility: 'COMPANY' },
  },
  ipAddress,
  userAgent
);
```

#### Log Asset Rejection

```typescript
await auditService.logAssetReject(
  adminUserId,
  assetId,
  {
    reason: 'Does not meet quality standards',
    previousValue: { status: 'PENDING_REVIEW' },
    newValue: { status: 'REJECTED' },
  },
  ipAddress,
  userAgent
);
```

### Visibility Changes

```typescript
await auditService.logVisibilityChange(
  adminUserId,
  assetId,
  {
    previousValue: 'ADMIN_ONLY',
    newValue: 'COMPANY',
  },
  ipAddress,
  userAgent
);
```

### Download Tracking

```typescript
await auditService.logAssetDownload(
  userId,
  assetId,
  {
    platformIntent: 'LINKEDIN',
  },
  ipAddress,
  userAgent
);
```

### Sharing Operations

```typescript
await auditService.logAssetShare(
  userId,
  assetId,
  {
    sharedWithUserIds: ['user-789', 'user-012'],
  },
  ipAddress,
  userAgent
);
```

### User Management

#### Log User Creation

```typescript
await auditService.logUserCreate(
  adminUserId,
  newUserId,
  {
    role: 'CONTENT_CREATOR',
    companyId: 'company-789',
    email: 'user@example.com',
  },
  ipAddress,
  userAgent
);
```

#### Log User Update

```typescript
await auditService.logUserUpdate(
  adminUserId,
  targetUserId,
  {
    fieldsChanged: ['role', 'companyId'],
    previousValues: { role: 'CONTENT_CREATOR' },
    newValues: { role: 'SEO_SPECIALIST' },
  },
  ipAddress,
  userAgent
);
```

### Company Management

```typescript
await auditService.logCompanyCreate(
  adminUserId,
  companyId,
  {
    name: 'Acme Corporation',
  },
  ipAddress,
  userAgent
);
```

### Authentication

#### Log Login

```typescript
await auditService.logLogin(
  userId,
  {
    loginMethod: 'credentials',
  },
  ipAddress,
  userAgent
);
```

#### Log Logout

```typescript
await auditService.logLogout(
  userId,
  {},
  ipAddress,
  userAgent
);
```

## API Reference

### Core Method

#### `createAuditLog(params: CreateAuditLogParams)`

Creates a generic audit log entry. All other methods use this internally.

**Parameters:**
- `userId` (string): ID of the user performing the action
- `action` (AuditAction): Type of action (CREATE, UPDATE, DELETE, APPROVE, REJECT, etc.)
- `resourceType` (ResourceType): Type of resource (ASSET, USER, COMPANY, APPROVAL)
- `resourceId` (string): ID of the affected resource
- `metadata` (Record<string, any>): Additional context (optional)
- `ipAddress` (string): IP address of the user (optional)
- `userAgent` (string): User agent string (optional)
- `assetId` (string): Asset ID for asset-related operations (optional)

**Returns:** Promise<AuditLog>

### Asset Methods

- `logAssetCreate(userId, assetId, metadata?, ipAddress?, userAgent?)`
- `logAssetUpdate(userId, assetId, metadata?, ipAddress?, userAgent?)`
- `logAssetDelete(userId, assetId, metadata?, ipAddress?, userAgent?)`
- `logAssetApprove(userId, assetId, context?, ipAddress?, userAgent?)`
- `logAssetReject(userId, assetId, context?, ipAddress?, userAgent?)`
- `logAssetDownload(userId, assetId, metadata?, ipAddress?, userAgent?)`
- `logAssetShare(userId, assetId, metadata?, ipAddress?, userAgent?)`
- `logVisibilityChange(userId, assetId, context?, ipAddress?, userAgent?)`

### User Methods

- `logUserCreate(userId, newUserId, metadata?, ipAddress?, userAgent?)`
- `logUserUpdate(userId, targetUserId, metadata?, ipAddress?, userAgent?)`
- `logUserDelete(userId, deletedUserId, metadata?, ipAddress?, userAgent?)`

### Company Methods

- `logCompanyCreate(userId, companyId, metadata?, ipAddress?, userAgent?)`
- `logCompanyUpdate(userId, companyId, metadata?, ipAddress?, userAgent?)`
- `logCompanyDelete(userId, companyId, metadata?, ipAddress?, userAgent?)`

### Authentication Methods

- `logLogin(userId, metadata?, ipAddress?, userAgent?)`
- `logLogout(userId, metadata?, ipAddress?, userAgent?)`

## Best Practices

### 1. Always Log Before Operations

Create audit logs **before** executing the actual operation to ensure the log is created even if the operation fails:

```typescript
// ✅ CORRECT: Log before operation
await auditService.logAssetDelete(userId, assetId, metadata);
await prisma.asset.delete({ where: { id: assetId } });

// ❌ INCORRECT: Log after operation
await prisma.asset.delete({ where: { id: assetId } });
await auditService.logAssetDelete(userId, assetId, metadata); // May not execute if delete fails
```

### 2. Include Detailed Context for Sensitive Operations

For approval, rejection, and visibility changes, always include previous and new values:

```typescript
await auditService.logAssetApprove(adminUserId, assetId, {
  previousValue: { status: 'PENDING_REVIEW', visibility: 'ADMIN_ONLY' },
  newValue: { status: 'APPROVED', visibility: 'COMPANY' },
  approvedBy: adminUser.name,
  approvedAt: new Date().toISOString(),
});
```

### 3. Capture IP Address and User Agent

Always pass IP address and user agent when available for security tracking:

```typescript
// In API routes
const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
const userAgent = req.headers['user-agent'];

await auditService.logAssetCreate(userId, assetId, metadata, ipAddress, userAgent);
```

### 4. Use Descriptive Metadata

Include relevant context in metadata to make audit logs useful:

```typescript
await auditService.logAssetUpdate(userId, assetId, {
  fieldsChanged: ['title', 'description', 'tags'],
  previousValues: {
    title: 'Old Title',
    description: 'Old description',
    tags: ['old', 'tags'],
  },
  newValues: {
    title: 'New Title',
    description: 'New description',
    tags: ['new', 'tags'],
  },
  reason: 'Updated for Q4 campaign',
});
```

### 5. Handle Errors Gracefully

Audit logging should not prevent operations from completing. Use try-catch blocks:

```typescript
try {
  await auditService.logAssetCreate(userId, assetId, metadata);
} catch (error) {
  console.error('Failed to create audit log:', error);
  // Continue with operation
}

// Proceed with actual operation
await createAsset(data);
```

## Integration with API Routes

### Example: Asset Creation API

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/services/AuditService';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const auditService = new AuditService(prisma);

  // Extract request metadata
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    // Create asset
    const asset = await prisma.asset.create({
      data: {
        ...data,
        uploaderId: session.user.id,
      },
    });

    // Log the creation (after successful creation)
    await auditService.logAssetCreate(
      session.user.id,
      asset.id,
      {
        assetType: asset.assetType,
        uploadType: asset.uploadType,
        visibility: asset.visibility,
        title: asset.title,
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Asset creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}
```

## Data Model

The AuditLog model in Prisma:

```prisma
model AuditLog {
  id           String       @id @default(cuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  action       AuditAction
  resourceType ResourceType
  resourceId   String
  metadata     Json
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime     @default(now())
  assetId      String?
  asset        Asset?       @relation(fields: [assetId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([action])
  @@index([resourceType])
  @@index([createdAt])
}
```

## Testing

The AuditService includes comprehensive unit tests covering:
- Creating audit logs with all required fields
- Creating audit logs with minimal fields
- Logging all asset operations
- Logging approval and rejection with context
- Logging visibility changes
- Logging user and company operations
- Logging authentication events
- Handling edge cases (empty metadata, null optional fields)

Run tests:
```bash
npm test -- AuditService.test.ts
```

## Security Considerations

1. **Immutability**: Audit logs cannot be modified or deleted once created
2. **Complete Context**: All sensitive operations include previous and new values
3. **IP Tracking**: IP addresses are recorded for security monitoring
4. **User Agent**: User agents help identify suspicious activity
5. **Timestamps**: All logs include automatic timestamps for chronological tracking

## Future Enhancements

Potential improvements for future versions:
- Audit log retention policies
- Audit log export functionality
- Real-time audit log streaming
- Anomaly detection based on audit logs
- Audit log search and filtering API
- Audit log visualization dashboard
