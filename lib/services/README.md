# Services Module

This directory contains business logic services for the DASCMS application.

## PermissionChecker

The `PermissionChecker` service implements role-based and asset-level permission verification.

### Features

- **Role-based checks**: Verify user roles (Admin, Content Creator, SEO Specialist)
- **Asset-level permissions**: Check visibility-based access control
- **Action verification**: Check permissions for VIEW, EDIT, DELETE, APPROVE, DOWNLOAD actions
- **Asset filtering**: Generate Prisma queries to filter assets based on user permissions

### Usage in API Routes

```typescript
import { withAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Example: Get asset by ID with permission check
export const GET = withAuth(async (request, authContext) => {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('id');

  // Fetch asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  // Check VIEW permission
  const forbidden = await requirePermission(authContext, asset, 'VIEW');
  if (forbidden) return forbidden;

  // User has permission, return asset
  return NextResponse.json({ asset });
});
```

### Usage with Asset Filtering

```typescript
import { withAuth, getAssetFilter } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Example: List assets with automatic filtering
export const GET = withAuth(async (request, authContext) => {
  // Get assets filtered by user permissions
  const assets = await prisma.asset.findMany({
    where: getAssetFilter(authContext),
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json({ assets });
});
```

### Direct Service Usage

```typescript
import { permissionChecker, type PermissionUser, type PermissionAsset } from '@/lib/services';

const user: PermissionUser = {
  id: 'user-123',
  role: UserRole.CONTENT_CREATOR,
  companyId: 'company-456',
};

const asset: PermissionAsset = {
  id: 'asset-789',
  uploaderId: 'user-123',
  visibility: VisibilityLevel.COMPANY,
  status: AssetStatus.APPROVED,
  uploadType: 'SEO',
  companyId: 'company-456',
};

// Check individual permissions
const canView = await permissionChecker.canView(user, asset);
const canEdit = permissionChecker.canEdit(user, asset);
const canDelete = permissionChecker.canDelete(user, asset);
const canApprove = permissionChecker.canApprove(user, asset);

// Check all permissions at once
const permissions = await permissionChecker.checkAllPermissions(user, asset);
console.log(permissions);
// {
//   canView: true,
//   canEdit: true,
//   canDelete: true,
//   canApprove: false,
//   reason: undefined
// }
```

### Visibility Rules

The PermissionChecker implements the following visibility rules:

1. **PUBLIC**: All authenticated users can view
2. **UPLOADER_ONLY**: Only the uploader can view
3. **ADMIN_ONLY**: Admin and uploader can view
4. **COMPANY**: All users in the same company can view
5. **TEAM**: All users in the same team can view (not yet implemented)
6. **ROLE**: Users with specific roles (via AssetShare) can view
7. **SELECTED_USERS**: Explicitly selected users (via AssetShare) can view

### Role-Based Filtering

The service provides different asset filters based on user role:

**Admin**:
- Can see all SEO assets
- Can see their own Doc assets
- Can see Doc assets explicitly shared with them

**SEO Specialist**:
- Can only see APPROVED assets
- Must have permission based on visibility rules (PUBLIC, COMPANY, ROLE, SELECTED_USERS)

**Content Creator**:
- Can see their own uploads
- Can see assets explicitly shared with them
- Can see PUBLIC assets
- Can see COMPANY assets (if they belong to a company)

### Requirements

This service implements:
- **Requirement 11.2**: Role-based permission verification
- **Requirement 11.3**: Asset-level permission verification
- **Property 5**: Visibility-Based Access Control
- **Property 6**: Role-Based Asset Filtering
- **Property 21**: Role-Based Permission Verification
- **Property 22**: Asset-Level Permission Verification
