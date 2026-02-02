# UserService

## Overview

The `UserService` class manages user creation, validation, role and company assignment, and credential generation for the DASCMS application.

## Requirements

- **Requirement 1.1**: Role assignment is required for all users
- **Requirement 1.2**: Company assignment is required for non-Admin users
- **Requirement 1.3**: Authentication credentials must be generated and hashed
- **Requirement 1.5**: All user operations must be logged in the audit log

## Features

### User Creation

- **Role Validation**: Ensures a valid role (ADMIN, CONTENT_CREATOR, or SEO_SPECIALIST) is assigned
- **Company Assignment**: Enforces company assignment for non-Admin users
- **Password Hashing**: Uses bcrypt with 10 salt rounds to hash passwords
- **Email Validation**: Validates email format and uniqueness
- **Audit Logging**: Logs all user creation operations

### User Updates

- **Field Updates**: Supports updating email, name, password, role, and company
- **Validation**: Ensures role and company constraints are maintained
- **Change Tracking**: Tracks and logs all changes with previous and new values
- **Audit Logging**: Logs all user update operations

### User Retrieval

- **Get by ID**: Retrieve a user by their unique ID
- **Get by Email**: Retrieve a user by their email address
- **List Users**: List all users with optional filtering by role or company

### User Deletion

- **Soft Delete**: Deletes user from database
- **Audit Logging**: Logs user deletion with user details before deletion

### Password Verification

- **Credential Verification**: Verifies user credentials for authentication
- **Bcrypt Comparison**: Uses bcrypt to compare plain text passwords with hashed passwords

## Usage

### Creating a User

```typescript
import { UserService } from '@/lib/services';
import { AuditService } from '@/lib/services';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';

const auditService = new AuditService(prisma);
const userService = new UserService(prisma, auditService);

// Create an Admin user (no company required)
const admin = await userService.createUser({
  email: 'admin@example.com',
  name: 'Admin User',
  password: 'securePassword123',
  role: UserRole.ADMIN,
  createdBy: 'system-admin-id',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
});

// Create a Content Creator (company required)
const creator = await userService.createUser({
  email: 'creator@example.com',
  name: 'Content Creator',
  password: 'securePassword123',
  role: UserRole.CONTENT_CREATOR,
  companyId: 'company-123',
  createdBy: 'admin-id',
});

// Create an SEO Specialist (company required)
const seoSpecialist = await userService.createUser({
  email: 'seo@example.com',
  name: 'SEO Specialist',
  password: 'securePassword123',
  role: UserRole.SEO_SPECIALIST,
  companyId: 'company-123',
  createdBy: 'admin-id',
});
```

### Updating a User

```typescript
// Update user name
const updatedUser = await userService.updateUser({
  userId: 'user-123',
  name: 'Updated Name',
  updatedBy: 'admin-id',
});

// Update user email
const updatedUser = await userService.updateUser({
  userId: 'user-123',
  email: 'newemail@example.com',
  updatedBy: 'admin-id',
});

// Update user role and company
const updatedUser = await userService.updateUser({
  userId: 'user-123',
  role: UserRole.SEO_SPECIALIST,
  companyId: 'company-456',
  updatedBy: 'admin-id',
});

// Update user password
const updatedUser = await userService.updateUser({
  userId: 'user-123',
  password: 'newSecurePassword123',
  updatedBy: 'admin-id',
});
```

### Retrieving Users

```typescript
// Get user by ID
const user = await userService.getUserById('user-123');

// Get user by email
const user = await userService.getUserByEmail('user@example.com');

// List all users
const users = await userService.listUsers();

// List users by role
const admins = await userService.listUsers({ role: UserRole.ADMIN });

// List users by company
const companyUsers = await userService.listUsers({ companyId: 'company-123' });
```

### Deleting a User

```typescript
await userService.deleteUser(
  'user-123',
  'admin-id',
  '192.168.1.1',
  'Mozilla/5.0'
);
```

### Verifying Password

```typescript
// Verify user credentials
const user = await userService.verifyPassword(
  'user@example.com',
  'password123'
);

if (user) {
  // Password is correct, user is authenticated
  console.log('User authenticated:', user.email);
} else {
  // Password is incorrect or user doesn't exist
  console.log('Authentication failed');
}
```

## Validation Rules

### Email Validation

- Must be a valid email format (contains @ and domain)
- Must be unique across all users

### Password Validation

- Must be at least 8 characters long
- Hashed using bcrypt with 10 salt rounds

### Role Validation

- Must be one of: ADMIN, CONTENT_CREATOR, SEO_SPECIALIST
- Required for all users

### Company Validation

- Required for CONTENT_CREATOR and SEO_SPECIALIST roles
- Not required for ADMIN role
- Must reference an existing company
- Cannot be removed from non-Admin users

## Error Handling

The service throws descriptive errors for various validation failures:

- `"Role assignment is required"` - No role provided
- `"Invalid role: {role}"` - Invalid role value
- `"Company assignment is required for non-Admin users"` - Non-Admin user without company
- `"Invalid email format"` - Email doesn't match validation pattern
- `"User with this email already exists"` - Duplicate email
- `"Company not found"` - Invalid company ID
- `"Password must be at least 8 characters long"` - Password too short
- `"User not found"` - User doesn't exist
- `"Cannot remove company from non-Admin user"` - Attempting to remove company from non-Admin

## Security Considerations

### Password Hashing

- Passwords are hashed using bcrypt with 10 salt rounds
- Plain text passwords are never stored in the database
- Password hashes are never returned in API responses

### Audit Logging

- All user operations are logged with:
  - User ID of the admin performing the operation
  - Action type (CREATE, UPDATE, DELETE)
  - Resource type (USER)
  - Resource ID (user being affected)
  - Metadata (changes, previous values, new values)
  - Optional IP address and user agent

### Data Privacy

- Password field is excluded from all query results
- Only necessary user information is returned

## Integration with Other Services

### AuditService

The UserService integrates with the AuditService to log all operations:

- User creation: `logUserCreate()`
- User updates: `logUserUpdate()`
- User deletion: `logUserDelete()`

### Prisma

The UserService uses Prisma ORM for database operations:

- `prisma.user.create()` - Create new user
- `prisma.user.findUnique()` - Find user by ID or email
- `prisma.user.findMany()` - List users with filters
- `prisma.user.update()` - Update user fields
- `prisma.user.delete()` - Delete user
- `prisma.company.findUnique()` - Validate company exists

## Testing

The UserService has comprehensive unit tests covering:

- User creation with all roles
- Validation of role and company requirements
- Password hashing
- Email validation and uniqueness
- User updates with change tracking
- User retrieval and filtering
- User deletion
- Password verification
- Error handling for all validation failures

Run tests with:

```bash
npm test -- UserService.test.ts
```

## API Integration

The UserService is designed to be used in API routes:

```typescript
// Example API route: POST /api/users
import { UserService } from '@/lib/services';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  
  try {
    const user = await userService.createUser({
      ...body,
      createdBy: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    return Response.json(user, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

## Future Enhancements

Potential future enhancements:

1. **Password Strength Validation**: Add more sophisticated password strength requirements
2. **Email Verification**: Add email verification workflow
3. **Password Reset**: Add password reset functionality
4. **User Activation**: Add user activation/deactivation
5. **Bulk Operations**: Add bulk user creation and updates
6. **User Search**: Add full-text search for users
7. **User Roles Management**: Add dynamic role management
8. **Two-Factor Authentication**: Add 2FA support
