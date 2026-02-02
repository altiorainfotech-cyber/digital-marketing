# Authentication Documentation

## Overview

The DASCMS uses NextAuth.js v4 for authentication with a credentials-based provider and JWT session strategy. This provides secure, stateless authentication suitable for serverless deployment.

## Configuration

### Environment Variables

Required environment variables in `.env`:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### NextAuth.js Setup

The authentication configuration is located in `lib/auth.ts` and includes:

- **Credentials Provider**: Email/password authentication
- **JWT Strategy**: Stateless sessions with 30-day expiration
- **Custom Callbacks**: Adds user role and company to session
- **Custom Pages**: `/auth/signin` and `/auth/error`

## Architecture

### Components

1. **`lib/auth.ts`**: NextAuth.js configuration with credentials provider
2. **`app/api/auth/[...nextauth]/route.ts`**: API route handler for NextAuth
3. **`lib/auth/session.ts`**: Server-side session utilities
4. **`lib/auth/hooks.ts`**: Client-side React hooks
5. **`lib/utils/password.ts`**: Password hashing utilities
6. **`components/providers/SessionProvider.tsx`**: Client-side session provider
7. **`middleware.ts`**: Route protection middleware

### Session Structure

The session includes extended user information:

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole; // ADMIN | CONTENT_CREATOR | SEO_SPECIALIST
    companyId?: string;
  };
  expires: string;
}
```

## Usage

### Server-Side (Server Components & API Routes)

```typescript
import { requireAuth, requireRole, isAdmin } from '@/lib/auth';
import { UserRole } from '@/app/generated/prisma';

// Require authentication
const user = await requireAuth();

// Require specific role
const admin = await requireRole(UserRole.ADMIN);

// Check if user is admin
const isUserAdmin = await isAdmin();
```

### Client-Side (Client Components)

```typescript
'use client';

import { useUser, useIsAdmin, useHasRole } from '@/lib/auth';
import { UserRole } from '@/app/generated/prisma';

function MyComponent() {
  const user = useUser();
  const isAdmin = useIsAdmin();
  const isCreator = useHasRole(UserRole.CONTENT_CREATOR);
  
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from '@/lib/auth';

// Hash a password when creating a user
const hashedPassword = await hashPassword('SecurePassword123!');

// Verify a password during login
const isValid = await verifyPassword('SecurePassword123!', hashedPassword);
```

## API Endpoints

NextAuth.js provides the following endpoints:

- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token
- `GET /api/auth/providers` - Get available providers

## Middleware

The `middleware.ts` file protects all routes except:
- `/api/auth/*` - NextAuth.js routes
- `/_next/*` - Next.js internals
- `/auth/*` - Authentication pages
- Static files (favicon, robots.txt)

## Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Sessions**: Stateless, signed tokens
3. **CSRF Protection**: Built-in CSRF token validation
4. **Secure Cookies**: HTTP-only, secure cookies in production
5. **Session Expiration**: 30-day maximum session lifetime

## Testing

Unit tests are located in `tests/auth/`:

- `auth-config.test.ts`: Tests NextAuth configuration
- `password.test.ts`: Tests password hashing utilities

Run tests:
```bash
npm test -- tests/auth
```

## Requirements Validation

This implementation satisfies:

- **Requirement 11.1**: User authentication using NextAuth.js
- **Requirement 11.4**: Authentication error handling
- **Requirement 1.3**: User credential generation

## Next Steps

To complete the authentication module:

1. Create sign-in page (`app/auth/signin/page.tsx`)
2. Create error page (`app/auth/error/page.tsx`)
3. Implement user creation API with password hashing
4. Add authentication middleware for API routes
5. Create permission checker service (Task 3.3)
