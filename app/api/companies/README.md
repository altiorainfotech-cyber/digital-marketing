# Company Management API Routes

This directory contains API routes for company management in the DASCMS system.

## Requirements

Implements Requirements 2.1-2.5:
- 2.1: Unique company name validation
- 2.2: User assignment to companies
- 2.3: Display companies with user counts
- 2.4: Deletion protection (prevent deletion if users or assets are associated)
- 2.5: Audit logging for all company operations

## Routes

### POST /api/companies

Create a new company (Admin only).

**Request Body:**
```json
{
  "name": "Company Name"
}
```

**Response (201 Created):**
```json
{
  "id": "company-uuid",
  "name": "Company Name",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- `400 Bad Request`: Missing or empty company name
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `409 Conflict`: Company name already exists
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"name": "ASD Marketing"}'
```

---

### GET /api/companies

List all companies with user counts (Admin only).

**Response (200 OK):**
```json
{
  "companies": [
    {
      "id": "company-uuid",
      "name": "Company Name",
      "userCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3000/api/companies
```

---

### DELETE /api/companies/[id]

Delete a company (Admin only).

**Deletion Protection (Requirement 2.4):**
- Cannot delete if users are associated with the company
- Cannot delete if assets are associated with the company

**Response (200 OK):**
```json
{
  "message": "Company deleted successfully"
}
```

**Errors:**
- `400 Bad Request`: Company has associated users or assets
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `404 Not Found`: Company not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/companies/company-uuid
```

**Example Error Response (400):**
```json
{
  "error": "Cannot delete company: 3 user(s) are associated with this company"
}
```

## Authentication

All routes require authentication and admin role. The authentication middleware (`withAdmin`) automatically:
- Verifies the user is authenticated
- Verifies the user has the `ADMIN` role
- Returns `401 Unauthorized` if not authenticated
- Returns `403 Forbidden` if not an admin

## Audit Logging

All company operations are logged in the audit log (Requirement 2.5):
- Company creation: Logs company name and creator
- Company deletion: Logs company name and deleter
- IP address and user agent are captured for all operations

## Service Integration

These routes use the `CompanyService` class which provides:
- Unique name validation (Requirement 2.1)
- User assignment functionality (Requirement 2.2)
- User count calculation (Requirement 2.3)
- Deletion protection logic (Requirement 2.4)
- Audit logging integration (Requirement 2.5)

## Error Handling

The routes follow a consistent error handling pattern:
1. Validate input data
2. Call service methods
3. Catch and categorize errors
4. Return appropriate HTTP status codes with error messages

Error categories:
- **Validation errors (400)**: Missing fields, invalid data, deletion protection
- **Authentication errors (401)**: Not authenticated
- **Authorization errors (403)**: Not an admin
- **Not found errors (404)**: Company doesn't exist
- **Conflict errors (409)**: Company name already exists
- **Server errors (500)**: Unexpected errors

## Testing

To test these routes:

1. **Create a company:**
   ```bash
   curl -X POST http://localhost:3000/api/companies \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Company"}'
   ```

2. **List companies:**
   ```bash
   curl http://localhost:3000/api/companies
   ```

3. **Delete a company:**
   ```bash
   curl -X DELETE http://localhost:3000/api/companies/[company-id]
   ```

4. **Test deletion protection:**
   - Create a company
   - Assign users to the company
   - Try to delete the company (should fail with 400 error)

## Related Files

- `lib/services/CompanyService.ts`: Business logic for company operations
- `lib/services/AuditService.ts`: Audit logging service
- `lib/auth/api-middleware.ts`: Authentication middleware
- `prisma/schema.prisma`: Database schema
