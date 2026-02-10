# Design Document: Carousel Asset Management

## Overview

The Carousel Asset Management feature extends the existing asset management system to support grouped assets (carousels). A carousel is a container that holds multiple related assets (images/videos) under a single company, sharing common metadata like campaign name, platforms, and tags. This design introduces a parent-child relationship in the Asset model, extends the approval workflow to support granular carousel approval, and maintains role-based visibility rules.

### Key Design Decisions

1. **Single Table Inheritance**: Use the existing Asset table with a self-referential `parentCarouselId` field rather than creating a separate Carousel table. This simplifies queries and maintains consistency with existing asset operations.

2. **Carousel as Asset Type**: Add CAROUSEL to the AssetType enum. Carousel "containers" are assets with type CAROUSEL, while child assets maintain their original types (IMAGE, VIDEO).

3. **Granular Approval**: Support both bulk approval (entire carousel) and individual asset approval within carousels, with automatic status calculation for the parent carousel.

4. **Hierarchical Organization**: Implement a three-level hierarchy (Company → Carousel → Assets) in the UI while maintaining flat database queries with filtering.

5. **Download Tracking**: Extend existing AssetDownload records to track carousel asset downloads, maintaining the parent-child relationship for reporting.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Upload Form  │  Asset Browser  │  Approval UI  │  Downloads │
│  (Carousel)   │  (Hierarchy)    │  (Granular)   │  (Tracking)│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  POST /api/carousels          - Create carousel with assets  │
│  GET /api/carousels           - List carousels (filtered)    │
│  GET /api/carousels/[id]      - Get carousel with children   │
│  DELETE /api/carousels/[id]   - Delete carousel + children   │
│  DELETE /api/assets/[id]      - Delete individual asset      │
│  POST /api/approvals/carousel - Approve/reject carousel      │
│  POST /api/approvals/asset    - Approve/reject single asset  │
│  GET /api/downloads/history   - Get download history         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
├─────────────────────────────────────────────────────────────┤
│  CarouselService    - Carousel CRUD, status calculation      │
│  AssetService       - Extended for carousel children         │
│  ApprovalService    - Extended for granular approval         │
│  DownloadService    - Extended for carousel tracking         │
│  VisibilityChecker  - Extended for carousel visibility       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Asset (extended)   - parentCarouselId field                 │
│  AssetDownload      - Tracks carousel asset downloads        │
│  Approval           - Tracks carousel/asset approvals        │
│  Company            - Groups carousels                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Storage Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Cloudflare R2      - Stores individual asset files          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Carousel Upload Flow:**
1. Content Creator selects CAROUSEL type in upload form
2. Uploads multiple files (images/videos) with shared metadata
3. Frontend sends POST to `/api/carousels` with files and metadata
4. CarouselService creates parent carousel asset (type: CAROUSEL)
5. CarouselService creates child assets with parentCarouselId reference
6. Files uploaded to R2, URLs stored in child asset records
7. Parent carousel status set to PENDING_REVIEW
8. Audit log records carousel creation

**Approval Flow:**
1. Admin views pending carousels in approval UI
2. Admin can approve/reject entire carousel or individual assets
3. For bulk approval: ApprovalService updates all child assets to APPROVED
4. For individual approval: ApprovalService updates single asset
5. CarouselService recalculates parent carousel status
6. Audit log records approval actions
7. Notifications sent to content creator

**Download Flow:**
1. SEO Specialist browses approved carousels
2. Selects individual asset or entire carousel for download
3. DownloadService creates AssetDownload records
4. For carousel download: creates records for each child asset
5. Download history includes parent carousel reference
6. Content Creator can view downloads in "Downloaded Assets" page

## Components and Interfaces

### Database Schema Extensions

