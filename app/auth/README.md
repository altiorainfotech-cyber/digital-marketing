# Authentication Pages

This directory contains the authentication-related pages for DASCMS.

## Pages

### Sign In (`/auth/signin`)

The login page provides email and password authentication using NextAuth.js.

**Features:**
- Email and password input fields
- Client-side validation
- Error handling with user-friendly messages
- Loading state during authentication
- Redirect to callback URL after successful login
- Integration with NextAuth.js credentials provider

**Usage:**
```typescript
// Users are automatically redirected here when accessing protected routes
// Or can navigate directly to /auth/signin
```

### Error Page (`/auth/error`)

Displays authentication errors with user-friendly messages.

**Error Types:**
- `CredentialsSignin` - Invalid email or password
- `Configuration` - Server configuration problem
- `AccessDenied` - User doesn't have permission
- `Verification` - Token expired or already used

**Usage:**
```typescript
// Automatically shown when authentication errors occur
// Users can return to sign in page from here
```

## Session Management

### Client-Side

**Protected Route Component:**
```typescript
import { ProtectedRoute } from '@/components/auth';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

**With Role Requirements:**
```typescript
import { ProtectedRoute } from '@/components/auth';
import { UserRole } from '@/app/generated/prisma';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

**Using Session Hooks:**
```typescript
import { useUser, useIsAuthenticated, useSignOut } from '@/lib/auth/hooks';

function MyComponent() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const signOut = useSignOut();

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user?.name}!</p>}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Server-Side

**In Server Components:**
```typescript
import { getCurrentSession, requireAuth } from '@/lib/auth/session';

export default async function ServerPage() {
  const session = await getCurrentSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

**In API Routes:**
```typescript
import { requireAuth, requireRole } from '@/lib/auth/session';
import { UserRole } from '@/app/generated/prisma';

export async function GET() {
  // Require authentication
  const user = await requireAuth();
  
  // Or require specific role
  const admin = await requireRole(UserRole.ADMIN);
  
  return Response.json({ user });
}
```

## Middleware

The application uses Next.js middleware to protect routes at the edge:

```typescript
// middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/((?!api/auth|_next|favicon.ico|robots.txt|auth).*)',
  ],
};
```

All routes except authentication pages and public assets require authentication.

## Environment Variables

Required environment variables for authentication:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

Generate a secret with:
```bash
openssl rand -base64 32
```

## Requirements

This implementation satisfies:
- **Requirement 11.1**: User authentication with NextAuth.js
- **Property 20**: Authentication verification with credential validation

## Testing

To test authentication:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. You'll be redirected to `/auth/signin`

4. Use test credentials (create a user first via API or seed script)

5. After successful login, you'll be redirected to `/dashboard`

## Security Considerations

- Passwords are hashed using bcryptjs before storage
- JWT tokens are used for stateless sessions
- Sessions expire after 30 days
- All authentication attempts are logged
- Invalid credentials return generic error messages to prevent user enumeration
- HTTPS is required in production (enforced by NextAuth.js)
