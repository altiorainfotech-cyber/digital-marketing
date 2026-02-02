/**
 * Company Management API Routes
 * 
 * POST /api/companies - Create company (Admin only)
 * GET /api/companies - List companies (Admin only)
 * 
 * Requirements: 2.1-2.5
 * 
 * Key Features:
 * - Admin-only access for company management
 * - Unique name validation
 * - User count display
 * - Audit logging integration
 * - IP address and user agent extraction for audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { CompanyService } from '@/lib/services/CompanyService';
import { AuditService } from '@/lib/services/AuditService';
import prisma from '@/lib/prisma';
import { parseAndValidateBody, createCompanySchema } from '@/lib/validation';
import { handleApiError, parseServiceError } from '@/lib/errors/api-handler';

const auditService = new AuditService(prisma as any);
const companyService = new CompanyService(prisma as any, auditService);

/**
 * Extract IP address from request
 */
function getIpAddress(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * POST /api/companies
 * 
 * Create a new company (Admin only)
 * 
 * Request Body:
 * {
 *   name: string; // Required, must be unique
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   name: string;
 *   createdAt: string;
 *   updatedAt: string;
 * }
 * 
 * Errors:
 * - 400: Validation error (missing name, empty name)
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 409: Conflict (company name already exists)
 * - 500: Internal server error
 */
export const POST = withAdmin(async (request, { user }) => {
  try {
    // Validate request body using Zod schema
    const validatedData = await parseAndValidateBody(request, createCompanySchema);

    // Extract IP address and user agent for audit logging
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Create company using CompanyService
    const newCompany = await companyService.createCompany({
      ...validatedData,
      createdBy: user.id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return handleApiError(parseServiceError(error), {
      userId: user.id,
      action: 'CREATE_COMPANY',
      resourceType: 'COMPANY',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });
  }
});

/**
 * GET /api/companies
 * 
 * List all companies with user counts (Admin only)
 * 
 * Response:
 * {
 *   companies: Array<{
 *     id: string;
 *     name: string;
 *     userCount: number;
 *     createdAt: string;
 *     updatedAt: string;
 *   }>;
 *   total: number;
 * }
 * 
 * Errors:
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 500: Internal server error
 */
export const GET = withAdmin(async (request, { user }) => {
  try {
    // List companies with user counts using CompanyService
    // Requirement 2.3: Display all companies with user counts
    const companies = await companyService.listCompanies();

    return NextResponse.json({
      companies,
      total: companies.length,
    });
  } catch (error: any) {
    console.error('Error listing companies:', error);
    return handleApiError(parseServiceError(error), {
      userId: user.id,
      action: 'LIST_COMPANIES',
      resourceType: 'COMPANY',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });
  }
});
