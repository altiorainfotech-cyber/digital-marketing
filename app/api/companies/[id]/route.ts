/**
 * Company Management API Routes - Individual Company Operations
 * 
 * DELETE /api/companies/[id] - Delete company (Admin only)
 * 
 * Requirements: 2.1-2.5
 * 
 * Key Features:
 * - Admin-only access for company deletion
 * - Deletion protection (prevents deletion if users or assets are associated)
 * - Audit logging integration
 * - IP address and user agent extraction for audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { CompanyService } from '@/lib/services/CompanyService';
import { AuditService } from '@/lib/services/AuditService';
import prisma from '@/lib/prisma';

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
 * DELETE /api/companies/[id]
 * 
 * Delete a company (Admin only)
 * 
 * Deletion Protection (Requirement 2.4):
 * - Cannot delete if users are associated with the company
 * - Cannot delete if assets are associated with the company
 * 
 * Response:
 * {
 *   message: string;
 * }
 * 
 * Errors:
 * - 400: Validation error (company has associated users or assets)
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: Company not found
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async (req, { user }) => {
    try {
      const { id: companyId } = await params;

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Delete company using CompanyService
      // This will throw an error if users or assets are associated (Requirement 2.4)
      await companyService.deleteCompany(
        companyId,
        user.id,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        message: 'Company deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting company:', error);

      // Handle specific error cases
      if (error.message === 'Company not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Requirement 2.4: Deletion protection errors
      if (
        error.message.includes('Cannot delete company') ||
        error.message.includes('user(s) are associated') ||
        error.message.includes('asset(s) are associated')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to delete company' },
        { status: 500 }
      );
    }
  })(request);
}
