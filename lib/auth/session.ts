/**
 * Server-side Session Management
 * 
 * Provides utilities for accessing and validating user sessions
 * in server components and API routes
 * 
 * Requirements: 11.1, 11.2
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authConfig';
import { UserRole } from '@/app/generated/prisma';

/**
 * Get the current user session on the server
 * 
 * @returns Promise resolving to the session or null if not authenticated
 */
export async function getCurrentSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 * Throws an error if user is not authenticated
 * 
 * @returns Promise resolving to the authenticated user
 * @throws Error if user is not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized - Authentication required');
  }
  
  return session.user;
}

/**
 * Require a specific role for access
 * Throws an error if user doesn't have the required role
 * 
 * @param role - Required user role
 * @returns Promise resolving to the authenticated user
 * @throws Error if user doesn't have required role
 */
export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  
  if (user.role !== role) {
    throw new Error(`Forbidden - ${role} role required`);
  }
  
  return user;
}

/**
 * Require one of multiple roles for access
 * Throws an error if user doesn't have any of the required roles
 * 
 * @param roles - Array of acceptable user roles
 * @returns Promise resolving to the authenticated user
 * @throws Error if user doesn't have any required role
 */
export async function requireAnyRole(roles: UserRole[]) {
  const user = await requireAuth();
  
  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden - One of [${roles.join(', ')}] roles required`);
  }
  
  return user;
}

/**
 * Check if current user is an admin
 * 
 * @returns Promise resolving to true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user?.role === UserRole.ADMIN;
}

/**
 * Check if current user has a specific role
 * 
 * @param role - Role to check
 * @returns Promise resolving to true if user has role, false otherwise
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user?.role === role;
}
