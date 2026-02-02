/**
 * API Authentication Middleware
 * 
 * Provides request interceptors for authentication verification
 * and role extraction in API routes
 * 
 * Requirements: 11.1, 11.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authConfig';
import { UserRole } from '@/app/generated/prisma';
import type { Session } from 'next-auth';

/**
 * Authenticated user context extracted from session
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    companyId?: string;
  };
  session: Session;
}

/**
 * API route handler with authentication context
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse> | NextResponse;

/**
 * API route handler with role-based authentication context
 */
export type RoleBasedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse> | NextResponse;

/**
 * Verify authentication and extract user from session
 * 
 * This middleware intercepts API requests and verifies that:
 * 1. A valid session exists
 * 2. The session contains user information
 * 3. User role is extracted and available
 * 
 * @param request - Next.js request object
 * @returns AuthContext with user and session, or null if not authenticated
 */
export async function verifyAuth(
  request: NextRequest
): Promise<AuthContext | null> {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    // Check if session exists and has user
    if (!session || !session.user) {
      return null;
    }

    // Extract user information including role
    const { id, email, name, role, companyId } = session.user;

    // Validate required fields
    if (!id || !email || !name || !role) {
      console.error('Invalid session: missing required user fields');
      return null;
    }

    // Return authentication context with user and role
    return {
      user: {
        id,
        email,
        name,
        role,
        companyId,
      },
      session,
    };
  } catch (error) {
    console.error('Authentication verification error:', error);
    return null;
  }
}

/**
 * Middleware wrapper that requires authentication
 * 
 * Wraps an API route handler to ensure the user is authenticated.
 * If authentication fails, returns 401 Unauthorized.
 * 
 * @param handler - API route handler that receives authenticated context
 * @returns Wrapped handler that verifies authentication
 * 
 * @example
 * ```typescript
 * export const GET = withAuth(async (request, { user }) => {
 *   // user is guaranteed to be authenticated
 *   return NextResponse.json({ userId: user.id });
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Verify authentication
    const authContext = await verifyAuth(request);

    // Return 401 if not authenticated
    if (!authContext) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Call handler with authenticated context
    try {
      return await handler(request, authContext);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware wrapper that requires a specific role
 * 
 * Wraps an API route handler to ensure the user has the required role.
 * If authentication fails, returns 401 Unauthorized.
 * If role check fails, returns 403 Forbidden.
 * 
 * @param role - Required user role
 * @param handler - API route handler that receives authenticated context
 * @returns Wrapped handler that verifies authentication and role
 * 
 * @example
 * ```typescript
 * export const POST = withRole(UserRole.ADMIN, async (request, { user }) => {
 *   // user is guaranteed to be authenticated and have ADMIN role
 *   return NextResponse.json({ message: 'Admin action completed' });
 * });
 * ```
 */
export function withRole(role: UserRole, handler: RoleBasedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Verify authentication
    const authContext = await verifyAuth(request);

    // Return 401 if not authenticated
    if (!authContext) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has required role
    if (authContext.user.role !== role) {
      return NextResponse.json(
        { error: `Forbidden - ${role} role required` },
        { status: 403 }
      );
    }

    // Call handler with authenticated context
    try {
      return await handler(request, authContext);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware wrapper that requires one of multiple roles
 * 
 * Wraps an API route handler to ensure the user has one of the required roles.
 * If authentication fails, returns 401 Unauthorized.
 * If role check fails, returns 403 Forbidden.
 * 
 * @param roles - Array of acceptable user roles
 * @param handler - API route handler that receives authenticated context
 * @returns Wrapped handler that verifies authentication and role
 * 
 * @example
 * ```typescript
 * export const GET = withAnyRole(
 *   [UserRole.ADMIN, UserRole.CONTENT_CREATOR],
 *   async (request, { user }) => {
 *     // user has either ADMIN or CONTENT_CREATOR role
 *     return NextResponse.json({ assets: [] });
 *   }
 * );
 * ```
 */
export function withAnyRole(roles: UserRole[], handler: RoleBasedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Verify authentication
    const authContext = await verifyAuth(request);

    // Return 401 if not authenticated
    if (!authContext) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has any of the required roles
    if (!roles.includes(authContext.user.role)) {
      return NextResponse.json(
        {
          error: `Forbidden - One of [${roles.join(', ')}] roles required`,
        },
        { status: 403 }
      );
    }

    // Call handler with authenticated context
    try {
      return await handler(request, authContext);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware wrapper that requires admin role
 * 
 * Convenience wrapper for withRole(UserRole.ADMIN, handler)
 * 
 * @param handler - API route handler that receives authenticated context
 * @returns Wrapped handler that verifies authentication and admin role
 * 
 * @example
 * ```typescript
 * export const DELETE = withAdmin(async (request, { user }) => {
 *   // user is guaranteed to be an admin
 *   return NextResponse.json({ message: 'User deleted' });
 * });
 * ```
 */
export function withAdmin(handler: RoleBasedHandler) {
  return withRole(UserRole.ADMIN, handler);
}

/**
 * Extract authentication context from request (for use in route handlers)
 * 
 * This is a lower-level utility that can be used when you need more control
 * over error handling or want to handle authentication manually.
 * 
 * @param request - Next.js request object
 * @returns AuthContext or null if not authenticated
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await getAuthContext(request);
 *   if (!auth) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Use auth.user...
 * }
 * ```
 */
export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext | null> {
  return verifyAuth(request);
}
