// Core enums
export enum UserRole {
  ADMIN = 'ADMIN',
  CONTENT_CREATOR = 'CONTENT_CREATOR',
  SEO_SPECIALIST = 'SEO_SPECIALIST'
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  LINK = 'LINK'
}

export enum UploadType {
  SEO = 'SEO',
  DOC = 'DOC'
}

export enum AssetStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum VisibilityLevel {
  UPLOADER_ONLY = 'UPLOADER_ONLY',
  ADMIN_ONLY = 'ADMIN_ONLY',
  COMPANY = 'COMPANY',
  TEAM = 'TEAM',
  ROLE = 'ROLE',
  SELECTED_USERS = 'SELECTED_USERS',
  PUBLIC = 'PUBLIC'
}

export enum Platform {
  ADS = 'ADS',
  INSTAGRAM = 'INSTAGRAM',
  META = 'META',
  LINKEDIN = 'LINKEDIN',
  X = 'X',
  SEO = 'SEO',
  BLOGS = 'BLOGS',
  YOUTUBE = 'YOUTUBE',
  SNAPCHAT = 'SNAPCHAT'
}

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT'
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  DOWNLOAD = 'DOWNLOAD',
  SHARE = 'SHARE',
  VISIBILITY_CHANGE = 'VISIBILITY_CHANGE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}

export enum ResourceType {
  ASSET = 'ASSET',
  USER = 'USER',
  COMPANY = 'COMPANY',
  APPROVAL = 'APPROVAL'
}

export enum NotificationType {
  ASSET_UPLOADED = 'ASSET_UPLOADED',
  ASSET_APPROVED = 'ASSET_APPROVED',
  ASSET_REJECTED = 'ASSET_REJECTED',
  ASSET_SHARED = 'ASSET_SHARED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

// Core interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: string;
}

export interface Asset {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  assetType: AssetType;
  uploadType: UploadType;
  status: AssetStatus;
  visibility: VisibilityLevel;
  companyId?: string;
  uploaderId: string;
  storageUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: Date;
  approvedAt?: Date;
  approvedById?: string;
  rejectedAt?: Date;
  rejectedById?: string;
  rejectionReason?: string;
  targetPlatforms?: string[];
  campaignName?: string;
}

export interface UploadRequest {
  title: string;
  description?: string;
  tags?: string[];
  assetType: AssetType;
  uploadType: UploadType;
  companyId?: string;
  file?: File;
  url?: string;
  targetPlatforms?: string[];
  campaignName?: string;
  submitForReview?: boolean;
  visibility?: VisibilityLevel;
}

export interface UploadResponse {
  assetId: string;
  uploadUrl?: string;
  storageUrl: string;
}

export interface ApprovalRequest {
  assetId: string;
  action: ApprovalAction;
  reason?: string;
  newVisibility?: VisibilityLevel;
  selectedUserIds?: string[];
}

export interface ApprovalResponse {
  success: boolean;
  asset: Asset;
  message: string;
}

export interface PlatformUsage {
  id: string;
  assetId: string;
  platform: Platform;
  campaignName: string;
  postUrl?: string;
  usedAt: Date;
  loggedById: string;
}

export interface UsageRequest {
  assetId: string;
  platform: Platform;
  campaignName: string;
  postUrl?: string;
  usedAt?: Date;
}

export interface AssetDownload {
  id: string;
  assetId: string;
  downloadedById: string;
  downloadedAt: Date;
  platformIntent?: Platform;
  platforms?: Platform[];
}

export interface DownloadRequest {
  assetId: string;
  platformIntent?: Platform;
  platforms?: Platform[];
}

export interface DownloadResponse {
  downloadUrl: string;
  expiresAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedResourceType?: ResourceType;
  relatedResourceId?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface StorageConfig {
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2PublicUrl?: string;
  streamAccountId?: string;
  streamApiToken?: string;
  imagesAccountId?: string;
  imagesApiToken?: string;
}

export interface StorageUploadRequest {
  file: File | Buffer;
  assetType: AssetType;
  assetId: string;
  fileName?: string;
  contentType?: string;
}

export interface StorageUploadResponse {
  storageUrl: string;
  publicUrl?: string;
  thumbnailUrl?: string;
}

export interface SignedUrlRequest {
  storageUrl: string;
  expiresIn: number; // seconds
}

export interface SignedUrlResponse {
  signedUrl: string;
  expiresAt: Date;
}

export interface PermissionContext {
  user: User;
  resource: Asset;
  action: Action;
}

export enum Action {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  DOWNLOAD = 'DOWNLOAD'
}

export interface VisibilityCheckResult {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  reason?: string;
}
