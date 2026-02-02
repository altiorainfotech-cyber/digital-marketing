# VisibilityChecker Service

## Overview

The `VisibilityChecker` class provides comprehensive permission checking for assets in the DASCMS system. It builds upon the `VisibilityService` to offer granular permission checks for various operations (view, edit, delete, approve) and provides visibility-based filtering logic for asset lists.

## Requirements

Implements requirements:
- **6.2-6.6**: Visibility control rules for all 7 visibility levels
- **7.1-7.3**: Role-based asset filtering (Content_Creator, SEO_Specialist, Admin)
- **7.5**: Authorization error handling for insufficient permissions

## Architecture

```
VisibilityChecker
    ↓ (uses)
VisibilityService
    ↓ (queries)
Prisma (AssetShare, Asset)
```

The `VisibilityChecker` delegates visibility rule evaluation to `VisibilityService` and adds additional permission logic for operations beyond viewing.

## Core Methods

### Permission Checking

#### `canView(user: User, asset: Asset): Promise<boolean>`

Checks if a user can view an asset based on visibility rules.

**Rules:**
- Delegates to `VisibilityService.canUserViewAsset()`
- Follows all 7 visibility level rules (PUBLIC, UPLOADER_ONLY, ADMIN_ONLY, COMPANY, TEAM, ROLE, SELECTED_USERS)

**Example:**
```typescript
const canView = await visibilityChecker.canView(user, asset);
if (!canView) {
  throw new Error('Insufficient permissions to view this asset');
}
```

#### `canEdit(user: User, asset: Asset): boolean`

Checks if a user can edit an asset.

**Rules:**
- Admin can edit any asset
- Uploader can edit their own assets if status is DRAFT or REJECTED
- No one else can edit

**Example:**
```typescript
const canEdit = visibilityChecker.canEdit(user, asset);
if (!canEdit) {
  throw new Error('Insufficient permissions to edit this asset');
}
```

#### `canDelete(user: User, asset: Asset): boolean`

Checks if a user can delete an asset.

**Rules:**
- Admin can delete any asset
- Uploader can delete their own assets if status is DRAFT or REJECTED
- No one else can delete

**Example:**
```typescript
const canDelete = visibilityChecker.canDelete(user, asset);
if (!canDelete) {
  throw new Error('Insufficient permissions to delete this asset');
}
```

#### `canApprove(user: User, asset: Asset): boolean`

Checks if a user can approve or reject an asset.

**Rules:**
- Only Admin can approve/reject assets
- Asset must have uploadType = SEO
- Asset must have status = PENDING_REVIEW

**Example:**
```typescript
const canApprove = visibilityChecker.canApprove(user, asset);
if (!canApprove) {
  throw new Error('Only Admin can approve SEO assets in PENDING_REVIEW status');
}
```

### Comprehensive Permission Check

#### `checkAllPermissions(user: User, asset: Asset): Promise<VisibilityCheckResult>`

Returns a comprehensive permission check result with all permission flags.

**Returns:**
```typescript
{
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  reason?: string;
}
```

**Example:**
```typescript
const permissions = await visibilityChecker.checkAllPermissions(user, asset);
console.log(`View: ${permissions.canView}, Edit: ${permissions.canEdit}`);
if (permissions.reason) {
  console.log(`Reason: ${permissions.reason}`);
}
```

### Filtering Methods

#### `filterVisibleAssets(user: User, assets: Asset[]): Promise<Asset[]>`

Filters a list of assets to only include those visible to the user.

**Example:**
```typescript
const allAssets = await prisma.asset.findMany();
const visibleAssets = await visibilityChecker.filterVisibleAssets(user, allAssets);
```

#### `filterAssetsByRole(user: User, assets: Asset[]): Promise<Asset[]>`

Filters assets based on role-specific rules.

**Role-based filtering rules:**

**Content_Creator:**
- Own uploads + explicitly shared assets
- (Visibility check already handles this)

**SEO_Specialist:**
- Only APPROVED assets they have permission to see
- Excludes DRAFT, PENDING_REVIEW, and REJECTED assets

**Admin:**
- All SEO assets (any status)
- Doc assets only if Admin is uploader or has explicit share

**Example:**
```typescript
const allAssets = await prisma.asset.findMany();
const roleFilteredAssets = await visibilityChecker.filterAssetsByRole(user, allAssets);
```

#### `getVisibleAssetIds(user: User): Promise<string[]>`

Gets asset IDs that are visible to a user (delegates to VisibilityService).

**Example:**
```typescript
const visibleIds = await visibilityChecker.getVisibleAssetIds(user);
const assets = await prisma.asset.findMany({
  where: { id: { in: visibleIds } }
});
```

### Additional Permission Methods

#### `canDownload(user: User, asset: Asset): Promise<boolean>`

Checks if a user can download an asset (same as view permission).

**Example:**
```typescript
const canDownload = await visibilityChecker.canDownload(user, asset);
if (!canDownload) {
  throw new Error('Insufficient permissions to download this asset');
}
```

#### `canShare(user: User, asset: Asset): boolean`

Checks if a user can share an asset.

**Rules:**
- Only uploader can share their own assets
- Asset must have visibility = UPLOADER_ONLY or SELECTED_USERS
- Admin cannot share other users' private assets

**Example:**
```typescript
const canShare = visibilityChecker.canShare(user, asset);
if (!canShare) {
  throw new Error('Only the uploader can share UPLOADER_ONLY or SELECTED_USERS assets');
}
```

