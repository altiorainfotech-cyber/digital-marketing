/**
 * User Creation with Activation Code API Route
 * 
 * POST /api/users/create-with-activation - Create user with activation code (Admin only)
 * 
 * Requirements: 1.2, 1.6
 * 
 * Key Features:
 * - Admin-only access for user creation
 * - Auto-generates activation code
 * - Creates users without passwords
 * - No company assignment required
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { UserManagementServiceImpl } from '@/lib/services/UserManagementService';
import { ActivationCodeGeneratorImpl } from '@/lib/services/ActivationCodeGenerator';
import { UserRole } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';
import { handleApiError, parseServiceError } from '@/lib/errors/api-handler';

const codeGenerator = new ActivationCodeGeneratorImpl(prisma as any);
const userManagementService = new UserManagementServiceImpl(codeGenerator, prisma as any);

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
 * POST /api/users/create-with-activation
 * 
 * Create a new user with activation code (Admin only)
 * 
 * Request Body:
 * {
 *   name: string;
 *   email: string;
 *   role: 'ADMIN' | 'CONTENT_CREATOR' | 'SEO_SPECIALIST';
 * }
 * 
 * Response:
 * {
 *   user: {
 *     id: string;
 *     email: string;
 *     name: string;
 *     role: string;
 *     isActivated: boolean;
 *     createdAt: string;
 *   };
 *   activationCode: string;
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
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and role are required' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!Object.values(UserRole).includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` },
        { status: 400 }
      );
    }
    
    // Create user with activation code
    const result = await userManagementService.createUser({
      name: body.name,
      email: body.email,
      role: body.role as UserRole,
    });
    
    // Return user and activation code
    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        isActivated: result.user.isActivated,
        createdAt: result.user.createdAt,
      },
      activationCode: result.activationCode,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user with activation code:', error);
    return handleApiError(parseServiceError(error), {
      userId: user.id,
      action: 'CREATE_USER',
      resourceType: 'USER',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });
  }
});
