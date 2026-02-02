/**
 * NextAuth.js API Route Handler
 * 
 * Catch-all route for NextAuth.js authentication endpoints
 * Handles: /api/auth/signin, /api/auth/signout, /api/auth/session, etc.
 * 
 * Requirements: 11.1
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authConfig';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
