/**
 * Example Protected API Route
 * 
 * Demonstrates usage of authentication middleware
 * 
 * This is an example file showing how to use the authentication middleware.
 * It can be deleted or used as a reference for implementing actual API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, withAnyRole } from '@/lib/auth';
import { UserRole } from '@/app/generated/prisma';

/**
 * GET /api/example/protected
 * 
 * Example endpoint that requires authentication
 * Any authenticated user can access this endpoint
 */
export const GET = withAuth(async (request, { user }) => {
  return NextResponse.json({
    message: 'You are authenticated!',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    },
  });
});

/**
 * POST /api/example/protected
 * 
 * Example endpoint that requires admin role
 * Only admins can access this endpoint
 */
export const POST = withAdmin(async (request, { user }) => {
  return NextResponse.json({
    message: 'Admin action completed',
    adminId: user.id,
  });
});

/**
 * PUT /api/example/protected
 * 
 * Example endpoint that requires one of multiple roles
 * Admins and content creators can access this endpoint
 */
export const PUT = withAnyRole(
  [UserRole.ADMIN, UserRole.CONTENT_CREATOR],
  async (request, { user }) => {
    return NextResponse.json({
      message: 'Upload action completed',
      userId: user.id,
      role: user.role,
    });
  }
);