#### `canModifyVisibility(user: User, asset: Asset): boolean`

Checks if a user can modify visibility of an asset.

**Rules:**
- Only Admin can modify visibility
- Can only modify visibility of SEO assets
- Doc assets cannot have visibility modified (always UPLOADER_ONLY)

**Example:**
```typescript
const canModifyVisibility = visibilityChecker.canModifyVisibility(user, asset);
if (!canModifyVisibility) {
  throw new Error('Only Admin can modify visibility of SEO assets');
}
```

#### `canLogPlatformUsage(user: User, asset: Asset): Promise<boolean>`

Checks if a user can log platform usage for an asset.

**Rules:**
- User must be able to view the asset
- SEO assets must be APPROVED
- Doc assets can log usage regardless of status

**Example:**
```typescript
const canLog = await visibilityChecker.canLogPlatformUsage(user, asset);
if (!canLog) {
  throw new Error('Cannot log platform usage for non-APPROVED SEO assets');
}
```

## Usage in API Routes

### Example: Asset Detail Endpoint

```typescript
import { VisibilityChecker } from '@/lib/services';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: params.id }
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const visibilityService = new VisibilityService(prisma);
  const visibilityChecker = new VisibilityChecker(visibilityService);

  // Check if user can view the asset
  const canView = await visibilityChecker.canView(session.user, asset);
  if (!canView) {
    return NextResponse.json(
      { error: 'Insufficient permissions to view this asset' },
      { status: 403 }
    );
  }

  // Get all permissions for the asset
  const permissions = await visibilityChecker.checkAllPermissions(session.user, asset);

  return NextResponse.json({
    asset,
    permissions
  });
}
```

### Example: Asset List Endpoint with Role Filtering

```typescript
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const visibilityService = new VisibilityService(prisma);
  const visibilityChecker = new VisibilityChecker(visibilityService);

  // Get all assets
  const allAssets = await prisma.asset.findMany();

  // Filter by role-specific rules
  const visibleAssets = await visibilityChecker.filterAssetsByRole(
    session.user,
    allAssets
  );

  return NextResponse.json({ assets: visibleAssets });
}
```

### Example: Asset Edit Endpoint

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: params.id }
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const visibilityService = new VisibilityService(prisma);
  const visibilityChecker = new VisibilityChecker(visibilityService);

  // Check if user can edit the asset
  const canEdit = visibilityChecker.canEdit(session.user, asset);
  if (!canEdit) {
    return NextResponse.json(
      { error: 'Insufficient permissions to edit this asset' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const updatedAsset = await prisma.asset.update({
    where: { id: params.id },
    data: body
  });

  return NextResponse.json({ asset: updatedAsset });
}
```

## Testing

The `VisibilityChecker` has comprehensive unit tests covering:

- **canView**: Delegation to VisibilityService
- **canEdit**: Admin and uploader permissions for DRAFT/REJECTED assets
- **canDelete**: Admin and uploader permissions for DRAFT/REJECTED assets
- **canApprove**: Admin-only approval for SEO assets in PENDING_REVIEW
- **checkAllPermissions**: Comprehensive permission checks with reasons
- **filterVisibleAssets**: Asset filtering based on visibility
- **filterAssetsByRole**: Role-specific filtering rules
- **canDownload**: Download permission checks
- **canShare**: Share permission checks
- **canModifyVisibility**: Visibility modification checks
- **canLogPlatformUsage**: Platform usage logging checks

Run tests:
```bash
npm test -- VisibilityChecker.test.ts
```

## Integration with Other Services

### VisibilityService
- `VisibilityChecker` uses `VisibilityService` for all visibility rule evaluation
- Delegates `canView` checks to `VisibilityService.canUserViewAsset()`
- Uses `VisibilityService.getVisibleAssetIds()` for bulk filtering

### AssetService
- `AssetService` should use `VisibilityChecker` before all asset operations
- Check permissions before allowing edit, delete, or approval operations

### ApprovalService
- Use `canApprove()` before allowing approval/rejection operations
- Ensure only Admin can approve SEO assets in PENDING_REVIEW status

### DownloadService
- Use `canDownload()` before generating signed URLs
- Ensure users can only download assets they have permission to view

## Error Handling

Always check permissions before operations and return appropriate HTTP status codes:

- **401 Unauthorized**: User is not authenticated
- **403 Forbidden**: User lacks permission for the operation
- **404 Not Found**: Asset does not exist

Example error responses:
```typescript
// User cannot view
return NextResponse.json(
  { error: 'Insufficient permissions to view this asset' },
  { status: 403 }
);

// User cannot edit
return NextResponse.json(
  { error: 'Insufficient permissions to edit this asset' },
  { status: 403 }
);

// User cannot approve
return NextResponse.json(
  { error: 'Only Admin can approve SEO assets in PENDING_REVIEW status' },
  { status: 403 }
);
```

## Best Practices

1. **Always check permissions before operations**: Never assume a user has permission
2. **Use role-based filtering for lists**: Apply `filterAssetsByRole()` to asset lists
3. **Return comprehensive permissions**: Use `checkAllPermissions()` for UI state management
4. **Log authorization failures**: Track unauthorized access attempts for security
5. **Provide clear error messages**: Help users understand why they lack permission

## Future Enhancements

- **Team-based visibility**: Implement team functionality when team model is added
- **Caching**: Cache permission checks for frequently accessed assets
- **Bulk operations**: Optimize permission checks for bulk operations
- **Permission inheritance**: Consider permission inheritance for asset versions
