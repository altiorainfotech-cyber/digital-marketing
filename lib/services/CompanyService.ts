/**
 * CompanyService
 * 
 * Manages company creation, validation, user assignment, and deletion protection.
 * 
 * Requirements: 2.1, 2.2, 2.4
 * 
 * Key Features:
 * - Creates companies with unique name validation
 * - Allows user assignment to companies
 * - Implements deletion protection when users or assets are associated
 * - Integrates with AuditService for logging
 */

import { PrismaClient } from '@/app/generated/prisma';
import { AuditService } from './AuditService';

export interface CreateCompanyParams {
  name: string;
  createdBy: string; // ID of the admin creating the company
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateCompanyResult {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCompanyParams {
  companyId: string;
  name?: string;
  updatedBy: string; // ID of the admin updating the company
  ipAddress?: string;
  userAgent?: string;
}

export interface AssignUsersParams {
  companyId: string;
  userIds: string[];
  assignedBy: string; // ID of the admin assigning users
  ipAddress?: string;
  userAgent?: string;
}

export interface CompanyWithUserCount extends CreateCompanyResult {
  userCount: number;
}

export class CompanyService {
  private prisma: PrismaClient;
  private auditService: AuditService;

  constructor(prisma: PrismaClient, auditService: AuditService) {
    this.prisma = prisma;
    this.auditService = auditService;
  }

  /**
   * Create a new company with uniqueness validation
   * 
   * Validates:
   * - Company name is required and unique (Requirement 2.1)
   * 
   * @param params - Company creation parameters
   * @returns The created company
   * @throws Error if validation fails
   */
  async createCompany(params: CreateCompanyParams): Promise<CreateCompanyResult> {
    const { name, createdBy, ipAddress, userAgent } = params;

    // Requirement 2.1: Company name is required
    if (!name || name.trim().length === 0) {
      throw new Error('Company name is required');
    }

    // Requirement 2.1: Company name must be unique
    const existingCompany = await this.prisma.company.findUnique({
      where: { name: name.trim() },
    });

    if (existingCompany) {
      throw new Error('Company with this name already exists');
    }

    // Create the company
    const company = await this.prisma.company.create({
      data: {
        name: name.trim(),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log company creation in audit log (Requirement 2.5)
    await this.auditService.logCompanyCreate(
      createdBy,
      company.id,
      {
        name: company.name,
      },
      ipAddress,
      userAgent
    );

    return company;
  }

  /**
   * Update an existing company
   * 
   * @param params - Company update parameters
   * @returns The updated company
   * @throws Error if validation fails or company not found
   */
  async updateCompany(params: UpdateCompanyParams): Promise<CreateCompanyResult> {
    const { companyId, name, updatedBy, ipAddress, userAgent } = params;

    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      throw new Error('Company not found');
    }

    // Track changes for audit log
    const changes: Record<string, any> = {};
    const previousValues: Record<string, any> = {};

    // Validate and prepare update data
    const updateData: any = {};

    if (name !== undefined && name.trim() !== existingCompany.name) {
      if (!name || name.trim().length === 0) {
        throw new Error('Company name cannot be empty');
      }

      // Check if new name already exists
      const nameExists = await this.prisma.company.findUnique({
        where: { name: name.trim() },
      });

      if (nameExists) {
        throw new Error('Company with this name already exists');
      }

      updateData.name = name.trim();
      previousValues.name = existingCompany.name;
      changes.name = name.trim();
    }

    // If no changes, return existing company
    if (Object.keys(updateData).length === 0) {
      return {
        id: existingCompany.id,
        name: existingCompany.name,
        createdAt: existingCompany.createdAt,
        updatedAt: existingCompany.updatedAt,
      };
    }

    // Update the company
    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log company update in audit log (Requirement 2.5)
    await this.auditService.logCompanyUpdate(
      updatedBy,
      companyId,
      {
        changes,
        previousValues,
      },
      ipAddress,
      userAgent
    );

    return updatedCompany;
  }

  /**
   * Assign users to a company
   * 
   * Requirement 2.2: Allow assignment of users to a company
   * 
   * @param params - User assignment parameters
   * @returns Array of updated user IDs
   * @throws Error if company not found or users not found
   */
  async assignUsers(params: AssignUsersParams): Promise<string[]> {
    const { companyId, userIds, assignedBy, ipAddress, userAgent } = params;

    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Validate all users exist
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    });

    if (users.length !== userIds.length) {
      throw new Error('One or more users not found');
    }

    // Update users to assign them to the company
    await this.prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        companyId,
      },
    });

