# Asset Management API Routes

This directory contains API routes for asset management in the DASCMS application.

## Overview

The asset management API provides endpoints for:
- Creating and uploading assets (SEO and Doc types)
- Listing assets with role-based filtering
- Retrieving individual assets
- Updating asset metadata
- Deleting assets
- Accessing approved SEO assets

## Requirements

Implements requirements: 3.1-3.12, 4.1-4.7, 7.1-7.6, 17.1-17.6

## Endpoints

### POST /api/assets/presign

Generate presigned URL for direct upload to Cloudflare services.

**Authentication:** Required (any authenticated user)

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "tags": ["string"] (optional),
  "assetType": "IMAGE | VIDEO | DOCUMENT | LINK (required)",
  "uploadType": "SEO | DOC (required)",
  "companyId": "string (required for SEO uploads)",
  "fileName": "string (required for non-LINK assets)",
  "contentType": "string (required for non-LINK assets)",
  "targetPlatforms": ["string"] (optional),
  "campaignName": "string (optional)",
  "visibility": "VisibilityLevel (optional, Admin only)",
  "url": "string (optional, for LINK type)"
}
```

**Response:**
```json
{
  "assetId": "string",
  "uploadUrl": "string (not provided for LINK type)",
  "storageUrl": "string",
  "expiresAt": "string (ISO 8601)"
}
```

**Business Logic:**
- For SEO uploads: requires `companyId`, creates asset with `visibility = ADMIN_ONLY` (unless Admin specifies otherwise), `status = DRAFT`
- For Doc uploads: creates asset with `visibility = UPLOADER_ONLY`, `status = DRAFT`, `companyId = null`
- Admin can specify custom visibility level
- Returns presigned URL for R2, Stream, or Images based on `assetType`

### POST /api/assets/complete

Complete upload and finalize asset record after file is uploaded to storage.

**Authentication:** Required (must be the uploader)

**Request Body:**
```json
{
  "assetId": "string (required)",
  "storagePath": "string (optional)",
  "metadata": {
    "size": "number (optional)",
    "width": "number (optional)",
    "height": "number (optional)",
    "duration": "number (optional)"
  },
  "submitForReview": "boolean (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "asset": {
    "id": "string",
    "title": "string",
    "description": "string",
    "tags": ["string"],
    "assetType": "string",
    "uploadType": "string",
    "status": "string",
    "visibility": "string",
    "companyId": "string",
    "uploaderId": "string",
    "storageUrl": "string",
    "fileSize": "number",
    "mimeType": "string",
    "uploadedAt": "string",
    "targetPlatforms": ["string"],
    "campaignName": "string"
  }
}
```

**Business Logic:**
- Updates asset metadata (file size, storage path, etc.)
- If `submitForReview = true` and `uploadType = SEO`: sets `status = PENDING_REVIEW` and notifies all Admins
- If `submitForReview = false` or not provided: keeps `status = DRAFT`
- Creates audit log entry

### POST /api/assets

Create asset record after upload (alternative to presign/complete flow).

**Authentication:** Required (any authenticated user)

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "tags": ["string"] (optional),
  "assetType": "IMAGE | VIDEO | DOCUMENT | LINK (required)",
  "uploadType": "SEO | DOC (required)",
  "companyId": "string (required for SEO uploads)",
  "storageUrl": "string (required for non-LINK assets)",
  "fileSize": "number (optional)",
  "mimeType": "string (optional)",
  "targetPlatforms": ["string"] (optional),
  "campaignName": "string (optional)",
  "submitForReview": "boolean (optional)",
  "visibility": "VisibilityLevel (optional, Admin only)",
  "url": "string (optional, for LINK type)"
}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "assetType": "string",
  "uploadType": "string",
  "status": "string",
  "visibility": "string",
  "companyId": "string",
  "uploaderId": "string",
  "storageUrl": "string",
  "fileSize": "number",
  "mimeType": "string",
  "uploadedAt": "string",
  "targetPlatforms": ["string"],
  "campaignName": "string"
}
```

### GET /api/assets

List assets with role-based filtering.

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `uploadType`: SEO | DOC (optional)
- `status`: DRAFT | PENDING_REVIEW | APPROVED | REJECTED (optional)
- `companyId`: string (optional)

**Response:**
```json
{
  "assets": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "tags": ["string"],
      "assetType": "string",
      "uploadType": "string",
      "status": "string",
      "visibility": "string",
      "companyId": "string",
      "uploaderId": "string",
      "storageUrl": "string",
      "fileSize": "number",
      "mimeType": "string",
      "uploadedAt": "string",
      "targetPlatforms": ["string"],
      "campaignName": "string"
    }
  ],
  "total": "number"
}
```

**Role-based Filtering:**
- **Admin**: See all SEO assets, but not UPLOADER_ONLY Doc assets unless explicitly shared
- **Content_Creator**: See own uploads and assets shared with them
- **SEO_Specialist**: See own uploads and APPROVED assets they have permission to see

### GET /api/assets/[id]

Get asset by ID.

