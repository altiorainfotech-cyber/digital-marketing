/**
 * User Management API Routes - Individual User Operations
 * 
 * PATCH /api/users/[id] - Update user (Admin only)
 * 
 * Requirements: 1.1-1.5
 * 
 * Key Features:
 * - Admin-only access for user updates
 * - Role and company assignment validation
 * - Audit logging integration
 * - IP address and user agent extraction for audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { UserService } from '@/lib/services/UserService';
import { AuditService } from '@/lib/services/AuditService';
import { UserRole } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

const auditService = new AuditService(prisma as any);
const userService = new UserService(prisma as any, auditService);

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
 * PATCH /api/users/[id]
 * 
 * Update an existing user (Admin only)
 * 
 * Request Body (all fields optional):
 * {
 *   email?: string;
 *   name?: string;
 *   password?: string;
 *   role?: 'ADMIN' | 'CONTENT_CREATOR' | 'SEO_SPECIALIST';
 *   companyId?: string | null;
 * }
 * 
 * Response:
 * {
 *   id: string;
 *   email: string;
 *   name: string;
 *   role: string;
 *   companyId?: string;
 *   createdAt: string;
 *   updatedAt: string;
 * }
 * 
 * Errors:
 * - 400: Validation error (invalid role, missing company for non-Admin, etc.)
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: User not found
 * - 409: Conflict (email already exists)
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async (req, { user }) => {
    try {
      const { id: userId } = await params;
      const body = await request.json();
      const { email, name, password, role, companyId } = body;

      // Validate role if provided
      if (role !== undefined && !Object.values(UserRole).includes(role as UserRole)) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: {
              role: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`,
            },
          },
          { status: 400 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Update user using UserService
      const updatedUser = await userService.updateUser({
        userId,
        email,
        name,
        password,
        role: role as any,
        companyId,
        updatedBy: user.id,
        ipAddress,
        userAgent,
      });

      return NextResponse.json(updatedUser);
    } catch (error: any) {
      console.error('Error updating user:', error);

      // Handle specific error cases
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message === 'User with this email already exists') {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }

      if (
        error.message.includes('required') ||
        error.message.includes('Invalid') ||
        error.message.includes('Company not found') ||
        error.message.includes('Cannot remove company')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * DELETE /api/users/[id]
 * 
 * Delete a user (Admin only)
 * 
 * Response:
 * {
 *   success: true;
 *   message: string;
 * }
 * 
 * Errors:
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: User not found
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async (req, { user }) => {
    try {
      const { id: userId } = await params;

      // Prevent self-deletion
      if (userId === user.id) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        );
      }

      // Extract IP address and user agent for audit logging
      const ipAddress = getIpAddress(request);
      const userAgent = getUserAgent(request);

      // Delete user using UserService
      await userService.deleteUser(userId, user.id, ipAddress, userAgent);

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);

      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Handle related data error with proper status code
      if (error.message?.includes('Cannot delete user with related data')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict status for data integrity issues
        );
      }

      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  })(request);
}
