# User Management API Routes

This directory contains the API routes for user management in the DASCMS application.

## Requirements

Implements Requirements 1.1-1.5:
- User creation with role assignment
- Company assignment for non-Admin users
- Credential generation
- User listing and filtering
- User updates with validation
- Audit logging for all operations

## Endpoints

### POST /api/users

Create a new user (Admin only).

**Authentication:** Admin role required

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123",
  "role": "CONTENT_CREATOR",
  "companyId": "company-uuid"
}
```

**Required Fields:**
- `email` (string): User's email address
- `name` (string): User's full name
- `password` (string): User's password (min 8 characters)
- `role` (string): One of `ADMIN`, `CONTENT_CREATOR`, `SEO_SPECIALIST`
- `companyId` (string): Required for non-Admin users

**Response (201 Created):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CONTENT_CREATOR",
  "companyId": "company-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (missing fields, invalid role, etc.)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

---

### GET /api/users

List all users with optional filtering (Admin only).

**Authentication:** Admin role required

**Query Parameters:**
- `role` (optional): Filter by role (`ADMIN`, `CONTENT_CREATOR`, `SEO_SPECIALIST`)
- `companyId` (optional): Filter by company ID

**Example:**
```
GET /api/users?role=CONTENT_CREATOR&companyId=company-uuid
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CONTENT_CREATOR",
      "companyId": "company-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Error Responses:**
- `400 Bad Request`: Invalid role filter
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin
- `500 Internal Server Error`: Server error

---

### PATCH /api/users/[id]

Update an existing user (Admin only).

**Authentication:** Admin role required

**Request Body (all fields optional):**
```json
{
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "password": "newpassword123",
  "role": "SEO_SPECIALIST",
  "companyId": "new-company-uuid"
}
```

**Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "role": "SEO_SPECIALIST",
  "companyId": "new-company-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (invalid role, missing company for non-Admin, etc.)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin
- `404 Not Found`: User not found
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

---

## Implementation Details

### Authentication Middleware

All routes use the `withAdmin` middleware from `@/lib/auth`, which:
1. Verifies the user is authenticated
2. Checks the user has the `ADMIN` role
3. Returns `401 Unauthorized` if not authenticated
4. Returns `403 Forbidden` if not admin

### Service Integration

Routes integrate with:
- **UserService**: Handles user creation, updates, and listing with validation
- **AuditService**: Logs all user operations for compliance

### Audit Logging

All operations extract and log:
- User ID (from authenticated session)
- IP address (from `x-forwarded-for` or `x-real-ip` headers)
- User agent (from `user-agent` header)
- Action type (CREATE, UPDATE, DELETE)
- Resource details (user data)

### Validation

**Role Validation:**
- Must be one of: `ADMIN`, `CONTENT_CREATOR`, `SEO_SPECIALIST`
- Invalid roles return `400 Bad Request`

**Company Assignment:**
- Required for non-Admin users
- Must reference an existing company
- Cannot be removed from non-Admin users

**Email Validation:**
- Must be valid email format
- Must be unique across all users

**Password Validation:**
- Minimum 8 characters
- Hashed using bcrypt before storage

### Error Handling

Routes handle specific error cases:
- **Validation errors**: Return `400` with detailed field-level errors
- **Duplicate email**: Return `409 Conflict`
- **User not found**: Return `404 Not Found`
- **Company not found**: Return `400 Bad Request`
- **Generic errors**: Return `500 Internal Server Error`

## Testing

Tests are located in:
- `tests/api/users.test.ts`: Unit tests for API routes
- `tests/api/users-integration.test.ts`: Integration tests for request/response structure
- `tests/services/UserService.test.ts`: Service layer tests

Run tests:
```bash
npm test -- tests/api/users.test.ts
```

## Security Considerations

1. **Admin-only access**: All routes require admin role
2. **Password hashing**: Passwords are hashed with bcrypt (10 rounds)
3. **Audit logging**: All operations are logged with user context
4. **Input validation**: All inputs are validated before processing
5. **No password in responses**: Password field is never returned in API responses

## Related Files

- `lib/services/UserService.ts`: User business logic
- `lib/services/AuditService.ts`: Audit logging
- `lib/auth/api-middleware.ts`: Authentication middleware
- `lib/prisma.ts`: Database client
