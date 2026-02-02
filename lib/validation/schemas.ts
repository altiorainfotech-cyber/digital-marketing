/**
 * Zod Validation Schemas
 * 
 * Centralized validation schemas for all API inputs.
 * Ensures consistent validation across the application.
 * 
 * Requirements:
 * - Description max length: 1000 characters
 * - Tags max count: 20 tags
 * - All required fields validated
 * - Enum values validated
 */

import { z } from 'zod';
import {
  UserRole,
  AssetType,
  UploadType,
  AssetStatus,
  VisibilityLevel,
  Platform,
  ApprovalAction,
  AuditAction,
  ResourceType,
  NotificationType,
} from '@/types';

// ============================================================================
// User Management Schemas
// ============================================================================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole, { message: 'Invalid role' }),
  companyId: z.string().uuid('Invalid company ID').optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.nativeEnum(UserRole, { message: 'Invalid role' }).optional(),
  companyId: z.string().uuid('Invalid company ID').nullable().optional(),
});

export const listUsersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  companyId: z.string().uuid('Invalid company ID').optional(),
});

// ============================================================================
// Company Management Schemas
// ============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255, 'Company name cannot exceed 255 characters'),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255, 'Company name cannot exceed 255 characters').optional(),
});

// ============================================================================
// Asset Management Schemas
// ============================================================================

export const createAssetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  tags: z.array(z.string()).max(20, 'Cannot have more than 20 tags').optional(),
  assetType: z.nativeEnum(AssetType, { message: 'Invalid asset type' }),
  uploadType: z.nativeEnum(UploadType, { message: 'Invalid upload type' }),
  companyId: z.string().uuid('Invalid company ID').optional(),
  storageUrl: z.string().optional(),
  fileSize: z.number().int().positive('File size must be positive').optional(),
  mimeType: z.string().optional(),
  targetPlatforms: z.array(z.string()).optional(),
  campaignName: z.string().max(255, 'Campaign name cannot exceed 255 characters').optional(),
  submitForReview: z.boolean().optional(),
  visibility: z.nativeEnum(VisibilityLevel, { message: 'Invalid visibility level' }).optional(),
  url: z.string().url('Invalid URL').optional(),
}).refine(
  (data) => {
    // For SEO uploads, companyId is required
    if (data.uploadType === UploadType.SEO && !data.companyId) {
      return false;
    }
    return true;
  },
  {
    message: 'Company required for SEO/Digital marketing uploads',
    path: ['companyId'],
  }
).refine(
  (data) => {
    // For non-LINK assets, storageUrl or url is required
    if (data.assetType !== AssetType.LINK && !data.storageUrl && !data.url) {
      return false;
    }
    return true;
  },
  {
    message: 'Storage URL or file is required',
    path: ['storageUrl'],
  }
);

export const updateAssetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  tags: z.array(z.string()).max(20, 'Cannot have more than 20 tags').optional(),
  visibility: z.nativeEnum(VisibilityLevel, { message: 'Invalid visibility level' }).optional(),
  targetPlatforms: z.array(z.string()).optional(),
  campaignName: z.string().max(255, 'Campaign name cannot exceed 255 characters').optional(),
  status: z.nativeEnum(AssetStatus, { message: 'Invalid status' }).optional(),
});

export const listAssetsSchema = z.object({
  uploadType: z.nativeEnum(UploadType).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  companyId: z.string().uuid('Invalid company ID').optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const presignAssetSchema = z.object({
  uploaderId: z.string().uuid('Invalid uploader ID'),
  mode: z.enum(['SEO', 'DOC'], { message: 'Mode must be SEO or DOC' }),
  companyId: z.string().uuid('Invalid company ID').optional(),
  assetType: z.nativeEnum(AssetType, { message: 'Invalid asset type' }),
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  visibility: z.nativeEnum(VisibilityLevel, { message: 'Invalid visibility level' }).optional(),
}).refine(
  (data) => {
    // For SEO mode, companyId is required
    if (data.mode === 'SEO' && !data.companyId) {
      return false;
    }
    return true;
  },
  {
    message: 'Company required for SEO/Digital marketing uploads',
    path: ['companyId'],
  }
);

export const completeAssetSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  storagePath: z.string().min(1, 'Storage path is required'),
  metadata: z.object({
    size: z.number().int().positive().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }).optional(),
  submitForReview: z.boolean().optional(),
});

