/**
 * UserService
 * 
 * Manages user creation, validation, role and company assignment, and credential generation.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * Key Features:
 * - Creates users with role assignment validation
 * - Requires company assignment for non-Admin users
 * - Generates and hashes authentication credentials
 * - Integrates with AuditService for logging
 */

import { PrismaClient, UserRole } from '@/app/generated/prisma';
import { AuditService } from './AuditService';
import bcrypt from 'bcryptjs';

export interface CreateUserParams {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  companyId?: string;
  createdBy: string; // ID of the admin creating the user
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateUserResult {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserParams {
  userId: string;
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  companyId?: string;
  updatedBy: string; // ID of the admin updating the user
  ipAddress?: string;
  userAgent?: string;
}

export class UserService {
  private prisma: PrismaClient;
  private auditService: AuditService;

  constructor(prisma: PrismaClient, auditService: AuditService) {
    this.prisma = prisma;
    this.auditService = auditService;
  }

  /**
   * Create a new user with validation
   * 
   * Validates:
   * - Role assignment is required (Requirement 1.1)
   * - Company assignment is required for non-Admin users (Requirement 1.2)
   * - Email uniqueness
   * 
   * Generates:
   * - Hashed password credentials (Requirement 1.3)
   * 
   * @param params - User creation parameters
   * @returns The created user (without password)
   * @throws Error if validation fails
   */
  async createUser(params: CreateUserParams): Promise<CreateUserResult> {
    const {
      email,
      name,
      password,
      role,
      companyId,
      createdBy,
      ipAddress,
      userAgent,
    } = params;

    // Requirement 1.1: Role assignment is required
    if (!role) {
      throw new Error('Role assignment is required');
    }

    // Validate role is a valid UserRole
    if (!Object.values(UserRole).includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${Object.values(UserRole).join(', ')}`);
    }

    // Requirement 1.2: Company assignment is required for non-Admin users
    if (role !== UserRole.ADMIN && !companyId) {
      throw new Error('Company assignment is required for non-Admin users');
    }

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // If companyId is provided, verify the company exists
    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error('Company not found');
      }
    }

    // Requirement 1.3: Generate authentication credentials (hash password)
    const hashedPassword = await this.hashPassword(password);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        companyId: companyId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user creation in audit log (Requirement 1.5)
    await this.auditService.logUserCreate(
      createdBy,
      user.id,
      {
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      ipAddress,
      userAgent
    );

    return {
      ...user,
      companyId: user.companyId || undefined,
      isActive: user.isActive,
    };
  }

  /**
   * Update an existing user
   * 
   * @param params - User update parameters
   * @returns The updated user (without password)
   * @throws Error if validation fails or user not found
   */
  async updateUser(params: UpdateUserParams): Promise<CreateUserResult> {
    const {
      userId,
      email,
      name,
      password,
      role,
      companyId,
      updatedBy,
      ipAddress,
      userAgent,
    } = params;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Track changes for audit log
    const changes: Record<string, any> = {};
    const previousValues: Record<string, any> = {};

    // Validate and prepare update data
    const updateData: any = {};

    if (email !== undefined && email !== existingUser.email) {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Check if new email already exists
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new Error('User with this email already exists');
      }

      updateData.email = email;
      previousValues.email = existingUser.email;
      changes.email = email;
    }

    if (name !== undefined && name !== existingUser.name) {
      updateData.name = name;
      previousValues.name = existingUser.name;
      changes.name = name;
    }

    if (password !== undefined) {
      updateData.password = await this.hashPassword(password);
      changes.password = 'updated';
    }

    if (role !== undefined && role !== existingUser.role) {
      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }

      // If changing to non-Admin role, ensure company is assigned
      if (role !== UserRole.ADMIN && !existingUser.companyId && companyId === undefined) {
        throw new Error('Company assignment is required for non-Admin users');
      }

      updateData.role = role;
      previousValues.role = existingUser.role;
      changes.role = role;
    }

    if (companyId !== undefined && companyId !== existingUser.companyId) {
      // If companyId is provided (not null), verify the company exists
      if (companyId) {
        const company = await this.prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company) {
          throw new Error('Company not found');
        }
      }

      // If removing company, ensure user is Admin
      if (companyId === null && existingUser.role !== UserRole.ADMIN) {
        throw new Error('Cannot remove company from non-Admin user');
      }

      updateData.companyId = companyId;
      previousValues.companyId = existingUser.companyId;
      changes.companyId = companyId;
    }

    // If no changes, return existing user
    if (Object.keys(updateData).length === 0) {
      return {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        companyId: existingUser.companyId || undefined,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
      };
    }

    // Update the user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user update in audit log (Requirement 1.5)
    await this.auditService.logUserUpdate(
      updatedBy,
      userId,
      {
        changes,
        previousValues,
      },
      ipAddress,
      userAgent
    );

    return {
      ...updatedUser,
      companyId: updatedUser.companyId || undefined,
      isActive: updatedUser.isActive,
    };
  }

  /**
   * Get user by ID
   * 
   * @param userId - ID of the user to retrieve
   * @returns The user (without password) or null if not found
   */
  async getUserById(userId: string): Promise<CreateUserResult | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      companyId: user.companyId || undefined,
      isActive: user.isActive,
    };
  }

  /**
   * Get user by email
   * 
   * @param email - Email of the user to retrieve
   * @returns The user (without password) or null if not found
   */
  async getUserByEmail(email: string): Promise<CreateUserResult | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      companyId: user.companyId || undefined,
      isActive: user.isActive,
    };
  }

  /**
   * List all users with optional filtering
   * 
   * @param filters - Optional filters (role, companyId)
   * @returns Array of users (without passwords)
   */
  async listUsers(filters?: {
    role?: UserRole;
    companyId?: string;
  }): Promise<CreateUserResult[]> {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => ({
      ...user,
      companyId: user.companyId || undefined,
      isActive: user.isActive,
    }));
  }

  /**
   * Deactivate a user account
   * 
   * @param userId - ID of the user to deactivate
   * @param deactivatedBy - ID of the admin deactivating the user
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @throws Error if user not found
   */
  async deactivateUser(
    userId: string,
    deactivatedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<CreateUserResult> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('User is already deactivated');
    }

    // Deactivate the user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user deactivation
    await this.auditService.logUserUpdate(
      deactivatedBy,
      userId,
      {
        changes: { isActive: false, deactivatedAt: new Date() },
        previousValues: { isActive: true },
      },
      ipAddress,
      userAgent
    );

    return {
      ...updatedUser,
      companyId: updatedUser.companyId || undefined,
    };
  }

  /**
   * Reactivate a user account
   * 
   * @param userId - ID of the user to reactivate
   * @param reactivatedBy - ID of the admin reactivating the user
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @throws Error if user not found
   */
  async reactivateUser(
    userId: string,
    reactivatedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<CreateUserResult> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isActive) {
      throw new Error('User is already active');
    }

    // Reactivate the user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        deactivatedAt: null,
        deactivatedBy: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user reactivation
    await this.auditService.logUserUpdate(
      reactivatedBy,
      userId,
      {
        changes: { isActive: true },
        previousValues: { isActive: false },
      },
      ipAddress,
      userAgent
    );

    return {
      ...updatedUser,
      companyId: updatedUser.companyId || undefined,
    };
  }

  /**
   * Delete a user
   * 
   * @param userId - ID of the user to delete
   * @param deletedBy - ID of the admin deleting the user
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @throws Error if user not found or has related data
   */
  async deleteUser(
    userId: string,
    deletedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check for related data that would prevent deletion
    const [
      uploadedAssetsCount,
      approvedAssetsCount,
      rejectedAssetsCount,
      auditLogsCount,
      downloadsCount,
      platformUsagesCount,
      sharedAssetsCount,
      receivedSharesCount,
      notificationsCount,
      approvalsCount,
    ] = await Promise.all([
      this.prisma.asset.count({ where: { uploaderId: userId } }),
      this.prisma.asset.count({ where: { approvedById: userId } }),
      this.prisma.asset.count({ where: { rejectedById: userId } }),
      this.prisma.auditLog.count({ where: { userId } }),
      this.prisma.assetDownload.count({ where: { downloadedById: userId } }),
      this.prisma.platformUsage.count({ where: { loggedById: userId } }),
      this.prisma.assetShare.count({ where: { sharedById: userId } }),
      this.prisma.assetShare.count({ where: { sharedWithId: userId } }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.approval.count({ where: { reviewerId: userId } }),
    ]);

    const totalRelatedRecords = 
      uploadedAssetsCount +
      approvedAssetsCount +
      rejectedAssetsCount +
      auditLogsCount +
      downloadsCount +
      platformUsagesCount +
      sharedAssetsCount +
      receivedSharesCount +
      notificationsCount +
      approvalsCount;

    if (totalRelatedRecords > 0) {
      const details = [];
      if (uploadedAssetsCount > 0) details.push(`${uploadedAssetsCount} uploaded assets`);
      if (approvedAssetsCount > 0) details.push(`${approvedAssetsCount} approved assets`);
      if (rejectedAssetsCount > 0) details.push(`${rejectedAssetsCount} rejected assets`);
      if (auditLogsCount > 0) details.push(`${auditLogsCount} audit logs`);
      if (downloadsCount > 0) details.push(`${downloadsCount} downloads`);
      if (platformUsagesCount > 0) details.push(`${platformUsagesCount} platform usages`);
      if (sharedAssetsCount > 0) details.push(`${sharedAssetsCount} shared assets`);
      if (receivedSharesCount > 0) details.push(`${receivedSharesCount} received shares`);
      if (notificationsCount > 0) details.push(`${notificationsCount} notifications`);
      if (approvalsCount > 0) details.push(`${approvalsCount} approvals`);

      throw new Error(
        `Cannot delete user with related data: ${details.join(', ')}. Please deactivate the user instead.`
      );
    }

    // Log user deletion before deleting (Requirement 1.5)
    await this.auditService.logUserDelete(
      deletedBy,
      userId,
      {
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      ipAddress,
      userAgent
    );

    // Delete the user (only if no related data)
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Verify user password
   * 
   * @param email - User email
   * @param password - Plain text password to verify
   * @returns User if password is correct, null otherwise
   */
  async verifyPassword(
    email: string,
    password: string
  ): Promise<CreateUserResult | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Check if user has a password set (for activation-based users)
    if (!user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Hash a password using bcrypt
   * 
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate email format
   * 
   * @param email - Email to validate
   * @returns True if valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
