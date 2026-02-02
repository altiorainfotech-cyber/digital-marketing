/**
 * Permission Utilities for API Routes
 * 
 * Provides helper functions to check permissions in API routes
 * using the PermissionChecker service.
 * 
 * Requirements: 11.2, 11.3
 */

import { NextResponse } from 'next/server';
import { permissionChecker, type PermissionUser, type PermissionAsset } from '@/lib/services';
import type { AuthContext } from './api-middleware';
import type { Action } from '@/types';

/**
 * Convert AuthContext user to PermissionUser
 */
export function toPermissionUser(authContext: AuthContext): PermissionUser {
  return {
    id: authContext.user.id,
    role: authContext.user.role,
    companyId: authContext.user.companyId,
  };
}

/**
 * Check if user can perform an action on an asset
 * 
 * @param authContext - Authenticated user context
 * @param asset - Asset to check permissions for
 * @param action - Action to check (VIEW, EDIT, DELETE, APPROVE, DOWNLOAD)
 * @returns true if user can perform the action
 */
export async function canPerformAction(
  authContext: AuthContext,
  asset: PermissionAsset,
  action: Action
): Promise<boolean> {
  const user = toPermissionUser(authContext);

  switch (action) {
    case 'VIEW':
      return await permissionChecker.canView(user, asset);
    case 'EDIT':
      return permissionChecker.canEdit(user, asset);
    case 'DELETE':
      return permissionChecker.canDelete(user, asset);
    case 'APPROVE':
      return permissionChecker.canApprove(user, asset);
    case 'DOWNLOAD':
      return await permissionChecker.canDownload(user, asset);
    default:
      return false;
  }
}

/**
 * Require permission to perform an action on an asset
 * 
 * Returns 403 Forbidden response if user doesn't have permission
 * 
 * @param authContext - Authenticated user context
 * @param asset - Asset to check permissions for
 * @param action - Action to check
 * @returns null if permission granted, NextResponse with 403 if denied
 * 
 * @example
 * ```typescript
 * const asset = await getAsset(assetId);
 * const forbidden = await requirePermission(authContext, asset, 'VIEW');
 * if (forbidden) return forbidden;
 * // Continue with action...
 * ```
 */
export async function requirePermission(
  authContext: AuthContext,
  asset: PermissionAsset,
  action: Action
): Promise<NextResponse | null> {
  const hasPermission = await canPerformAction(authContext, asset, action);

  if (!hasPermission) {
    return NextResponse.json(
      {
        error: `Forbidden - Insufficient permissions to ${action.toLowerCase()} this asset`,
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Get asset filter for current user
 * 
 * Returns a Prisma where clause that filters assets based on user permissions
 * 
 * @param authContext - Authenticated user context
 * @returns Prisma where clause
 * 
 * @example
 * ```typescript
 * const assets = await prisma.asset.findMany({
 *   where: getAssetFilter(authContext),
 * });
 * ```
 */
export function getAssetFilter(authContext: AuthContext) {
  const user = toPermissionUser(authContext);
  return permissionChecker.getAssetFilterForUser(user);
}

/**
 * Check all permissions for an asset
 * 
 * @param authContext - Authenticated user context
 * @param asset - Asset to check permissions for
 * @returns VisibilityCheckResult with all permission flags
 */
export async function checkAllPermissions(
  authContext: AuthContext,
  asset: PermissionAsset
) {
  const user = toPermissionUser(authContext);
  return await permissionChecker.checkAllPermissions(user, asset);
}
