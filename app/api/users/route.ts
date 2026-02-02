/**
 * User Management API Routes
 * 
 * POST /api/users - Create user (Admin only)
 * GET /api/users - List users (Admin only)
 * 
 * Requirements: 1.1-1.5
 * 
 * Key Features:
 * - Admin-only access for user management
 * - Role and company assignment validation
 * - Credential generation
 * - Audit logging integration
 * - IP address and user agent extraction for audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { UserService } from '@/lib/services/UserService';
import { AuditService } from '@/lib/services/AuditService';
import { UserRole } from '@/types';
import prisma from '@/lib/prisma';
import { parseAndValidateBody, parseAndValidateQuery, createUserSchema, listUsersSchema } from '@/lib/validation';
import { handleApiError, parseServiceError } from '@/lib/errors/api-handler';

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
 * POST /api/users
 * 
 * Create a new user (Admin only)
 * 
 * Request Body:
 * {
 *   email: string;
 *   name: string;
 *   password: string;
 *   role: 'ADMIN' | 'CONTENT_CREATOR' | 'SEO_SPECIALIST';
 *   companyId?: string; // Required for non-Admin users
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
 * - 400: Validation error (missing fields, invalid role, etc.)
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 409: Conflict (email already exists)
 * - 500: Internal server error
 */
export const POST = withAdmin(async (request, { user }) => {
  try {
    // Validate request body using Zod schema
    const validatedData = await parseAndValidateBody(request, createUserSchema);

    // Extract IP address and user agent for audit logging
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Create user using UserService
    const newUser = await userService.createUser({
      ...validatedData,
      role: validatedData.role as any,
      createdBy: user.id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return handleApiError(parseServiceError(error), {
      userId: user.id,
      action: 'CREATE_USER',
      resourceType: 'USER',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });
  }
});

/**
 * GET /api/users
 * 
 * List all users (Admin only)
 * 
 * Query Parameters:
 * - role?: 'ADMIN' | 'CONTENT_CREATOR' | 'SEO_SPECIALIST' (optional filter)
 * - companyId?: string (optional filter)
 * 
 * Response:
 * {
 *   users: Array<{
 *     id: string;
 *     email: string;
 *     name: string;
 *     role: string;
 *     companyId?: string;
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
    // Validate query parameters using Zod schema
    const validatedQuery = parseAndValidateQuery(request, listUsersSchema);

    // List users using UserService
    const users = await userService.listUsers(validatedQuery as any);

    return NextResponse.json({
      users,
      total: users.length,
    });
  } catch (error: any) {
    console.error('Error listing users:', error);
    return handleApiError(parseServiceError(error), {
      userId: user.id,
      action: 'LIST_USERS',
      resourceType: 'USER',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });
  }
});