**Authentication:** Required (must have permission to view)

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "assetType": "string",
  "uploadType": "string",
  "status": "string",
  "visibility": "string",
  "companyId": "string",
  "company": {
    "id": "string",
    "name": "string"
  },
  "uploaderId": "string",
  "uploader": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  },
  "storageUrl": "string",
  "fileSize": "number",
  "mimeType": "string",
  "uploadedAt": "string",
  "approvedAt": "string",
  "approvedById": "string",
  "rejectedAt": "string",
  "rejectedById": "string",
  "rejectionReason": "string",
  "targetPlatforms": ["string"],
  "campaignName": "string"
}
```

### PATCH /api/assets/[id]

Update asset metadata.

**Authentication:** Required (must be the uploader)

**Request Body (all fields optional):**
```json
{
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "targetPlatforms": ["string"],
  "campaignName": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "assetType": "string",
  "uploadType": "string",
  "status": "string",
  "visibility": "string",
  "companyId": "string",
  "uploaderId": "string",
  "storageUrl": "string",
  "fileSize": "number",
  "mimeType": "string",
  "uploadedAt": "string",
  "targetPlatforms": ["string"],
  "campaignName": "string"
}
```

**Validation:**
- Description: max 1000 characters (Requirement 17.1)
- Tags: max 20 tags (Requirement 17.2)

### DELETE /api/assets/[id]

Delete asset.

**Authentication:** Required (must be the uploader or Admin)

**Response:**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

### GET /api/seo/assets

List approved assets for SEO Specialists.

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `company`: string (optional filter)
- `platform`: string (optional filter)

**Response:**
```json
{
  "assets": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "tags": ["string"],
      "assetType": "string",
      "uploadType": "string",
      "status": "string",
      "visibility": "string",
      "companyId": "string",
      "company": {
        "id": "string",
        "name": "string"
      },
      "uploaderId": "string",
      "uploader": {
        "id": "string",
        "email": "string",
        "name": "string",
        "role": "string"
      },
      "storageUrl": "string",
      "fileSize": "number",
      "mimeType": "string",
      "uploadedAt": "string",
      "approvedAt": "string",
      "targetPlatforms": ["string"],
      "campaignName": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Business Logic:**
- Returns only assets with `status = APPROVED`
- Filters by visibility rules (COMPANY, ROLE, SELECTED_USERS, PUBLIC)
- Excludes UPLOADER_ONLY and ADMIN_ONLY assets (unless user is uploader)

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "fields": {
    "fieldName": "Error message"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized - Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden - Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Asset not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to perform operation"
}
```

## Visibility Levels

The system supports 7 visibility levels:

1. **UPLOADER_ONLY**: Only the uploader can see the asset
2. **ADMIN_ONLY**: Admin and uploader can see the asset
3. **COMPANY**: All users in the asset's company can see it
4. **TEAM**: All users in the asset's team can see it
5. **ROLE**: All users with a specific role can see it
6. **SELECTED_USERS**: Only explicitly selected users can see it
7. **PUBLIC**: All authenticated users can see it

## Upload Types

### SEO Upload
- Requires company selection
- Default visibility: ADMIN_ONLY (for non-Admin users)
- Admin can choose any visibility level
- Supports "Save Draft" (status = DRAFT) and "Submit for Review" (status = PENDING_REVIEW)
- Notifies all Admins when submitted for review

### Doc Upload
- No company required
- Visibility: UPLOADER_ONLY (always)
- Status: DRAFT (always)
- Private to the uploader by default

## Asset Types

1. **IMAGE**: Stored in Cloudflare Images
2. **VIDEO**: Stored in Cloudflare Stream
3. **DOCUMENT**: Stored in Cloudflare R2
4. **LINK**: No storage needed, URL stored directly

## Audit Logging

All asset operations are logged in the audit log with:
- User ID
- Action type (CREATE, UPDATE, DELETE)
- Resource type (ASSET)
- Resource ID (asset ID)
- Metadata (changes, previous values, etc.)
- IP address
- User agent
- Timestamp

## Examples

### Example 1: Upload SEO Asset (Content Creator)

1. **Get presigned URL:**
```bash
POST /api/assets/presign
{
  "title": "Product Launch Banner",
  "description": "Banner for Q1 product launch",
  "tags": ["product", "launch", "banner"],
  "assetType": "IMAGE",
  "uploadType": "SEO",
  "companyId": "company-123",
  "fileName": "banner.png",
  "contentType": "image/png",
  "targetPlatforms": ["LINKEDIN", "X"],
  "campaignName": "Q1 Launch"
}
```

2. **Upload file to presigned URL** (client-side)

3. **Complete upload:**
```bash
POST /api/assets/complete
{
  "assetId": "asset-456",
  "metadata": {
    "size": 245678,
    "width": 1200,
    "height": 630
  },
  "submitForReview": true
}
```

### Example 2: Upload Doc Asset

1. **Get presigned URL:**
```bash
POST /api/assets/presign
{
  "title": "Meeting Notes",
  "description": "Notes from team meeting",
  "assetType": "DOCUMENT",
  "uploadType": "DOC",
  "fileName": "notes.pdf",
  "contentType": "application/pdf"
}
```

2. **Upload file to presigned URL** (client-side)

3. **Complete upload:**
```bash
POST /api/assets/complete
{
  "assetId": "asset-789",
  "metadata": {
    "size": 123456
  }
}
```

### Example 3: List Approved SEO Assets

```bash
GET /api/seo/assets?page=1&limit=20&company=company-123
```

## Notes

- All endpoints require authentication via NextAuth.js
- IP address and user agent are automatically extracted for audit logging
- File uploads use presigned URLs for direct upload to Cloudflare services
- Asset visibility is enforced at the API level based on user role and permissions
- Metadata validation is performed by the AssetService