    // Log user assignment in audit log (Requirement 2.5)
    await this.auditService.logCompanyUpdate(
      assignedBy,
      companyId,
      {
        operation: 'assign_users',
        userIds,
        userCount: userIds.length,
      },
      ipAddress,
      userAgent
    );

    return userIds;
  }

  /**
   * Delete a company with protection logic
   * 
   * Requirement 2.4: Prevent deletion if assets or users are associated
   * 
   * @param companyId - ID of the company to delete
   * @param deletedBy - ID of the admin deleting the company
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @throws Error if company not found or has associated users/assets
   */
  async deleteCompany(
    companyId: string,
    deletedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        User: true,
        Asset: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Requirement 2.4: Prevent deletion if users are associated
    if (company.User.length > 0) {
      throw new Error(
        `Cannot delete company: ${company.User.length} user(s) are associated with this company`
      );
    }

    // Requirement 2.4: Prevent deletion if assets are associated
    if (company.Asset.length > 0) {
      throw new Error(
        `Cannot delete company: ${company.Asset.length} asset(s) are associated with this company`
      );
    }

    // Log company deletion before deleting (Requirement 2.5)
    await this.auditService.logCompanyDelete(
      deletedBy,
      companyId,
      {
        name: company.name,
      },
      ipAddress,
      userAgent
    );

    // Delete the company
    await this.prisma.company.delete({
      where: { id: companyId },
    });
  }

  /**
   * Get company by ID
   * 
   * @param companyId - ID of the company to retrieve
   * @returns The company or null if not found
   */
  async getCompanyById(companyId: string): Promise<CreateCompanyResult | null> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return company;
  }

  /**
   * Get company by name
   * 
   * @param name - Name of the company to retrieve
   * @returns The company or null if not found
   */
  async getCompanyByName(name: string): Promise<CreateCompanyResult | null> {
    const company = await this.prisma.company.findUnique({
      where: { name: name.trim() },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return company;
  }

  /**
   * List all companies with user counts
   * 
   * Requirement 2.3: Display all companies with user counts
   * 
   * @returns Array of companies with user counts
   */
  async listCompanies(): Promise<CompanyWithUserCount[]> {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            User: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      userCount: company._count.User,
    }));
  }

  /**
   * Get users assigned to a company
   * 
   * @param companyId - ID of the company
   * @returns Array of user IDs assigned to the company
   */
  async getCompanyUsers(companyId: string): Promise<string[]> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        User: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    return company.User.map((user) => user.id);
  }

  /**
   * Check if a company can be deleted
   * 
   * @param companyId - ID of the company to check
   * @returns Object with canDelete flag and reason if not deletable
   */
  async canDeleteCompany(companyId: string): Promise<{
    canDelete: boolean;
    reason?: string;
    userCount?: number;
    assetCount?: number;
  }> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            User: true,
            Asset: true,
          },
        },
      },
    });

    if (!company) {
      return {
        canDelete: false,
        reason: 'Company not found',
      };
    }

    const userCount = company._count.User;
    const assetCount = company._count.Asset;

    if (userCount > 0 || assetCount > 0) {
      const reasons = [];
      if (userCount > 0) {
        reasons.push(`${userCount} user(s)`);
      }
      if (assetCount > 0) {
        reasons.push(`${assetCount} asset(s)`);
      }

      return {
        canDelete: false,
        reason: `Cannot delete company: ${reasons.join(' and ')} are associated with this company`,
        userCount,
        assetCount,
      };
    }

    return {
      canDelete: true,
      userCount: 0,
      assetCount: 0,
    };
  }
}
