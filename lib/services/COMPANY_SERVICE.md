# CompanyService

## Overview

The `CompanyService` manages company creation, validation, user assignment, and deletion protection in the DASCMS system. It ensures company name uniqueness, allows user assignment to companies, and implements deletion protection when users or assets are associated with a company.

## Requirements

- **Requirement 2.1**: Company name must be unique
- **Requirement 2.2**: Allow assignment of users to companies
- **Requirement 2.3**: Display all companies with user counts
- **Requirement 2.4**: Prevent deletion if assets or users are associated
- **Requirement 2.5**: Log all company operations in the Audit Log

## Key Features

1. **Company Creation with Uniqueness Validation**
   - Validates company name is required and unique
   - Trims whitespace from company names
   - Creates audit log entry for company creation

2. **User Assignment**
   - Allows assigning multiple users to a company
   - Validates company and users exist before assignment
   - Logs user assignment operations

3. **Deletion Protection**
   - Prevents deletion if users are associated with the company
   - Prevents deletion if assets are associated with the company
   - Provides detailed error messages with counts
   - Creates audit log entry before deletion

4. **Company Management**
   - Update company name with uniqueness validation
   - Retrieve companies by ID or name
   - List all companies with user counts
   - Check if a company can be deleted

## API

### `createCompany(params: CreateCompanyParams): Promise<CreateCompanyResult>`

Creates a new company with uniqueness validation.

**Parameters:**
```typescript
interface CreateCompanyParams {
  name: string;
  createdBy: string; // ID of the admin creating the company
  ipAddress?: string;
  userAgent?: string;
}
```

**Returns:**
```typescript
interface CreateCompanyResult {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Throws:**
- `Error('Company name is required')` - If name is empty or whitespace-only
- `Error('Company with this name already exists')` - If name is not unique

**Example:**
```typescript
const company = await companyService.createCompany({
  name: 'Acme Corporation',
  createdBy: adminUserId,
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
});
```

### `updateCompany(params: UpdateCompanyParams): Promise<CreateCompanyResult>`

Updates an existing company.

**Parameters:**
```typescript
interface UpdateCompanyParams {
  companyId: string;
  name?: string;
  updatedBy: string; // ID of the admin updating the company
  ipAddress?: string;
  userAgent?: string;
}
```

**Returns:** `CreateCompanyResult`

**Throws:**
- `Error('Company not found')` - If company doesn't exist
- `Error('Company name cannot be empty')` - If name is empty
- `Error('Company with this name already exists')` - If new name is not unique

**Example:**
```typescript
const updated = await companyService.updateCompany({
  companyId: 'company-123',
  name: 'Acme Corp',
  updatedBy: adminUserId,
});
```

### `assignUsers(params: AssignUsersParams): Promise<string[]>`

Assigns users to a company.

**Parameters:**
```typescript
interface AssignUsersParams {
  companyId: string;
  userIds: string[];
  assignedBy: string; // ID of the admin assigning users
  ipAddress?: string;
  userAgent?: string;
}
```

**Returns:** Array of assigned user IDs

**Throws:**
- `Error('Company not found')` - If company doesn't exist
- `Error('One or more users not found')` - If any user doesn't exist

**Example:**
```typescript
const assignedUserIds = await companyService.assignUsers({
  companyId: 'company-123',
  userIds: ['user-1', 'user-2', 'user-3'],
  assignedBy: adminUserId,
});
```

### `deleteCompany(companyId: string, deletedBy: string, ipAddress?: string, userAgent?: string): Promise<void>`

Deletes a company with protection logic.

**Parameters:**
- `companyId` - ID of the company to delete
- `deletedBy` - ID of the admin deleting the company
- `ipAddress` - Optional IP address
- `userAgent` - Optional user agent

**Throws:**
- `Error('Company not found')` - If company doesn't exist
- `Error('Cannot delete company: X user(s) are associated with this company')` - If users are associated
- `Error('Cannot delete company: X asset(s) are associated with this company')` - If assets are associated

**Example:**
```typescript
await companyService.deleteCompany('company-123', adminUserId);
```

### `getCompanyById(companyId: string): Promise<CreateCompanyResult | null>`

Retrieves a company by ID.

**Returns:** Company or null if not found

**Example:**
```typescript
const company = await companyService.getCompanyById('company-123');
```

### `getCompanyByName(name: string): Promise<CreateCompanyResult | null>`

Retrieves a company by name.

**Returns:** Company or null if not found

**Example:**
```typescript
const company = await companyService.getCompanyByName('Acme Corporation');
```

### `listCompanies(): Promise<CompanyWithUserCount[]>`

Lists all companies with user counts.

**Returns:**
```typescript
interface CompanyWithUserCount extends CreateCompanyResult {
  userCount: number;
}
```

**Example:**
```typescript
const companies = await companyService.listCompanies();
// [
//   { id: 'company-1', name: 'Acme Corp', userCount: 5, ... },
//   { id: 'company-2', name: 'Beta Inc', userCount: 3, ... }
// ]
```

### `getCompanyUsers(companyId: string): Promise<string[]>`

Gets users assigned to a company.

**Returns:** Array of user IDs

**Throws:**
- `Error('Company not found')` - If company doesn't exist

**Example:**
```typescript
const userIds = await companyService.getCompanyUsers('company-123');
```

### `canDeleteCompany(companyId: string): Promise<{ canDelete: boolean; reason?: string; userCount?: number; assetCount?: number }>`

Checks if a company can be deleted.

**Returns:**
```typescript
{
  canDelete: boolean;
  reason?: string;
  userCount?: number;
  assetCount?: number;
}
```

**Example:**
```typescript
const result = await companyService.canDeleteCompany('company-123');
if (result.canDelete) {
  await companyService.deleteCompany('company-123', adminUserId);
} else {
  console.log(result.reason); // "Cannot delete company: 5 user(s) and 10 asset(s) are associated with this company"
}
```

## Usage Example

```typescript
import { PrismaClient } from '@/app/generated/prisma';
import { CompanyService, AuditService } from '@/lib/services';

