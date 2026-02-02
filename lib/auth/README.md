# Authentication Module

This module provides authentication and authorization utilities for the DASCMS application.

## Components

### 1. NextAuth Configuration (`lib/auth.ts`)
- Configures NextAuth.js with credentials provider
- Implements JWT-based sessions
- Extends session to include user role and company

### 2. Server-Side Session Management (`lib/auth/session.ts`)
- `getCurrentSession()` - Get current session
- `requireAuth()` - Require authentication (throws if not authenticated)
- `requireRole(role)` - Require specific role
- `requireAnyRole(roles)` - Require one of multiple roles
- `isAdmin()` - Check if user is admin
- `hasRole(role)` - Check if user has specific role

### 3. API Middleware (`lib/auth/api-middleware.ts`)
- `withAuth(handler)` - Wrap API route to require authentication
- `withRole(role, handler)` - Wrap API route to require specific role
- `withAnyRole(roles, handler)` - Wrap API route to require one of multiple roles
- `withAdmin(handler)` - Wrap API route to require admin role
- `verifyAuth(request)` - Verify authentication and extract user context
- `getAuthContext(request)` - Get authentication context from request

### 4. Client-Side Hooks (`lib/auth/hooks.ts`)
- `useSession()` - Access current session
- `useUser()` - Access current user
- `useIsAuthenticated()` - Check if user is authenticated
- `useHasRole(role)` - Check if user has specific role
- `useIsAdmin()` - Check if user is admin
- `useIsContentCreator()` - Check if user is content creator
- `useIsSEOSpecialist()` - Check if user is SEO specialist
- `useHasAnyRole(roles)` - Check if user has any of specified roles

## Usage Examples

### API Routes with Authentication

#### Basic Authentication
```typescript
// app/api/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request, { user }) => {
  // user is guaranteed to be authenticated
  // user contains: id, email, name, role, companyId
  
  return NextResponse.json({
    message: 'Authenticated user',
    userId: user.id,
    role: user.role,
  });
});
```

#### Role-Based Access Control
```typescript
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';

export const GET = withAdmin(async (request, { user }) => {
  // Only admins can access this endpoint
  
  return NextResponse.json({
    message: 'Admin-only endpoint',
  });
});
```

#### Multiple Roles
```typescript
// app/api/assets/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAnyRole } from '@/lib/auth';
import { UserRole } from '@/app/generated/prisma';

export const POST = withAnyRole(
  [UserRole.ADMIN, UserRole.CONTENT_CREATOR],
  async (request, { user }) => {
    // Only admins and content creators can upload
    
    return NextResponse.json({
      message: 'Upload successful',
    });
  }
);
```

#### Specific Role
```typescript
// app/api/seo/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { UserRole } from '@/app/generated/prisma';

export const GET = withRole(
  UserRole.SEO_SPECIALIST,
  async (request, { user }) => {
    // Only SEO specialists can access this endpoint
    
    return NextResponse.json({
      message: 'SEO assets',
    });
  }
);
```

#### Manual Authentication Check
```typescript
// app/api/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Custom logic with auth.user
  return NextResponse.json({
    userId: auth.user.id,
  });
}
```

### Server Components

```typescript
// app/dashboard/page.tsx
import { requireAuth, requireRole } from '@/lib/auth';
import { UserRole } from '@/app/generated/prisma';

export default async function DashboardPage() {
  // Require authentication
  const user = await requireAuth();
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {user.role}</p>
    </div>
  );
}

// Admin-only page
export default async function AdminPage() {
  // Require admin role
  const user = await requireRole(UserRole.ADMIN);
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { useUser, useIsAdmin, useHasAnyRole } from '@/lib/auth';
import { UserRole } from '@/app/generated/prisma';

export function UserProfile() {
  const user = useUser();
  const isAdmin = useIsAdmin();
  const canUpload = useHasAnyRole([
    UserRole.ADMIN,
    UserRole.CONTENT_CREATOR,
  ]);
  
  if (!user) {
    return <div>Not authenticated</div>;
  }
  
  return (
    <div>
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      {isAdmin && <button>Admin Actions</button>}
      {canUpload && <button>Upload Asset</button>}
    </div>
  );
}
```

## Authentication Flow

1. **Login**: User submits credentials via `/api/auth/signin`
2. **Verification**: NextAuth verifies credentials against database
3. **Session Creation**: JWT token is created with user data (id, role, companyId)
4. **Request Authentication**: 
   - Page routes: Next.js middleware checks authentication
   - API routes: Use `withAuth` or other middleware wrappers
5. **Role Extraction**: User role is extracted from session and available in handlers

## Error Responses

### 401 Unauthorized
Returned when authentication is required but user is not authenticated.

```json
{
  "error": "Unauthorized - Authentication required"
}
```

### 403 Forbidden
Returned when user is authenticated but doesn't have required role.

```json
{
  "error": "Forbidden - ADMIN role required"
}
```

```json
{
  "error": "Forbidden - One of [ADMIN, CONTENT_CREATOR] roles required"
}
```

## Security Considerations

1. **JWT Secrets**: Ensure `NEXTAUTH_SECRET` is set in environment variables
2. **Password Hashing**: Passwords are hashed using bcrypt
3. **Session Expiry**: Sessions expire after 30 days
4. **Role Validation**: All role checks are performed server-side
5. **Error Logging**: Authentication failures are logged for security monitoring

## Requirements Validation

This module validates the following requirements:

- **Requirement 11.1**: User authentication using NextAuth.js
- **Requirement 11.2**: Role-based permission verification
- **Requirement 11.4**: Authentication error handling
