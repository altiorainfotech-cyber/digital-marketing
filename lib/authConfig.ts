/**
 * NextAuth.js Configuration
 * 
 * Implements credentials-based authentication with JWT sessions
 * for the DASCMS application.
 * 
 * Requirements: 11.1, 11.4
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserRole } from '@/app/generated/prisma';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * Extended session type to include user role and company
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      companyId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    companyId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    companyId?: string;
  }
}

/**
 * NextAuth configuration options
 * 
 * Configures:
 * - Credentials provider for email/password authentication
 * - JWT strategy for stateless sessions
 * - Session callbacks to include user role and company
 * - Custom pages for authentication flows
 */
export const authOptions: NextAuthOptions = {
  // Use JWT strategy for serverless compatibility
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Authentication providers
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'user@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              companyId: true,
              isActivated: true,
              isActive: true,
            },
          });

          // User not found
          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check if user account is active
          if (user.isActive === false) {
            throw new Error('Account has been deactivated. Please contact your administrator.');
          }

          // Check if user is activated
          if (!user.isActivated) {
            throw new Error('Account not activated. Please use your activation code to set up your account.');
          }

          // Check if password is set
          if (!user.password) {
            throw new Error('Account not activated. Please use your activation code to set up your account.');
          }

          // Verify password
          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Return user object (password excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId || undefined,
          };
        } catch (error) {
          // Log authentication attempt for security monitoring
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],

  // Callback functions
  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     * Adds user role and company to the token
     */
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },

    /**
     * Session callback - called when session is checked
     * Adds user data from JWT to the session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
      }
      return session;
    },
  },

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Security options
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};
