# User Deletion Options

This document explains the different user deletion options available in the system.

## Overview

The system provides three levels of user removal, each with different implications for data integrity and audit trails:

### 1. Deactivation (Recommended)
**Endpoint:** `PUT /api/users/[id]/deactivate`

- **What it does:** Sets user status to inactive, preventing login
- **Data preserved:** All user data and relationships remain intact
- **Reversible:** Yes, via reactivation endpoint
- **Use when:** User should be temporarily disabled or may return

### 2. Soft Delete (Standard)
**Endpoint:** `DELETE /api/users/[id]`

- **What it does:** Attempts to delete user record
- **Data preserved:** Fails if user has related data (assets, audit logs, etc.)
- **Reversible:** No (if successful)
- **Use when:** User has no related data and should be permanently removed
- **Returns:** 409 Conflict if user has related data

### 3. Force Delete (Destructive)
**Endpoint:** `DELETE /api/users/[id]/force-delete`

- **What it does:** Permanently deletes user and ALL related data
- **Data preserved:** Nothing - complete removal
- **Reversible:** No - permanent and irreversible
- **Use when:** Complete data removal is required (GDPR, legal requirements)
- **Warning:** This removes:
  - User account
  - Uploaded assets
  - Audit logs
  - Download history
  - Platform usage records
  - Shared assets
  - Notifications
  - Approvals

## Bulk Operations

### Bulk Deactivate
**Endpoint:** `POST /api/users/bulk-deactivate`
```json
{
  "userIds": ["user1", "user2", "user3"]
}
```

### Bulk Delete
**Endpoint:** `POST /api/users/bulk-delete`
- Attempts standard delete on multiple users
- Skips users with related data

### Bulk Force Delete
**Endpoint:** `POST /api/users/bulk-force-delete`
- Permanently removes multiple users and all their data
- Use with extreme caution

## Error Handling

### Standard Delete Errors

**409 Conflict:**
```json
{
  "error": "Cannot delete user with related data: 1 uploaded assets, 3 audit logs. Please deactivate the user instead."
}
```

**Solution:** Use deactivation or force delete instead.

## Best Practices

1. **Default to Deactivation:** Always prefer deactivation unless permanent removal is required
2. **Check Related Data:** Before force delete, review what data will be lost
3. **Audit Trail:** All deletion operations are logged in audit logs
4. **Self-Protection:** Users cannot delete their own accounts
5. **Admin Only:** All deletion operations require ADMIN role

## API Examples

### Deactivate User
```bash
curl -X PUT http://localhost:3000/api/users/USER_ID/deactivate \
  -H "Authorization: Bearer TOKEN"
```

### Standard Delete
```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer TOKEN"
```

### Force Delete
```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID/force-delete \
  -H "Authorization: Bearer TOKEN"
```

### Bulk Force Delete
```bash
curl -X POST http://localhost:3000/api/users/bulk-force-delete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user1", "user2"]}'
```
