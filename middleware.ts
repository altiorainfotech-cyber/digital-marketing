/**
 * Next.js Middleware
 * 
 * Handles authentication and authorization at the edge
 * Protects routes that require authentication
 * 
 * Requirements: 11.1, 11.2
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/auth/signin',
    '/auth/error',
    '/auth/activate',
    '/auth/bypass',
    '/test-auth',
    '/',
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get token for protected routes
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Allow requests if token exists (user is authenticated)
  if (token) {
    return NextResponse.next();
  }

  // Redirect to signin if not authenticated
  const signInUrl = new URL('/auth/signin', request.url);
  signInUrl.searchParams.set('callbackUrl', request.url);
  return NextResponse.redirect(signInUrl);
}

/**
 * Configure which routes require authentication
 * 
 * All routes except public ones (auth pages, public assets) require authentication
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (NextAuth.js routes)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /robots.txt (static files)
     * - /auth/* (authentication pages)
     * - /test-auth (test page)
     */
    '/((?!api/auth|_next|favicon.ico|robots.txt|auth|test-auth).*)',
  ],
};
