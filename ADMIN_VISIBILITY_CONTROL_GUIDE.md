# Admin Visibility Control - Visual Guide

## Feature Location

The visibility control feature is located on the **Asset Detail Page** in the **Details** section (right sidebar).

## UI Components

### 1. Visibility Display (All Users)

```
┌─────────────────────────────────────┐
│ Details                             │
├─────────────────────────────────────┤
│ 📄 Asset Type                       │
│    IMAGE                            │
│                                     │
│ 📄 Upload Type                      │
│    SEO                              │
│                                     │
│ 👁️ Visibility                       │
│    PUBLIC                           │  ← Shows current visibility
│                                     │
│ 💾 File Size                        │
│    2.45 MB                          │
└─────────────────────────────────────┘
```

### 2. Visibility Display with Change Button (Admin Only, Approved Assets)

```
┌─────────────────────────────────────┐
│ Details                             │
├─────────────────────────────────────┤
│ 📄 Asset Type                       │
│    IMAGE                            │
│                                     │
│ 📄 Upload Type                      │
│    SEO                              │
│                                     │
│ 👁️ Visibility                       │
│    PUBLIC              [Change]     │  ← Admin sees "Change" button
│                                     │
│ 💾 File Size                        │
│    2.45 MB                          │
└─────────────────────────────────────┘
```

### 3. Visibility Change Modal

When admin clicks "Change", a modal appears:

```
┌───────────────────────────────────────────────┐
│  Change Asset Visibility                  ✕   │
├───────────────────────────────────────────────┤
│                                               │
│  Change visibility for: My Asset Title        │
│                                               │
│  Visibility Level                             │
│  ┌─────────────────────────────────────────┐ │
│  │ Public (Everyone)                    ▼  │ │
│  └─────────────────────────────────────────┘ │
│  Choose who can view this asset               │
│                                               │
│  Options:                                     │
│  • Private (Uploader Only)                    │
│  • Admin Only                                 │
│  • Public (Everyone)                          │
│  • Company                                    │
│  • SEO Specialist Role                        │
│  • Content Creator Role                       │
│  • Selected Users                             │
│                                               │
│                    [Cancel] [Update Visibility]│
└───────────────────────────────────────────────┘
```

## User Flow

### Admin User Flow

```
1. Admin logs in
   ↓
2. Navigates to Assets page
   ↓
3. Sees ALL approved assets (regardless of visibility)
   ↓
4. Clicks on an approved asset
   ↓
5. Views asset detail page
   ↓
6. Sees "Change" button next to Visibility in Details section
   ↓
7. Clicks "Change"
   ↓
8. Modal opens with visibility options
   ↓
9. Selects new visibility level
   ↓
10. Clicks "Update Visibility"
    ↓
11. Visibility is updated
    ↓
12. Success message appears
    ↓
13. Change is logged to audit trail
```

### Non-Admin User Flow

```
1. User logs in (Content Creator or SEO Specialist)
   ↓
2. Navigates to Assets page
   ↓
3. Sees only assets they have permission to view
   ↓
4. Clicks on an asset
   ↓
5. Views asset detail page
   ↓
6. Sees visibility level (NO "Change" button)
   ↓
7. Cannot modify visibility
```

## Visibility Behavior

### Before This Feature

| User Role        | Can See All Assets? | Can Change Visibility? |
|------------------|---------------------|------------------------|
| Admin            | ✅ Yes              | ❌ No                  |
| Content Creator  | ❌ No (filtered)    | ❌ No                  |
| SEO Specialist   | ❌ No (filtered)    | ❌ No                  |

### After This Feature

| User Role        | Can See All Assets? | Can Change Visibility? |
|------------------|---------------------|------------------------|
| Admin            | ✅ Yes              | ✅ Yes (approved only) |
| Content Creator  | ❌ No (filtered)    | ❌ No                  |
| SEO Specialist   | ❌ No (filtered)    | ❌ No                  |

## Visibility Options Explained

### 1. Private (Uploader Only)
- **Who can see**: Only the person who uploaded the asset
- **Use case**: Personal drafts, private content

### 2. Admin Only
- **Who can see**: Admins and the uploader
- **Use case**: Sensitive content that needs admin review

### 3. Public (Everyone)
- **Who can see**: All authenticated users
- **Use case**: Company-wide resources, general content

### 4. Company
- **Who can see**: All users in the same company as the asset
- **Use case**: Company-specific content

### 5. SEO Specialist Role
- **Who can see**: Only users with SEO Specialist role
- **Use case**: SEO-specific resources and content

### 6. Content Creator Role
- **Who can see**: Only users with Content Creator role
- **Use case**: Content creation resources

### 7. Selected Users
- **Who can see**: Only users explicitly shared with
- **Use case**: Collaborative projects, specific team members

## Example Scenarios

### Scenario 1: Making an Asset Public

**Situation**: An approved asset is currently set to "Company" visibility, but the admin wants to make it available to everyone.

**Steps**:
1. Admin navigates to the asset detail page
2. Sees "Visibility: COMPANY [Change]"
3. Clicks "Change"
4. Selects "Public (Everyone)" from dropdown
5. Clicks "Update Visibility"
6. Asset is now visible to all users

### Scenario 2: Restricting to Specific Role

**Situation**: An approved asset contains SEO-specific information and should only be visible to SEO Specialists.

**Steps**:
1. Admin navigates to the asset detail page
2. Sees "Visibility: PUBLIC [Change]"
3. Clicks "Change"
4. Selects "SEO Specialist Role" from dropdown
5. Clicks "Update Visibility"
6. Asset is now only visible to SEO Specialists (and admins)

### Scenario 3: Making Asset Private Again

**Situation**: An asset was accidentally made public and needs to be restricted back to the uploader.

**Steps**:
1. Admin navigates to the asset detail page
2. Sees "Visibility: PUBLIC [Change]"
3. Clicks "Change"
4. Selects "Private (Uploader Only)" from dropdown
5. Clicks "Update Visibility"
6. Asset is now only visible to the uploader (and admins)

## Security Notes

- ✅ Only admins can change visibility
- ✅ Only approved assets can have visibility changed
- ✅ All changes are logged to audit trail
- ✅ Non-admin users cannot access the API endpoint
- ✅ Validation ensures only valid visibility levels are accepted

## Troubleshooting

### "Change" button not appearing

**Possible causes**:
1. User is not an admin
2. Asset is not in APPROVED status
3. Page needs to be refreshed

**Solution**: Verify user role and asset status

### Visibility change fails

**Possible causes**:
1. Network error
2. Invalid visibility level
3. Asset not found
4. Permission denied

**Solution**: Check browser console for error messages, verify admin permissions

### Changes not reflected immediately

**Possible causes**:
1. Cache not cleared
2. Page not refreshed

**Solution**: Refresh the page to see updated visibility

## API Reference

### Endpoint
```
PATCH /api/assets/[id]/visibility
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <token>
```

### Request Body
```json
{
  "visibility": "PUBLIC",
  "allowedRole": null
}
```

### Response (Success)
```json
{
  "id": "asset-id",
  "visibility": "PUBLIC",
  "allowedRole": null,
  "message": "Visibility updated successfully"
}
```

### Response (Error - Not Admin)
```json
{
  "error": "Only administrators can update asset visibility"
}
```
Status: 403 Forbidden

### Response (Error - Invalid Visibility)
```json
{
  "error": "Valid visibility level is required"
}
```
Status: 400 Bad Request