```prisma
model Asset {
  id              String          @id @default(cuid())
  title           String
  description     String?
  tags            String[]
  assetType       AssetType       // Extended to include CAROUSEL
  uploadType      UploadType
  status          AssetStatus     @default(DRAFT)
  visibility      VisibilityLevel @default(UPLOADER_ONLY)
  companyId       String?
  uploaderId      String
  storageUrl      String          // Empty for CAROUSEL type
  fileSize        Int?            // Null for CAROUSEL type
  mimeType        String?         // Null for CAROUSEL type
  uploadedAt      DateTime        @default(now())
  approvedAt      DateTime?
  approvedById    String?
  rejectedAt      DateTime?
  rejectedById    String?
  rejectionReason String?
  targetPlatforms String[]
  campaignName    String?
  allowedRole     UserRole?
  
  // NEW: Carousel relationship
  parentCarouselId String?        // References parent carousel asset
  parentCarousel   Asset?         @relation("CarouselChildren", fields: [parentCarouselId], references: [id], onDelete: Cascade)
  childAssets      Asset[]        @relation("CarouselChildren")
  
  // Existing relations...
  Approval        Approval[]
  approvedBy      User?           @relation("Asset_approvedByIdToUser", fields: [approvedById], references: [id])
  Company         Company?        @relation(fields: [companyId], references: [id])
  rejectedBy      User?           @relation("Asset_rejectedByIdToUser", fields: [rejectedById], references: [id])
  uploader        User            @relation("Asset_uploaderIdToUser", fields: [uploaderId], references: [id])
  AssetDownload   AssetDownload[]
  AssetShare      AssetShare[]
  AssetVersion    AssetVersion[]
  AuditLog        AuditLog[]
  PlatformUsage   PlatformUsage[]

  @@index([companyId])
  @@index([status])
  @@index([uploaderId])
  @@index([visibility])
  @@index([parentCarouselId])  // NEW: Index for carousel queries
}

enum AssetType {
  IMAGE
  VIDEO
  DOCUMENT
  LINK
  CAROUSEL  // NEW
}
```

### CarouselService Interface

```typescript
interface CreateCarouselParams {
  title: string;
  description?: string;
  tags?: string[];
  companyId: string;
  uploaderId: string;
  targetPlatforms?: string[];
  campaignName?: string;
  childAssets: CreateCarouselChildParams[];
  submitForReview?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

interface CreateCarouselChildParams {
  title: string;
  assetType: 'IMAGE' | 'VIDEO';
  storageUrl: string;
  fileSize?: number;
  mimeType?: string;
}

interface CarouselResult {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  assetType: 'CAROUSEL';
  status: AssetStatus;
  companyId: string;
  uploaderId: string;
  uploadedAt: Date;
  targetPlatforms: string[];
  campaignName?: string;
  childAssets: CarouselChildResult[];
}

interface CarouselChildResult {
  id: string;
  title: string;
  assetType: 'IMAGE' | 'VIDEO';
  status: AssetStatus;
  storageUrl: string;
  fileSize?: number;
  mimeType?: string;
  parentCarouselId: string;
}

class CarouselService {
  // Create carousel with child assets
  async createCarousel(params: CreateCarouselParams): Promise<CarouselResult>
  
  // Get carousel with children
  async getCarouselById(carouselId: string, user: User): Promise<CarouselResult | null>
  
  // List carousels for user (role-based filtering)
  async listCarousels(user: User, filters?: CarouselFilters): Promise<CarouselResult[]>
  
  // Delete carousel and all children
  async deleteCarousel(carouselId: string, user: User): Promise<void>
  
  // Calculate carousel status based on children
  async calculateCarouselStatus(carouselId: string): Promise<AssetStatus>
  
  // Get child assets for carousel
  async getCarouselChildren(carouselId: string): Promise<CarouselChildResult[]>
}
```

### Extended ApprovalService Interface

```typescript
interface ApproveCarouselParams {
  carouselId: string;
  reviewerId: string;
  approveAll: boolean;  // If true, approve all children
  assetIds?: string[];  // If approveAll false, specific asset IDs
  ipAddress?: string;
  userAgent?: string;
}

interface RejectCarouselParams {
  carouselId: string;
  reviewerId: string;
  rejectAll: boolean;   // If true, reject all children
  assetIds?: string[];  // If rejectAll false, specific asset IDs
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

class ApprovalService {
  // Existing methods...
  async approveAsset(params: ApproveAssetParams): Promise<ApprovalResult>
  async rejectAsset(params: RejectAssetParams): Promise<ApprovalResult>
  
  // NEW: Carousel approval methods
  async approveCarousel(params: ApproveCarouselParams): Promise<CarouselApprovalResult>
  async rejectCarousel(params: RejectCarouselParams): Promise<CarouselApprovalResult>
  async approveCarouselAsset(carouselId: string, assetId: string, reviewerId: string): Promise<ApprovalResult>
  async rejectCarouselAsset(carouselId: string, assetId: string, reviewerId: string, reason: string): Promise<ApprovalResult>
}
```

