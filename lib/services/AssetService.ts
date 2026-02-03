/**
 * AssetService
 * 
 * Manages asset creation, validation, upload type branching, and default value setting.
 * 
 * Requirements: 3.1-3.12, 4.1-4.7, 17.1-17.6
 * 
 * Key Features:
 * - Creates assets with upload type branching (SEO vs Doc)
 * - Validates SEO uploads require company selection
 * - Sets default visibility based on upload type and user role
 * - For Content_Creator/SEO_Specialist SEO uploads: sets visibility = ADMIN_ONLY
 * - For Admin SEO uploads: allows Admin to choose visibility
 * - Handles "Save Draft" (status = DRAFT) vs "Submit for Review" (status = PENDING_REVIEW)
 * - Handles optional fields: description, tags, targetPlatforms, campaignName
 * - Integrates with AuditService for logging
 */

import { PrismaClient, AssetType, UploadType, AssetStatus, VisibilityLevel, UserRole } from '@/app/generated/prisma';
import { 
  User,
  Asset
} from '@/types';
import { AuditService } from './AuditService';
import { VisibilityChecker } from './VisibilityChecker';

export interface CreateAssetParams {
  title: string;
  description?: string;
  tags?: string[];
  assetType: AssetType;
  uploadType: UploadType;
  companyId?: string;
  uploaderId: string;
  storageUrl: string;
  fileSize?: number;
  mimeType?: string;
  targetPlatforms?: string[];
  campaignName?: string;
  submitForReview?: boolean;
  visibility?: VisibilityLevel; // Only used if uploader is Admin
  userRole: UserRole; // Role of the user creating the asset
  ipAddress?: string;
  userAgent?: string;
  url?: string; // For LINK type assets
}

export interface CreateAssetResult {
  id: string;
  title: string;
  description?: string;
  tags: string[];
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
  targetPlatforms: string[];
  campaignName?: string;
}

