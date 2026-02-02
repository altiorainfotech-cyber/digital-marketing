/**
 * Client-side Authentication Hooks
 * 
 * Provides React hooks for accessing session data and authentication
 * state in client components
 * 
 * Requirements: 11.1
 */

'use client';

import { useSession as useNextAuthSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { UserRole } from '@/app/generated/prisma';

/**
 * Hook to access the current session
 * 
 * @returns Session data and loading state
 */
export function useSession() {
  return useNextAuthSession();
}

/**
 * Hook to access the current user
 * 
 * @returns Current user or null if not authenticated
 */
export function useUser() {
  const { data: session } = useSession();
  return session?.user || null;
}

/**
 * Hook to check if user is authenticated
 * 
 * @returns True if user is authenticated, false otherwise
 */
export function useIsAuthenticated(): boolean {
  const { data: session, status } = useSession();
  return status === 'authenticated' && !!session?.user;
}

/**
 * Hook to check if user has a specific role
 * 
 * @param role - Role to check
 * @returns True if user has the role, false otherwise
 */
export function useHasRole(role: UserRole): boolean {
  const user = useUser();
  return user?.role === role;
}

/**
 * Hook to check if user is an admin
 * 
 * @returns True if user is admin, false otherwise
 */
export function useIsAdmin(): boolean {
  return useHasRole(UserRole.ADMIN);
}

/**
 * Hook to check if user is a content creator
 * 
 * @returns True if user is content creator, false otherwise
 */
export function useIsContentCreator(): boolean {
  return useHasRole(UserRole.CONTENT_CREATOR);
}

/**
 * Hook to check if user is an SEO specialist
 * 
 * @returns True if user is SEO specialist, false otherwise
 */
export function useIsSEOSpecialist(): boolean {
  return useHasRole(UserRole.SEO_SPECIALIST);
}

/**
 * Hook to check if user has any of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles, false otherwise
 */
export function useHasAnyRole(roles: UserRole[]): boolean {
  const user = useUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Hook to sign out the current user
 * 
 * @returns Function to trigger sign out
 */
export function useSignOut() {
  return async () => {
    await nextAuthSignOut({ callbackUrl: '/auth/signin' });
  };
}
