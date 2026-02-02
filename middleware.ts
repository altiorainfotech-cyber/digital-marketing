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
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // Allow requests if:
  // 1. It's a request for next-auth session or provider
  // 2. The token exists (user is authenticated)
  if (pathname.startsWith('/api/auth') || token) {
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
