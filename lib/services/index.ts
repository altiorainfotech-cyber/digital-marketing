/**
 * Services Module
 * 
 * Central export point for all service classes
 */

export {
  PermissionChecker,
  permissionChecker,
  type PermissionUser,
  type PermissionAsset,
} from './PermissionChecker';

export {
  AuditService,
  type CreateAuditLogParams,
  type AuditLogContext,
} from './AuditService';

export {
  StorageService,
} from './StorageService';

export {
  UserService,
  type CreateUserParams,
  type CreateUserResult,
  type UpdateUserParams,
} from './UserService';

export {
  CompanyService,
  type CreateCompanyParams,
  type CreateCompanyResult,
  type UpdateCompanyParams,
  type AssignUsersParams,
  type CompanyWithUserCount,
} from './CompanyService';

export {
  UploadHandler,
  type PresignedUploadRequest,
  type CompleteUploadRequest,
  type CompleteUploadResponse,
} from './UploadHandler';

export {
  VisibilityService,
} from './VisibilityService';

export {
  VisibilityChecker,
} from './VisibilityChecker';

export {
  ApprovalService,
  type ApproveAssetParams,
  type RejectAssetParams,
  type ApprovalResult,
} from './ApprovalService';

export {
  NotificationService,
  type CreateNotificationParams,
  type NotificationResult,
  type NotificationQuery,
} from './NotificationService';

export {
  ShareManager,
  type ShareAssetParams,
  type RevokeShareParams,
  type AssetShareResult,
} from './ShareManager';

export {
  UsageService,
  type LogUsageParams,
  type UsageStats,
} from './UsageService';

export {
  DownloadService,
  type InitiateDownloadParams,
} from './DownloadService';

export {
  SearchService,
  type SearchParams,
  type SearchResult,
} from './SearchService';

export {
  ActivationCodeGeneratorImpl,
  type ActivationCodeGenerator,
} from './ActivationCodeGenerator';

export {
  CacheService,
  getCacheService,
} from './CacheService';

export {
  SecurityServiceImpl,
  type SecurityService,
  type RateLimitResult,
} from './SecurityService';

export {
  UserManagementServiceImpl,
  type UserManagementService,
  type CreateUserInput,
  type CreateUserWithActivationResult,
} from './UserManagementService';

export {
  ActivationServiceImpl,
  type ActivationService,
  type ValidationResult,
} from './ActivationService';
