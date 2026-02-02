# PermissionChecker Service Implementation

## Overview

The PermissionChecker service has been successfully implemented to provide role-based and asset-level permission verification for the DASCMS application.

## Implementation Summary

### Files Created

1. **`lib/services/PermissionChecker.ts`** - Core service implementation
   - `PermissionChecker` class with permission checking methods
   - Role-based permission checks
   - Asset-level visibility verification
   - Asset filtering for database queries

2. **`lib/services/index.ts`** - Service module exports
   - Exports PermissionChecker and related types

3. **`lib/auth/permissions.ts`** - API route helper utilities
   - `toPermissionUser()` - Convert AuthContext to PermissionUser
   - `canPerformAction()` - Check if user can perform an action
   - `requirePermission()` - Middleware-style permission check
   - `getAssetFilter()` - Get Prisma filter for user permissions
   - `checkAllPermissions()` - Get all permissions at once

4. **`tests/services/PermissionChecker.test.ts`** - Unit tests (31 tests)
   - Tests for all visibility levels
   - Tests for all action types (VIEW, EDIT, DELETE, APPROVE, DOWNLOAD)
   - Tests for role-based filtering
   - Error handling tests

5. **`tests/auth/permissions.test.ts`** - Helper utility tests (13 tests)
   - Tests for API route helpers
   - Tests for permission utilities

6. **Documentation**
   - `lib/services/README.md` - Service documentation
   - `lib/services/EXAMPLE_USAGE.md` - Practical usage examples

## Features Implemented

### 1. Role-Based Permission Checks

The service implements role-based checks for three user roles:
- **Admin**: Full access to all SEO assets, own Doc assets, and shared Doc assets
- **Content Creator**: Access to own uploads, shared assets, and public/company assets
- **SEO Specialist**: Access to APPROVED assets based on visibility rules

### 2. Asset-Level Permission Verification

Implements all seven visibility levels:
- **PUBLIC**: All authenticated users can view
- **UPLOADER_ONLY**: Only the uploader can view
- **ADMIN_ONLY**: Admin and uploader can view
- **COMPANY**: All users in the same company can view
- **TEAM**: All users in the same team can view (placeholder for future implementation)
- **ROLE**: Users with specific roles (via AssetShare) can view
- **SELECTED_USERS**: Explicitly selected users (via AssetShare) can view

### 3. Action Verification

Supports checking permissions for five actions:
- **VIEW**: Can the user view the asset?
- **EDIT**: Can the user edit the asset?
- **DELETE**: Can the user delete the asset?
- **APPROVE**: Can the user approve/reject the asset?
- **DOWNLOAD**: Can the user download the asset?

### 4. Database Query Filtering

Provides `getAssetFilterForUser()` method that returns Prisma where clauses to filter assets at the database level, ensuring efficient permission-based queries.

## Requirements Satisfied

- ✅ **Requirement 11.2**: Role-based permission verification
- ✅ **Requirement 11.3**: Asset-level permission verification
- ✅ **Property 5**: Visibility-Based Access Control
- ✅ **Property 6**: Role-Based Asset Filtering
- ✅ **Property 21**: Role-Based Permission Verification
- ✅ **Property 22**: Asset-Level Permission Verification

## Test Coverage

- **Total Tests**: 44 tests (31 + 13)
- **All Tests Passing**: ✅
- **Coverage Areas**:
  - All visibility levels
  - All action types
  - Role-based filtering
  - Error handling
  - API route helpers

## Usage Examples

### Basic Permission Check

```typescript
import { withAuth, requirePermission } from '@/lib/auth';

export const GET = withAuth(async (request, authContext, { params }) => {
  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  
  const forbidden = await requirePermission(authContext, asset, 'VIEW');
  if (forbidden) return forbidden;
  
  return NextResponse.json({ asset });
});
```

### Asset Filtering

```typescript
import { withAuth, getAssetFilter } from '@/lib/auth';

export const GET = withAuth(async (request, authContext) => {
  const assets = await prisma.asset.findMany({
    where: getAssetFilter(authContext),
  });
  
  return NextResponse.json({ assets });
});
```

### Direct Service Usage

```typescript
import { permissionChecker } from '@/lib/services';

const canView = await permissionChecker.canView(user, asset);
const canEdit = permissionChecker.canEdit(user, asset);
const permissions = await permissionChecker.checkAllPermissions(user, asset);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│  (withAuth, requirePermission, getAssetFilter)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Permission Utilities                            │
│  (toPermissionUser, canPerformAction, etc.)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            PermissionChecker Service                         │
│  • canView()                                                 │
│  • canEdit()                                                 │
│  • canDelete()                                               │
│  • canApprove()                                              │
│  • canDownload()                                             │
│  • checkAllPermissions()                                     │
│  • getAssetFilterForUser()                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Prisma Database                             │
│  (AssetShare queries for ROLE and SELECTED_USERS)          │
└─────────────────────────────────────────────────────────────┘
```

## Permission Logic Flow

### View Permission Check

```
1. Is visibility PUBLIC? → Allow
2. Is visibility UPLOADER_ONLY? → Allow if user is uploader
3. Is visibility ADMIN_ONLY? → Allow if user is Admin or uploader
4. Is visibility COMPANY? → Allow if user in same company
5. Is visibility TEAM? → Check team membership (not yet implemented)
6. Is visibility ROLE? → Check AssetShare for role match
7. Is visibility SELECTED_USERS? → Check AssetShare for user
8. Default → Deny
```

### Edit/Delete Permission Check

```
1. Is user Admin? → Allow
2. Is user the uploader? → Allow
3. Default → Deny
```

### Approve Permission Check

```
1. Is user Admin? → Continue
2. Is asset status PENDING_REVIEW? → Allow
3. Default → Deny
```

## Integration Points

The PermissionChecker integrates with:

1. **Authentication Middleware** (`lib/auth/api-middleware.ts`)
   - Uses AuthContext to get user information
   - Provides permission checks in API routes

2. **Prisma Database** (`lib/prisma.ts`)
   - Queries AssetShare table for ROLE and SELECTED_USERS visibility
   - Provides filters for efficient database queries

3. **API Routes** (future implementation)
   - Asset management endpoints
   - Approval workflow endpoints
   - Download tracking endpoints

## Future Enhancements

1. **Team Support**: Implement TEAM visibility when team model is added
2. **Caching**: Add permission caching for frequently accessed assets
3. **Audit Logging**: Integrate with AuditService to log permission denials
4. **Performance**: Optimize AssetShare queries with database indexes
5. **Batch Checks**: Add methods to check permissions for multiple assets at once

## Security Considerations

1. **Default Deny**: All permission checks default to deny if no rule matches
2. **Database Validation**: Always fetch fresh asset data before permission checks
3. **Error Handling**: Database errors in permission checks default to deny
4. **Logging**: Permission denials should be logged for security monitoring
5. **Testing**: Comprehensive test coverage ensures permission logic is correct

## Maintenance Notes

- Keep permission logic in sync with requirements document
- Update tests when adding new visibility levels or actions
- Document any changes to permission rules
- Review permission logic during security audits
- Monitor permission denial logs for suspicious activity

## Related Documentation

- [Requirements Document](.kiro/specs/dascms/requirements.md) - Requirements 11.2, 11.3
- [Design Document](.kiro/specs/dascms/design.md) - Properties 5, 6, 21, 22
- [Service README](../lib/services/README.md) - Service documentation
- [Example Usage](../lib/services/EXAMPLE_USAGE.md) - Practical examples