// ============================================================================
// Approval Workflow Schemas
// ============================================================================

export const approveAssetSchema = z.object({
  newVisibility: z.nativeEnum(VisibilityLevel, { message: 'Invalid visibility level' }).optional(),
  selectedUserIds: z.array(z.string().uuid('Invalid user ID')).optional(),
});

export const rejectAssetSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000, 'Rejection reason cannot exceed 1000 characters'),
});

// ============================================================================
// Asset Sharing Schemas
// ============================================================================

export const shareAssetSchema = z.object({
  sharedWithIds: z.array(z.string().uuid('Invalid user ID')).min(1, 'At least one user must be selected'),
  targetType: z.enum(['USER', 'ROLE', 'TEAM']).optional(),
  targetId: z.string().optional(),
});

// ============================================================================
// Platform Usage Schemas
// ============================================================================

export const logPlatformUsageSchema = z.object({
  platform: z.nativeEnum(Platform, { message: 'Invalid platform' }),
  campaignName: z.string().min(1, 'Campaign name is required').max(255, 'Campaign name cannot exceed 255 characters'),
  postUrl: z.string().url('Invalid URL').optional(),
  usedAt: z.coerce.date().optional(),
});

export const listPlatformUsageSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  platform: z.nativeEnum(Platform).optional(),
});

// ============================================================================
// Download Tracking Schemas
// ============================================================================

export const initiateDownloadSchema = z.object({
  platformIntent: z.nativeEnum(Platform).optional(),
});

// ============================================================================
// Asset Versioning Schemas
// ============================================================================

export const uploadVersionSchema = z.object({
  storageUrl: z.string().min(1, 'Storage URL is required'),
  fileSize: z.number().int().positive('File size must be positive').optional(),
});

// ============================================================================
// Search and Filtering Schemas
// ============================================================================

export const searchAssetsSchema = z.object({
  query: z.string().optional(),
  assetType: z.nativeEnum(AssetType).optional(),
  uploadType: z.nativeEnum(UploadType).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  visibility: z.nativeEnum(VisibilityLevel).optional(),
  companyId: z.string().uuid('Invalid company ID').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['uploadedAt', 'title', 'approvedAt', 'fileSize']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// ============================================================================
// Notification Schemas
// ============================================================================

export const listNotificationsSchema = z.object({
  isRead: z.coerce.boolean().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// ============================================================================
// Audit Log Schemas
// ============================================================================

export const listAuditLogsSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  action: z.nativeEnum(AuditAction).optional(),
  resourceType: z.nativeEnum(ResourceType).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsInput = z.infer<typeof listAssetsSchema>;
export type PresignAssetInput = z.infer<typeof presignAssetSchema>;
export type CompleteAssetInput = z.infer<typeof completeAssetSchema>;

export type ApproveAssetInput = z.infer<typeof approveAssetSchema>;
export type RejectAssetInput = z.infer<typeof rejectAssetSchema>;

export type ShareAssetInput = z.infer<typeof shareAssetSchema>;

export type LogPlatformUsageInput = z.infer<typeof logPlatformUsageSchema>;
export type ListPlatformUsageInput = z.infer<typeof listPlatformUsageSchema>;

export type InitiateDownloadInput = z.infer<typeof initiateDownloadSchema>;

export type UploadVersionInput = z.infer<typeof uploadVersionSchema>;

export type SearchAssetsInput = z.infer<typeof searchAssetsSchema>;

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
