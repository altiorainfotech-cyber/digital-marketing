/**
 * AuditService
 * 
 * Manages audit logging for all system operations.
 * Creates immutable audit log entries for compliance and security tracking.
 * 
 * Requirements: 12.1, 12.2, 12.5
 * 
 * Key Features:
 * - Creates audit logs for all operations (create, update, delete, approve, reject, etc.)
 * - Records user ID, action type, timestamp, and affected resource
 * - Includes detailed context for sensitive operations
 * - Ensures audit logs are created BEFORE operations execute
 */

import { PrismaClient } from '@/app/generated/prisma';
import { AuditAction, ResourceType } from '@/types';

export interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  assetId?: string;
}

export interface AuditLogContext {
  previousValue?: any;
  newValue?: any;
  reason?: string;
  [key: string]: any;
}

export class AuditService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create an audit log entry
   * 
   * This is the core method that all other audit logging methods use.
   * It creates an immutable record of a system operation.
   * 
   * @param params - The audit log parameters
   * @returns The created audit log entry
   */
  async createAuditLog(params: CreateAuditLogParams) {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      metadata = {},
      ipAddress,
      userAgent,
      assetId,
    } = params;

    return await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        metadata,
        ipAddress,
        userAgent,
        assetId,
      },
    });
  }

  /**
   * Log asset creation
   * 
   * @param userId - ID of the user creating the asset
   * @param assetId - ID of the created asset
   * @param metadata - Additional context (asset type, upload type, visibility, etc.)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logAssetCreate(
    userId: string,
    assetId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.CREATE,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log asset update
   * 
   * @param userId - ID of the user updating the asset
   * @param assetId - ID of the updated asset
   * @param metadata - Additional context (fields changed, previous values, new values)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logAssetUpdate(
    userId: string,
    assetId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.UPDATE,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log asset deletion
   * 
   * @param userId - ID of the user deleting the asset
   * @param assetId - ID of the deleted asset
   * @param metadata - Additional context (asset details before deletion)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logAssetDelete(
    userId: string,
    assetId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.DELETE,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log asset approval
   * 
   * Includes detailed context as required for sensitive operations (Requirement 12.5)
   * 
   * @param userId - ID of the admin approving the asset
   * @param assetId - ID of the approved asset
   * @param context - Detailed context including previous and new visibility
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logAssetApprove(
    userId: string,
    assetId: string,
    context: AuditLogContext = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.APPROVE,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        operation: 'approve',
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log asset rejection
   * 
   * Includes detailed context as required for sensitive operations (Requirement 12.5)
   * 
   * @param userId - ID of the admin rejecting the asset
   * @param assetId - ID of the rejected asset
   * @param context - Detailed context including rejection reason
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logAssetReject(
    userId: string,
    assetId: string,
    context: AuditLogContext = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.REJECT,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        operation: 'reject',
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log asset download
   * 
   * @param userId - ID of the user downloading the asset
   * @param assetId - ID of the downloaded asset
   * @param metadata - Additional context (platform intent, etc.)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logAssetDownload(
    userId: string,
    assetId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.DOWNLOAD,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log asset sharing
   * 
   * @param userId - ID of the user sharing the asset
   * @param assetId - ID of the shared asset
   * @param metadata - Additional context (shared with user IDs, etc.)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logAssetShare(
    userId: string,
    assetId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.SHARE,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log visibility change
   * 
   * Includes detailed context as required for sensitive operations (Requirement 12.5)
   * 
   * @param userId - ID of the user changing visibility
   * @param assetId - ID of the asset with visibility change
   * @param context - Detailed context including previous and new visibility levels
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logVisibilityChange(
    userId: string,
    assetId: string,
    context: AuditLogContext = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.VISIBILITY_CHANGE,
      resourceType: ResourceType.ASSET,
      resourceId: assetId,
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        operation: 'visibility_change',
      },
      ipAddress,
      userAgent,
      assetId,
    });
  }

  /**
   * Log user creation
   * 
   * @param userId - ID of the admin creating the user
   * @param newUserId - ID of the created user
   * @param metadata - Additional context (role, company, etc.)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logUserCreate(
    userId: string,
    newUserId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.CREATE,
      resourceType: ResourceType.USER,
      resourceId: newUserId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user update
   * 
   * @param userId - ID of the admin updating the user
   * @param targetUserId - ID of the updated user
   * @param metadata - Additional context (fields changed, previous values, new values)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logUserUpdate(
    userId: string,
    targetUserId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.UPDATE,
      resourceType: ResourceType.USER,
      resourceId: targetUserId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user deletion
   * 
   * @param userId - ID of the admin deleting the user
   * @param deletedUserId - ID of the deleted user
   * @param metadata - Additional context (user details before deletion)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logUserDelete(
    userId: string,
    deletedUserId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.DELETE,
      resourceType: ResourceType.USER,
      resourceId: deletedUserId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log company creation
   * 
   * @param userId - ID of the admin creating the company
   * @param companyId - ID of the created company
   * @param metadata - Additional context (company name, etc.)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logCompanyCreate(
    userId: string,
    companyId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.CREATE,
      resourceType: ResourceType.COMPANY,
      resourceId: companyId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log company update
   * 
   * @param userId - ID of the admin updating the company
   * @param companyId - ID of the updated company
   * @param metadata - Additional context (fields changed, previous values, new values)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logCompanyUpdate(
    userId: string,
    companyId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.UPDATE,
      resourceType: ResourceType.COMPANY,
      resourceId: companyId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log company deletion
   * 
   * @param userId - ID of the admin deleting the company
   * @param companyId - ID of the deleted company
   * @param metadata - Additional context (company details before deletion)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logCompanyDelete(
    userId: string,
    companyId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.DELETE,
      resourceType: ResourceType.COMPANY,
      resourceId: companyId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user login
   * 
   * @param userId - ID of the user logging in
   * @param metadata - Additional context (login method, etc.)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logLogin(
    userId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.LOGIN,
      resourceType: ResourceType.USER,
      resourceId: userId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user logout
   * 
   * @param userId - ID of the user logging out
   * @param metadata - Additional context
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  async logLogout(
    userId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createAuditLog({
      userId,
      action: AuditAction.LOGOUT,
      resourceType: ResourceType.USER,
      resourceId: userId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }
}