### Extended DownloadService Interface

```typescript
interface DownloadCarouselParams {
  carouselId: string;
  downloadedById: string;
  platformIntent?: Platform;
  ipAddress?: string;
  userAgent?: string;
}

class DownloadService {
  // Existing methods...
  async initiateDownload(params: InitiateDownloadParams): Promise<DownloadResponse>
  
  // NEW: Carousel download methods
  async downloadCarousel(params: DownloadCarouselParams): Promise<CarouselDownloadResult>
  async getCarouselDownloadHistory(userId: string): Promise<CarouselDownloadHistory[]>
}
```

### API Endpoints

**Carousel Management:**
- `POST /api/carousels` - Create carousel with child assets
- `GET /api/carousels` - List carousels (role-based filtering)
- `GET /api/carousels/[id]` - Get carousel with children
- `DELETE /api/carousels/[id]` - Delete carousel and children
- `DELETE /api/carousels/[carouselId]/assets/[assetId]` - Delete single child asset

**Carousel Approval:**
- `POST /api/admin/approvals/carousel/[id]/approve` - Approve entire carousel
- `POST /api/admin/approvals/carousel/[id]/reject` - Reject entire carousel
- `POST /api/admin/approvals/carousel/[carouselId]/assets/[assetId]/approve` - Approve single asset
- `POST /api/admin/approvals/carousel/[carouselId]/assets/[assetId]/reject` - Reject single asset

**Download Tracking:**
- `POST /api/downloads/carousel/[id]` - Download entire carousel
- `GET /api/downloads/history/carousels` - Get carousel download history

## Data Models

### Carousel Status Calculation Logic

The parent carousel status is derived from its child assets:

```typescript
function calculateCarouselStatus(childAssets: Asset[]): AssetStatus {
  if (childAssets.length === 0) {
    return AssetStatus.DRAFT;
  }
  
  const statuses = childAssets.map(asset => asset.status);
  const allApproved = statuses.every(s => s === AssetStatus.APPROVED);
  const allRejected = statuses.every(s => s === AssetStatus.REJECTED);
  const hasPending = statuses.some(s => s === AssetStatus.PENDING_REVIEW);
  
  if (allApproved) {
    return AssetStatus.APPROVED;
  } else if (allRejected) {
    return AssetStatus.REJECTED;
  } else if (hasPending) {
    return AssetStatus.PENDING_REVIEW;
  } else {
    // Mix of approved and rejected
    return AssetStatus.PENDING_REVIEW;
  }
}
```

### Carousel Visibility Rules

Carousel visibility follows the same rules as regular assets, with additional filtering:

**Content Creator:**
- See only carousels they uploaded
- See all statuses (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)

**Admin:**
- See all carousels regardless of status or uploader
- Can view and manage all child assets

**SEO Specialist:**
- See only carousels with at least one APPROVED child asset
- Within carousels, see only APPROVED child assets
- Cannot see PENDING_REVIEW or REJECTED carousels

### Download Tracking Model

