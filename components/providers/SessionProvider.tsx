/**
 * Session Provider Component
 * 
 * Wraps the application with NextAuth SessionProvider
 * to enable session management throughout the app
 * 
 * Requirements: 11.1
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Client-side session provider wrapper
 * Must be used in client components to access session data
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
