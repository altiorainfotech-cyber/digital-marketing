# PermissionChecker Usage Examples

This document provides practical examples of using the PermissionChecker service in API routes.

## Example 1: Get Asset with Permission Check

```typescript
// app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (
  request: NextRequest,
  authContext,
  { params }: { params: { id: string } }
) => {
  const assetId = params.id;

  // Fetch asset from database
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      company: true,
    },
  });

  if (!asset) {
    return NextResponse.json(
      { error: 'Asset not found' },
      { status: 404 }
    );
  }

  // Check if user has permission to view this asset
  const forbidden = await requirePermission(authContext, asset, 'VIEW');
  if (forbidden) return forbidden;

  // User has permission, return asset
  return NextResponse.json({ asset });
});
```

## Example 2: List Assets with Automatic Filtering

```typescript
// app/api/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getAssetFilter } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, authContext) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // Get assets filtered by user permissions
  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where: getAssetFilter(authContext),
      skip,
      take: limit,
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: true,
      },
    }),
    prisma.asset.count({
      where: getAssetFilter(authContext),
    }),
  ]);

  return NextResponse.json({
    assets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
```

## Example 3: Update Asset with Edit Permission

```typescript
// app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateAssetSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(20).optional(),
});

export const PATCH = withAuth(async (
  request: NextRequest,
  authContext,
  { params }: { params: { id: string } }
) => {
  const assetId = params.id;

  // Fetch asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return NextResponse.json(
      { error: 'Asset not found' },
      { status: 404 }
    );
  }

  // Check if user has permission to edit this asset
  const forbidden = await requirePermission(authContext, asset, 'EDIT');
  if (forbidden) return forbidden;

  // Parse and validate request body
  const body = await request.json();
  const validation = updateAssetSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.errors },
      { status: 400 }
    );
  }

  // Update asset
  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: validation.data,
  });

  return NextResponse.json({ asset: updatedAsset });
});
```

## Example 4: Delete Asset with Permission Check

```typescript
// app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const DELETE = withAuth(async (
  request: NextRequest,
  authContext,
  { params }: { params: { id: string } }
) => {
  const assetId = params.id;

  // Fetch asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return NextResponse.json(
      { error: 'Asset not found' },
      { status: 404 }
    );
  }

  // Check if user has permission to delete this asset
  const forbidden = await requirePermission(authContext, asset, 'DELETE');
  if (forbidden) return forbidden;

  // Delete asset
  await prisma.asset.delete({
    where: { id: assetId },
  });

  return NextResponse.json({ message: 'Asset deleted successfully' });
});
```

## Example 5: Approve Asset (Admin Only)

```typescript
// app/api/assets/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VisibilityLevel } from '@/app/generated/prisma';
import { z } from 'zod';

const approveSchema = z.object({
  newVisibility: z.nativeEnum(VisibilityLevel).optional(),
});

export const POST = withAuth(async (
  request: NextRequest,
  authContext,
  { params }: { params: { id: string } }
) => {
  const assetId = params.id;

  // Fetch asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return NextResponse.json(
      { error: 'Asset not found' },
      { status: 404 }
    );
  }

  // Check if user has permission to approve this asset
  const forbidden = await requirePermission(authContext, asset, 'APPROVE');
  if (forbidden) return forbidden;

  // Parse request body
  const body = await request.json();
  const validation = approveSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.errors },
      { status: 400 }
    );
  }

  // Approve asset
  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: authContext.user.id,
      ...(validation.data.newVisibility && {
        visibility: validation.data.newVisibility,
      }),
    },
  });

  // Create approval record
  await prisma.approval.create({
    data: {
      assetId,
      reviewerId: authContext.user.id,
      action: 'APPROVE',
    },
  });

  // TODO: Send notification to uploader

  return NextResponse.json({
    message: 'Asset approved successfully',
    asset: updatedAsset,
  });
});
```

## Example 6: Check All Permissions for Frontend

```typescript
// app/api/assets/[id]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkAllPermissions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (
  request: NextRequest,
  authContext,
  { params }: { params: { id: string } }
) => {
  const assetId = params.id;

  // Fetch asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return NextResponse.json(
      { error: 'Asset not found' },
      { status: 404 }
    );
  }

  // Get all permissions for this asset
  const permissions = await checkAllPermissions(authContext, asset);

  return NextResponse.json({ permissions });
});
```

## Example 7: SEO Assets Endpoint (SEO Specialist)

```typescript
// app/api/seo/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRole, getAssetFilter } from '@/lib/auth';
import { UserRole, AssetStatus } from '@/app/generated/prisma';
import { prisma } from '@/lib/prisma';

export const GET = withRole(UserRole.SEO_SPECIALIST, async (
  request: NextRequest,
  authContext
) => {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const platform = searchParams.get('platform');

  // Build where clause
  const where = {
    ...getAssetFilter(authContext),
    // SEO Specialists should only see APPROVED assets
    status: AssetStatus.APPROVED,
    ...(company && { companyId: company }),
    ...(platform && { targetPlatforms: { has: platform } }),
  };

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { approvedAt: 'desc' },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      company: true,
    },
  });

  return NextResponse.json({ assets });
});
```

## Example 8: Direct Service Usage (Non-API Context)

```typescript
import { permissionChecker } from '@/lib/services';
import { UserRole, VisibilityLevel, AssetStatus } from '@/app/generated/prisma';

async function canUserAccessAsset(userId: string, assetId: string): Promise<boolean> {
  // Fetch user and asset from database
  const [user, asset] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.asset.findUnique({ where: { id: assetId } }),
  ]);

  if (!user || !asset) {
    return false;
  }

  // Convert to permission types
  const permissionUser = {
    id: user.id,
    role: user.role,
    companyId: user.companyId || undefined,
  };

  const permissionAsset = {
    id: asset.id,
    uploaderId: asset.uploaderId,
    visibility: asset.visibility,
    status: asset.status,
    uploadType: asset.uploadType,
    companyId: asset.companyId || undefined,
  };

  // Check permission
  return await permissionChecker.canView(permissionUser, permissionAsset);
}
```

## Best Practices

1. **Always check permissions**: Never assume a user has access to an asset
2. **Use `requirePermission`**: It provides a clean way to handle permission denials
3. **Use `getAssetFilter`**: For list endpoints, filter at the database level for better performance
4. **Check early**: Verify permissions before performing expensive operations
5. **Return appropriate errors**: Use 403 for permission denied, 404 for not found
6. **Log permission denials**: For security monitoring and debugging
7. **Test permission logic**: Write tests for all permission scenarios