export interface UpdateAssetParams {
  assetId: string;
  title?: string;
  description?: string;
  tags?: string[];
  targetPlatforms?: string[];
  campaignName?: string;
  updatedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AssetService {
  private prisma: PrismaClient;
  private auditService: AuditService;
  private visibilityChecker: VisibilityChecker;

  constructor(
    prisma: PrismaClient, 
    auditService: AuditService,
    visibilityChecker: VisibilityChecker
  ) {
    this.prisma = prisma;
    this.auditService = auditService;
    this.visibilityChecker = visibilityChecker;
  }

  /**
   * Create a new asset with validation and upload type branching
   * 
   * Validates:
   * - SEO uploads require company selection (Requirement 3.1, 3.12)
   * - Asset type is required (Requirement 3.2)
   * - Title is required (Requirement 3.3)
   * - File or URL is required (Requirement 3.3)
   * - Description max 1000 characters (Requirement 17.1)
   * - Tags max 20 tags (Requirement 17.2)
   * 
   * Sets defaults:
   * - For SEO uploads by Content_Creator/SEO_Specialist: visibility = ADMIN_ONLY (Requirement 3.5)
   * - For SEO uploads by Admin: visibility = Admin's choice or ADMIN_ONLY (Requirement 3.6)
   * - For Doc uploads: visibility = UPLOADER_ONLY (Requirement 4.3)
   * - For "Save Draft": status = DRAFT (Requirement 3.7)
   * - For "Submit for Review": status = PENDING_REVIEW (Requirement 3.8)
   * 
   * @param params - Asset creation parameters
   * @returns The created asset
   * @throws Error if validation fails
   */
  async createAsset(params: CreateAssetParams): Promise<CreateAssetResult> {
    const {
      title,
      description,
      tags,
      assetType,
      uploadType,
      companyId,
      uploaderId,
      storageUrl,
      fileSize,
      mimeType,
      targetPlatforms,
      campaignName,
      submitForReview,
      visibility,
      userRole,
      ipAddress,
      userAgent,
      url,
    } = params;

    // Requirement 3.3: Title is required
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }

    // Requirement 3.2: Asset type is required
    if (!assetType) {
      throw new Error('Asset type is required');
    }

    // Validate asset type
    if (!Object.values(AssetType).includes(assetType)) {
      throw new Error(`Invalid asset type: ${assetType}`);
    }

    // Requirement 17.1: Description max 1000 characters
    if (description && description.length > 1000) {
      throw new Error('Description cannot exceed 1000 characters');
    }

    // Requirement 17.2: Tags max 20 tags
    if (tags && tags.length > 20) {
      throw new Error('Cannot have more than 20 tags');
    }

    // Requirement 3.12: SEO uploads require company selection
    if (uploadType === UploadType.SEO && !companyId) {
      throw new Error('Company required for SEO/Digital marketing uploads');
    }

    // Requirement 4.1: Doc uploads should not require company
    if (uploadType === UploadType.DOC && companyId) {
      throw new Error('Doc uploads should not have a company assigned');
    }

    // Requirement 3.3: Validate based on asset type
    // For LINK type, URL is required
    if (assetType === AssetType.LINK && !url) {
      throw new Error('URL is required for link assets');
    }

    // For LINK type, use URL as storageUrl
    // For other types, use provided storageUrl or generate temporary one
    const finalStorageUrl = assetType === AssetType.LINK 
      ? (url || storageUrl) 
      : (storageUrl || `r2://pending/${Date.now()}`);

    // If companyId is provided, verify the company exists
    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error('Company not found');
      }
    }

    // Verify uploader exists
    const uploader = await this.prisma.user.findUnique({
      where: { id: uploaderId },
    });

    if (!uploader) {
      throw new Error('Uploader not found');
    }

    // Determine visibility based on upload type and user role
    let finalVisibility: VisibilityLevel;

    if (uploadType === UploadType.SEO) {
      // Requirement 3.6: Admin can choose visibility for SEO uploads
      if (userRole === UserRole.ADMIN && visibility) {
        // Validate visibility level
        if (!Object.values(VisibilityLevel).includes(visibility)) {
          throw new Error(`Invalid visibility level: ${visibility}`);
        }
        finalVisibility = visibility;
      } else {
        // Requirement 3.5: Content_Creator/SEO_Specialist SEO uploads default to ADMIN_ONLY
        finalVisibility = VisibilityLevel.ADMIN_ONLY;
      }
    } else {
      // Requirement 4.3: Doc uploads are always UPLOADER_ONLY
      finalVisibility = VisibilityLevel.UPLOADER_ONLY;
    }

    // Determine status based on submitForReview flag
    let finalStatus: AssetStatus;

    if (uploadType === UploadType.SEO) {
      if (submitForReview) {
        // Requirement 3.8: "Submit for Review" sets status to PENDING_REVIEW
        finalStatus = AssetStatus.PENDING_REVIEW;
      } else {
        // Requirement 3.7: "Save Draft" sets status to DRAFT
        finalStatus = AssetStatus.DRAFT;
      }
    } else {
      // Requirement 4.4: Doc uploads are always DRAFT
      finalStatus = AssetStatus.DRAFT;
    }

    // Create the asset
    const asset = await this.prisma.asset.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        tags: tags || [],
        assetType,
        uploadType,
        status: finalStatus,
        visibility: finalVisibility,
        companyId: companyId || null,
        uploaderId,
        storageUrl: finalStorageUrl,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        targetPlatforms: targetPlatforms || [],
        campaignName: campaignName?.trim() || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        assetType: true,
        uploadType: true,
        status: true,
        visibility: true,
        companyId: true,
        uploaderId: true,
        storageUrl: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        targetPlatforms: true,
        campaignName: true,
      },
    });

    // Log asset creation in audit log (Requirement 3.11)
    await this.auditService.logAssetCreate(
      uploaderId,
      asset.id,
      {
        title: asset.title,
        assetType: asset.assetType,
        uploadType: asset.uploadType,
        status: asset.status,
        visibility: asset.visibility,
        companyId: asset.companyId,
        submitForReview: submitForReview || false,
      },
      ipAddress,
      userAgent
    );

    return {
      id: asset.id,
      title: asset.title,
      description: asset.description || undefined,
      tags: asset.tags || [],
      assetType: asset.assetType,
      uploadType: asset.uploadType,
      status: asset.status,
      visibility: asset.visibility,
      companyId: asset.companyId || undefined,
      uploaderId: asset.uploaderId,
      storageUrl: asset.storageUrl,
      fileSize: asset.fileSize || undefined,
      mimeType: asset.mimeType || undefined,
      uploadedAt: asset.uploadedAt,
      targetPlatforms: asset.targetPlatforms || [],
      campaignName: asset.campaignName || undefined,
    };
  }

  /**
   * Update an existing asset's metadata with permission check
   * 
   * Requirements: 7.5 - Prevent asset access if user lacks permission
   * Requirement 17.5: Log metadata changes in audit log
   * 
   * @param params - Asset update parameters
   * @param user - User attempting to update the asset
   * @returns The updated asset
   * @throws Error if validation fails, asset not found, or no permission
   */
  async updateAssetWithPermission(params: UpdateAssetParams, user: User): Promise<CreateAssetResult> {
    const { assetId } = params;

    // Check if asset exists
    const existingAsset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!existingAsset) {
      throw new Error('Asset not found');
    }

    // Check if user has permission to edit the asset
    const canEdit = this.visibilityChecker.canEdit(user, existingAsset as Asset);

    if (!canEdit) {
      throw new Error('Insufficient permissions to edit this asset');
    }

    // Proceed with update
    return await this.updateAsset(params);
  }

  /**
   * Update an existing asset's metadata
   * 
   * Requirement 17.5: Log metadata changes in audit log
   * 
   * @param params - Asset update parameters
   * @returns The updated asset
   * @throws Error if validation fails or asset not found
   */
  async updateAsset(params: UpdateAssetParams): Promise<CreateAssetResult> {
    const {
      assetId,
      title,
      description,
      tags,
      targetPlatforms,
      campaignName,
      updatedBy,
      ipAddress,
      userAgent,
    } = params;

    // Check if asset exists
    const existingAsset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!existingAsset) {
      throw new Error('Asset not found');
    }

    // Track changes for audit log
    const changes: Record<string, any> = {};
    const previousValues: Record<string, any> = {};

    // Validate and prepare update data
    const updateData: any = {};

    if (title !== undefined && title.trim() !== existingAsset.title) {
      if (!title || title.trim().length === 0) {
        throw new Error('Title cannot be empty');
      }

      updateData.title = title.trim();
      previousValues.title = existingAsset.title;
      changes.title = title.trim();
    }

    if (description !== undefined && description !== existingAsset.description) {
      // Requirement 17.1: Description max 1000 characters
      if (description && description.length > 1000) {
        throw new Error('Description cannot exceed 1000 characters');
      }

      updateData.description = description?.trim() || null;
      previousValues.description = existingAsset.description;
      changes.description = description?.trim() || null;
    }

    if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(existingAsset.tags)) {
      // Requirement 17.2: Tags max 20 tags
      if (tags.length > 20) {
        throw new Error('Cannot have more than 20 tags');
      }

      updateData.tags = tags;
      previousValues.tags = existingAsset.tags;
      changes.tags = tags;
    }

    if (targetPlatforms !== undefined && JSON.stringify(targetPlatforms) !== JSON.stringify(existingAsset.targetPlatforms)) {
      updateData.targetPlatforms = targetPlatforms;
      previousValues.targetPlatforms = existingAsset.targetPlatforms;
      changes.targetPlatforms = targetPlatforms;
    }

    if (campaignName !== undefined && campaignName !== existingAsset.campaignName) {
      updateData.campaignName = campaignName?.trim() || null;
      previousValues.campaignName = existingAsset.campaignName;
      changes.campaignName = campaignName?.trim() || null;
    }

    // If no changes, return existing asset
    if (Object.keys(updateData).length === 0) {
      return {
        id: existingAsset.id,
        title: existingAsset.title,
        description: existingAsset.description || undefined,
        tags: existingAsset.tags,
        assetType: existingAsset.assetType,
        uploadType: existingAsset.uploadType,
        status: existingAsset.status,
        visibility: existingAsset.visibility,
        companyId: existingAsset.companyId || undefined,
        uploaderId: existingAsset.uploaderId,
        storageUrl: existingAsset.storageUrl,
        fileSize: existingAsset.fileSize || undefined,
        mimeType: existingAsset.mimeType || undefined,
        uploadedAt: existingAsset.uploadedAt,
        targetPlatforms: existingAsset.targetPlatforms,
        campaignName: existingAsset.campaignName || undefined,
      };
    }

    // Update the asset
    const updatedAsset = await this.prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        assetType: true,
        uploadType: true,
        status: true,
        visibility: true,
        companyId: true,
        uploaderId: true,
        storageUrl: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        targetPlatforms: true,
        campaignName: true,
      },
    });

    // Log asset update in audit log (Requirement 17.5)
    await this.auditService.logAssetUpdate(
      updatedBy,
      assetId,
      {
        changes,
        previousValues,
      },
      ipAddress,
      userAgent
    );

    return {
      id: updatedAsset.id,
      title: updatedAsset.title,
      description: updatedAsset.description || undefined,
      tags: updatedAsset.tags,
      assetType: updatedAsset.assetType,
      uploadType: updatedAsset.uploadType,
      status: updatedAsset.status,
      visibility: updatedAsset.visibility,
      companyId: updatedAsset.companyId || undefined,
      uploaderId: updatedAsset.uploaderId,
      storageUrl: updatedAsset.storageUrl,
      fileSize: updatedAsset.fileSize || undefined,
      mimeType: updatedAsset.mimeType || undefined,
      uploadedAt: updatedAsset.uploadedAt,
      targetPlatforms: updatedAsset.targetPlatforms,
      campaignName: updatedAsset.campaignName || undefined,
    };
  }

  /**
   * Get asset by ID with permission check
   * 
   * Requirements: 7.5 - Prevent asset access if user lacks permission
   * 
   * @param assetId - ID of the asset to retrieve
   * @param user - User requesting the asset
   * @returns The asset or null if not found or no permission
   */
  async getAssetByIdWithPermission(assetId: string, user: User): Promise<CreateAssetResult | null> {
    const asset = await this.getAssetById(assetId);

    if (!asset) {
      return null;
    }

    // Check if user has permission to view the asset
    const canView = await this.visibilityChecker.canView(user, asset as Asset);

    if (!canView) {
      throw new Error('Insufficient permissions to access this asset');
    }

    return asset;
  }

  /**
   * Get asset by ID
   * 
   * @param assetId - ID of the asset to retrieve
   * @returns The asset or null if not found
   */
  async getAssetById(assetId: string): Promise<CreateAssetResult | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        assetType: true,
        uploadType: true,
        status: true,
        visibility: true,
        companyId: true,
        uploaderId: true,
        storageUrl: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        targetPlatforms: true,
        campaignName: true,
      },
    });

    if (!asset) {
      return null;
    }

    return {
      id: asset.id,
      title: asset.title,
      description: asset.description || undefined,
      tags: asset.tags || [],
      assetType: asset.assetType,
      uploadType: asset.uploadType,
      status: asset.status,
      visibility: asset.visibility,
      companyId: asset.companyId || undefined,
      uploaderId: asset.uploaderId,
      storageUrl: asset.storageUrl,
      fileSize: asset.fileSize || undefined,
      mimeType: asset.mimeType || undefined,
      uploadedAt: asset.uploadedAt,
      targetPlatforms: asset.targetPlatforms || [],
      campaignName: asset.campaignName || undefined,
    };
  }

  /**
   * List assets with permission filtering
   * 
   * Requirements: 7.1-7.3 - Filter assets based on user role and permissions
   * 
   * @param user - User requesting assets
   * @param filters - Optional filters (uploadType, status, uploaderId, companyId)
   * @returns Array of assets visible to the user
   */
  async listAssetsWithPermission(
    user: User,
    filters?: {
      uploadType?: UploadType;
      status?: AssetStatus;
      uploaderId?: string;
      companyId?: string;
    }
  ): Promise<CreateAssetResult[]> {
    // Get all assets matching the filters
    const assets = await this.listAssets(filters);

    // Filter by role-specific rules
    const filteredAssets = await this.visibilityChecker.filterAssetsByRole(
      user,
      assets as Asset[]
    );

    return filteredAssets as CreateAssetResult[];
  }

  /**
   * List assets with optional filtering
   * 
   * @param filters - Optional filters (uploadType, status, uploaderId, companyId)
   * @returns Array of assets
   */
  async listAssets(filters?: {
    uploadType?: UploadType;
    status?: AssetStatus;
    uploaderId?: string;
    companyId?: string;
  }): Promise<CreateAssetResult[]> {
    const where: any = {};

    if (filters?.uploadType) {
      where.uploadType = filters.uploadType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.uploaderId) {
      where.uploaderId = filters.uploaderId;
    }

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    const assets = await this.prisma.asset.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        assetType: true,
        uploadType: true,
        status: true,
        visibility: true,
        companyId: true,
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
        uploaderId: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        storageUrl: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        targetPlatforms: true,
        campaignName: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      description: asset.description || undefined,
      tags: asset.tags || [],
      assetType: asset.assetType,
      uploadType: asset.uploadType,
      status: asset.status,
      visibility: asset.visibility,
      companyId: asset.companyId || undefined,
      Company: asset.Company || undefined,
      uploaderId: asset.uploaderId,
      uploader: asset.uploader,
      storageUrl: asset.storageUrl,
      thumbnailUrl: this.getThumbnailUrl(asset.storageUrl, asset.assetType),
      fileSize: asset.fileSize || undefined,
      mimeType: asset.mimeType || undefined,
      uploadedAt: asset.uploadedAt,
      targetPlatforms: asset.targetPlatforms || [],
      campaignName: asset.campaignName || undefined,
    })) as any;
  }

  /**
   * Get thumbnail URL for an asset
   * For images, returns the public URL
   */
  private getThumbnailUrl(storageUrl: string, assetType: string): string | undefined {
    if (assetType === 'IMAGE' && storageUrl.startsWith('r2://')) {
      const r2PublicUrl = process.env.R2_PUBLIC_URL;
      if (!r2PublicUrl) return undefined;
      
      const match = storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
      if (match) {
        const key = match[1];
        return `${r2PublicUrl}/${key}`;
      }
    }
    return undefined;
  }

  /**
   * Delete an asset with permission check
   * 
   * Requirements: 7.5 - Prevent asset access if user lacks permission
   * 
   * @param assetId - ID of the asset to delete
   * @param user - User attempting to delete the asset
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @throws Error if asset not found or no permission
   */
  async deleteAssetWithPermission(
    assetId: string,
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        assetType: true,
        uploadType: true,
        status: true,
        visibility: true,
        companyId: true,
        uploaderId: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Check if user has permission to delete the asset
    const canDelete = this.visibilityChecker.canDelete(user, asset as Asset);

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete this asset');
    }

    // Proceed with deletion
    await this.deleteAsset(assetId, user.id, ipAddress, userAgent);
  }

  /**
   * Delete an asset
   * 
   * @param assetId - ID of the asset to delete
   * @param deletedBy - ID of the user deleting the asset
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @throws Error if asset not found
   */
  async deleteAsset(
    assetId: string,
    deletedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        assetType: true,
        uploadType: true,
        status: true,
        visibility: true,
        companyId: true,
        uploaderId: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Log asset deletion before deleting
    await this.auditService.logAssetDelete(
      deletedBy,
      assetId,
      {
        title: asset.title,
        assetType: asset.assetType,
        uploadType: asset.uploadType,
        status: asset.status,
        visibility: asset.visibility,
        companyId: asset.companyId,
        uploaderId: asset.uploaderId,
      },
      ipAddress,
      userAgent
    );

    // Delete the asset
    await this.prisma.asset.delete({
      where: { id: assetId },
    });
  }

  /**
   * List approved SEO assets for SEO Specialists
   * 
   * Requirements: 7.2, 7.6 - SEO Specialists can only see APPROVED assets they have permission to view
   * 
   * @param user - User requesting assets (typically SEO_Specialist)
   * @param filters - Optional filters (companyId, platform)
   * @returns Array of approved assets visible to the user
   */
  async listApprovedSEOAssets(
    user: User,
    filters?: {
      companyId?: string;
      platform?: string;
    }
  ): Promise<CreateAssetResult[]> {
    // Build query filters
    const where: any = {
      uploadType: UploadType.SEO,
      status: AssetStatus.APPROVED,
    };

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.platform) {
      where.targetPlatforms = {
        has: filters.platform,
      };
    }

    // Get all approved SEO assets
    const assets = await this.prisma.asset.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        assetType: true,
        uploadType: true,
        status: true,
        visibility: true,
        companyId: true,
        uploaderId: true,
        storageUrl: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        targetPlatforms: true,
        campaignName: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    // Filter by visibility rules
    const visibleAssets = await this.visibilityChecker.filterVisibleAssets(
      user,
      assets as Asset[]
    );

    return visibleAssets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      description: asset.description || undefined,
      tags: asset.tags || [],
      assetType: asset.assetType,
      uploadType: asset.uploadType,
      status: asset.status,
      visibility: asset.visibility,
      companyId: asset.companyId || undefined,
      uploaderId: asset.uploaderId,
      storageUrl: asset.storageUrl,
      fileSize: asset.fileSize || undefined,
      mimeType: asset.mimeType || undefined,
      uploadedAt: asset.uploadedAt,
      targetPlatforms: asset.targetPlatforms || [],
      campaignName: asset.campaignName || undefined,
    }));
  }

  /**
   * Upload a new version of an existing asset
   * 
   * Requirements: 14.1, 14.2 - Create AssetVersion records and preserve previous versions
   * 
   * @param assetId - ID of the asset to version
   * @param storageUrl - Storage URL of the new version
   * @param fileSize - File size of the new version
   * @param createdById - ID of the user creating the version
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @returns The created asset version
   * @throws Error if asset not found
   */
  async uploadNewVersion(
    assetId: string,
    storageUrl: string,
    fileSize: number | undefined,
    createdById: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AssetVersionResult> {
    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        storageUrl: true,
        fileSize: true,
        uploaderId: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Get the current highest version number
    const latestVersion = await this.prisma.assetVersion.findFirst({
      where: { assetId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create the new version record
    const version = await this.prisma.assetVersion.create({
      data: {
        assetId,
        versionNumber: nextVersionNumber,
        storageUrl,
        fileSize: fileSize || null,
        createdById,
      },
      select: {
        id: true,
        assetId: true,
        versionNumber: true,
        storageUrl: true,
        fileSize: true,
        createdAt: true,
        createdById: true,
      },
    });

    // Update the asset's current storageUrl and fileSize
    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        storageUrl,
        fileSize: fileSize || null,
      },
    });

    // Log version creation in audit log (Requirement 14.5)
    await this.auditService.logAssetUpdate(
      createdById,
      assetId,
      {
        action: 'version_created',
        versionNumber: nextVersionNumber,
        storageUrl,
        fileSize,
      },
      ipAddress,
      userAgent
    );

    return {
      id: version.id,
      assetId: version.assetId,
      versionNumber: version.versionNumber,
      storageUrl: version.storageUrl,
      fileSize: version.fileSize || undefined,
      createdAt: version.createdAt,
      createdById: version.createdById,
    };
  }

  /**
   * Get the current version of an asset
   * 
   * Requirements: 14.3 - Display current version by default
   * 
   * @param assetId - ID of the asset
   * @returns The current version (latest) or null if no versions exist
   */
  async getCurrentVersion(assetId: string): Promise<AssetVersionResult | null> {
    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        storageUrl: true,
        fileSize: true,
        uploadedAt: true,
        uploaderId: true,
      },
    });

    if (!asset) {
      return null;
    }

    // Get the latest version
    const latestVersion = await this.prisma.assetVersion.findFirst({
      where: { assetId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        assetId: true,
        versionNumber: true,
        storageUrl: true,
        fileSize: true,
        createdAt: true,
        createdById: true,
      },
    });

    // If no versions exist, return the original asset as version 0
    if (!latestVersion) {
      return {
        id: asset.id,
        assetId: asset.id,
        versionNumber: 0,
        storageUrl: asset.storageUrl,
        fileSize: asset.fileSize || undefined,
        createdAt: asset.uploadedAt,
        createdById: asset.uploaderId,
      };
    }

    return {
      id: latestVersion.id,
      assetId: latestVersion.assetId,
      versionNumber: latestVersion.versionNumber,
      storageUrl: latestVersion.storageUrl,
      fileSize: latestVersion.fileSize || undefined,
      createdAt: latestVersion.createdAt,
      createdById: latestVersion.createdById,
    };
  }

  /**
   * Get version history for an asset
   * 
   * Requirements: 14.4 - Display all versions with timestamps
   * 
   * @param assetId - ID of the asset
   * @returns Array of all versions, ordered by version number descending
   */
  async getVersionHistory(assetId: string): Promise<AssetVersionResult[]> {
    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        storageUrl: true,
        fileSize: true,
        uploadedAt: true,
        uploaderId: true,
      },
    });

    if (!asset) {
      return [];
    }

    // Get all versions
    const versions = await this.prisma.assetVersion.findMany({
      where: { assetId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        assetId: true,
        versionNumber: true,
        storageUrl: true,
        fileSize: true,
        createdAt: true,
        createdById: true,
      },
    });

    // Include the original asset as version 0 if versions exist
    const allVersions: AssetVersionResult[] = versions.map((v) => ({
      id: v.id,
      assetId: v.assetId,
      versionNumber: v.versionNumber,
      storageUrl: v.storageUrl,
      fileSize: v.fileSize || undefined,
      createdAt: v.createdAt,
      createdById: v.createdById,
    }));

    // Add original asset as version 0 at the end
    allVersions.push({
      id: asset.id,
      assetId: asset.id,
      versionNumber: 0,
      storageUrl: asset.storageUrl,
      fileSize: asset.fileSize || undefined,
      createdAt: asset.uploadedAt,
      createdById: asset.uploaderId,
    });

    return allVersions;
  }
}

export interface AssetVersionResult {
  id: string;
  assetId: string;
  versionNumber: number;
  storageUrl: string;
  fileSize?: number;
  createdAt: Date;
  createdById: string;
}