```typescript
interface CarouselDownloadRecord {
  carouselId: string;
  carouselTitle: string;
  downloadedAssets: {
    assetId: string;
    assetTitle: string;
    assetType: AssetType;
    downloadId: string;
    downloadedAt: Date;
    platformIntent?: Platform;
  }[];
  downloadedById: string;
  downloadedBy: {
    id: string;
    name: string;
    email: string;
  };
  companyId: string;
  companyName: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Carousel Parent-Child Referential Integrity

*For any* carousel asset, all child assets must reference the carousel as their parentCarouselId, the carousel must have no parent itself (parentCarouselId is null), and all parent-child references must be valid (no orphaned children or invalid parent IDs).

**Validates: Requirements 2.3, 8.3, 8.6**

### Property 2: Carousel Status Calculation

*For any* carousel, the carousel status must equal APPROVED when all children are APPROVED, REJECTED when all children are REJECTED, and PENDING_REVIEW in all other cases (including mixed statuses, empty carousel, or any pending children).

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 5.11**

### Property 3: Carousel Child Asset Type Validation

*For any* carousel, all child assets must have assetType of either IMAGE or VIDEO, never DOCUMENT, LINK, or CAROUSEL.

**Validates: Requirements 1.4, 2.7**

### Property 4: Carousel Company and Metadata Inheritance

*For any* carousel, it must be associated with exactly one company, and all child assets must inherit the same companyId, targetPlatforms, campaignName, and tags as the parent carousel.

**Validates: Requirements 1.3, 1.5, 2.5**

### Property 5: Carousel Cascade Deletion

*For any* carousel, when the carousel is deleted, all child assets must also be deleted from both database and storage (R2).

**Validates: Requirements 4.5, 8.5**

### Property 6: Individual Asset Deletion Preserves Carousel

*For any* child asset within a carousel, when that asset is deleted, the parent carousel and all other child assets must remain unchanged (except for parent status recalculation).

**Validates: Requirements 4.3, 7.6**

### Property 7: Granular Carousel Approval

*For any* carousel in PENDING_REVIEW status, approving or rejecting individual child assets must update only those specific assets' statuses while leaving other child assets unchanged.

**Validates: Requirements 5.8, 5.10**

### Property 8: Bulk Carousel Approval

*For any* carousel in PENDING_REVIEW status, bulk approval must set all child assets to APPROVED status and the carousel status to APPROVED.

**Validates: Requirements 5.4**

### Property 9: Bulk Carousel Rejection

*For any* carousel in PENDING_REVIEW status, bulk rejection must set all child assets to REJECTED status with the same rejection reason and the carousel status to REJECTED.

**Validates: Requirements 5.6**

### Property 10: SEO Specialist Carousel Visibility

*For any* SEO Specialist user, querying carousels must return only carousels that contain at least one child asset with status APPROVED, and within those carousels, only APPROVED child assets must be visible.

**Validates: Requirements 6.2, 6.3, 6.4, 10.3**

### Property 11: Content Creator Carousel Ownership

*For any* Content Creator user, querying carousels must return only carousels they uploaded, regardless of status.

**Validates: Requirements 4.1, 10.1**

### Property 12: Admin Carousel Visibility

*For any* Admin user, querying carousels must return all carousels regardless of status, uploader, or company.

**Validates: Requirements 10.2**

### Property 13: Carousel Download Record Creation

*For any* carousel asset download by an SEO Specialist, an AssetDownload record must be created with the asset ID, downloader ID, timestamp, and platform intent, and the record must be visible in the Content Creator's "Downloaded Assets" page with parent carousel information.

**Validates: Requirements 6.7, 9.1, 4.6, 4.7, 4.8, 9.2**

### Property 14: Bulk Carousel Download Tracking

*For any* carousel download (downloading all approved assets), a separate AssetDownload record must be created for each child asset with individual timestamps.

**Validates: Requirements 6.8, 9.5**

### Property 15: Carousel Minimum Child Count Validation

*For any* carousel creation request, it must include at least one child asset, otherwise the creation must fail with a validation error.

**Validates: Requirements 2.6**

### Property 16: Carousel Query Filtering

*For any* company, querying assets must return both regular assets and carousel folders, and querying a specific carousel by parentCarouselId must return only its child assets.

**Validates: Requirements 3.2, 3.3, 8.3, 8.4**

### Property 17: Pending Approvals Categorization

*For any* Admin viewing pending approvals, the results must be divided into two distinct categories: Regular Assets (parentCarouselId is null and assetType is not CAROUSEL) and Carousels (assetType is CAROUSEL).

**Validates: Requirements 5.1**

### Property 18: Carousel Upload Type Restriction

*For any* carousel, it must have uploadType of SEO, never DOC.

**Validates: Requirements 1.1, 2.1**

### Property 19: Carousel Storage and Database Consistency

*For any* carousel creation, each child asset file must be stored in Cloudflare R2 and the storageUrl must be recorded in the database, while the parent carousel asset must have an empty or placeholder storageUrl.

**Validates: Requirements 2.1, 2.2**

### Property 20: Company Rename Propagation

*For any* company name change by an Admin, all subsequent queries for carousels and assets associated with that company must reflect the updated company name.

**Validates: Requirements 5.12**

## Error Handling

### Validation Errors

**Carousel Creation:**
- Empty child assets array → 400 Bad Request: "Carousel must contain at least one asset"
- Invalid child asset type (DOCUMENT, LINK, CAROUSEL) → 400 Bad Request: "Carousel can only contain IMAGE or VIDEO assets"
- Missing company ID → 400 Bad Request: "Company required for carousel uploads"
- Invalid company ID → 404 Not Found: "Company not found"
- File upload failures → 500 Internal Server Error: "Failed to upload carousel assets"

**Carousel Approval:**
- Carousel not in PENDING_REVIEW → 400 Bad Request: "Carousel must be in PENDING_REVIEW status"
- Empty rejection reason → 400 Bad Request: "Rejection reason is required"
- Invalid asset ID in approval list → 404 Not Found: "Asset not found in carousel"

**Carousel Deletion:**
- Carousel not found → 404 Not Found: "Carousel not found"
- Insufficient permissions → 403 Forbidden: "You do not have permission to delete this carousel"
- Storage deletion failure → 500 Internal Server Error: "Failed to delete carousel files"

**Carousel Download:**
- Carousel not found → 404 Not Found: "Carousel not found"
- No approved assets in carousel → 400 Bad Request: "Carousel contains no approved assets"
- Insufficient permissions → 403 Forbidden: "You do not have permission to download this carousel"

### Database Errors

- Constraint violations (foreign key, unique) → 500 Internal Server Error with audit log
- Transaction failures → Rollback and retry with exponential backoff
- Cascade delete failures → 500 Internal Server Error with detailed logging

### Storage Errors

- R2 upload failures → Rollback database transaction, return 500 error
- R2 deletion failures → Log error, continue with database deletion
- Presigned URL generation failures → 500 Internal Server Error

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests:

**Unit Tests:**
- Specific examples demonstrating correct carousel creation
- Edge cases: empty carousels, single-asset carousels, large carousels
- Error conditions: invalid asset types, missing company, permission failures
- Integration points: API endpoints, service layer interactions
- Status calculation examples with various child asset combinations

**Property-Based Tests:**
- Universal properties across all carousel operations
- Randomized input generation for comprehensive coverage
- Minimum 100 iterations per property test
- Each test references its design document property

### Property Test Configuration

All property tests must:
- Run minimum 100 iterations (due to randomization)
- Reference the design document property number
- Use tag format: **Feature: carousel-asset-management, Property {number}: {property_text}**
- Generate random valid inputs (carousels, assets, users, companies)
- Verify the property holds for all generated inputs

### Test Coverage Areas

**Carousel Creation:**
- Unit tests: Valid carousel with 1, 3, 10 assets; invalid asset types; missing company
- Property tests: Property 3 (child asset types), Property 4 (company association), Property 5 (metadata inheritance), Property 14 (minimum child count)

**Carousel Status Management:**
- Unit tests: All approved, all rejected, mixed statuses, empty carousel
- Property tests: Property 2 (status consistency), Property 15 (status recalculation)

**Carousel Approval:**
- Unit tests: Bulk approve, bulk reject, individual approve, individual reject
- Property tests: Property 8 (approval granularity), Property 9 (bulk approval), Property 10 (bulk rejection)

**Carousel Deletion:**
- Unit tests: Delete carousel, delete individual asset, permission checks
- Property tests: Property 6 (deletion cascade), Property 7 (individual deletion)

**Carousel Visibility:**
- Unit tests: Content creator view, admin view, SEO specialist view
- Property tests: Property 11 (SEO specialist visibility), Property 10 (role-based permissions)

**Download Tracking:**
- Unit tests: Download single asset, download carousel, view download history
- Property tests: Property 12 (content creator tracking), Property 13 (carousel download tracking)

### Testing Tools

- **Unit Testing**: Vitest for TypeScript/JavaScript tests
- **Property-Based Testing**: fast-check library for TypeScript
- **Database Testing**: In-memory SQLite or test PostgreSQL instance
- **API Testing**: Supertest for HTTP endpoint testing
- **Mocking**: Vitest mocks for external services (R2, notifications)
