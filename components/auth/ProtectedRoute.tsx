/**
 * Protected Route Component
 * 
 * Wrapper component that ensures user is authenticated before
 * rendering children. Redirects to sign-in page if not authenticated.
 * 
 * Requirements: 11.1
 */

'use client';

import { useSession } from '@/lib/auth/hooks';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { UserRole } from '@/app/generated/prisma';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * Protected route wrapper that checks authentication and optionally role
 * 
 * @param children - Content to render if authenticated
 * @param requiredRole - Single role required to access (optional)
 * @param requiredRoles - Array of roles, user must have one (optional)
 * @param fallback - Content to show while checking auth (optional)
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  fallback,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not authenticated, redirect to sign in
    if (status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
    }

    // If authenticated but doesn't have required role, redirect to home
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role;

      // Check single required role
      if (requiredRole && userRole !== requiredRole) {
        router.push('/');
        return;
      }

      // Check multiple required roles
      if (requiredRoles && !requiredRoles.includes(userRole)) {
        router.push('/');
        return;
      }
    }
  }, [status, session, router, pathname, requiredRole, requiredRoles]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Don't render if role check fails
  if (session?.user) {
    const userRole = session.user.role;

    if (requiredRole && userRole !== requiredRole) {
      return null;
    }

    if (requiredRoles && !requiredRoles.includes(userRole)) {
      return null;
    }
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}