const prisma = new PrismaClient();
const auditService = new AuditService(prisma);
const companyService = new CompanyService(prisma, auditService);

// Create a company
const company = await companyService.createCompany({
  name: 'Acme Corporation',
  createdBy: adminUserId,
});

// Assign users to the company
await companyService.assignUsers({
  companyId: company.id,
  userIds: ['user-1', 'user-2'],
  assignedBy: adminUserId,
});

// List all companies with user counts
const companies = await companyService.listCompanies();

// Check if company can be deleted
const canDelete = await companyService.canDeleteCompany(company.id);
if (!canDelete.canDelete) {
  console.log(canDelete.reason);
}

// Delete company (only if no users or assets)
await companyService.deleteCompany(company.id, adminUserId);
```

## Audit Logging

All company operations are automatically logged to the audit log:

- **CREATE**: When a company is created
- **UPDATE**: When a company is updated
- **DELETE**: When a company is deleted (logged before deletion)
- **UPDATE** (user assignment): When users are assigned to a company

Each audit log entry includes:
- User ID (who performed the action)
- Action type
- Resource type (COMPANY)
- Resource ID (company ID)
- Metadata (company details, changes, etc.)
- Optional IP address and user agent

## Error Handling

The service provides clear, actionable error messages:

- **Validation Errors**: "Company name is required", "Company name cannot be empty"
- **Uniqueness Errors**: "Company with this name already exists"
- **Not Found Errors**: "Company not found", "One or more users not found"
- **Deletion Protection Errors**: "Cannot delete company: X user(s) are associated with this company"

## Testing

The service includes comprehensive unit tests covering:

- Company creation with uniqueness validation
- Company updates with duplicate name prevention
- User assignment functionality
- Deletion protection for companies with users or assets
- Audit logging for all operations
- Error handling for edge cases

Run tests with:
```bash
npm test -- CompanyService.test.ts
```

## Dependencies

- **PrismaClient**: Database access
- **AuditService**: Audit logging
- **@/types**: Type definitions (UserRole, etc.)

## Related Services

- **UserService**: Manages users that can be assigned to companies
- **AssetService**: Manages assets that can be associated with companies
- **AuditService**: Logs all company operations
