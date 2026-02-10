# Requirements Document

## Introduction

The Carousel Asset Management feature extends the existing asset management system to support grouped assets (carousels) that can be uploaded, managed, and downloaded as collections. This feature enables content creators to upload multiple related assets as a single unit, provides admins with granular approval controls over carousel contents, and allows SEO specialists to download and track carousel assets. The system maintains a hierarchical organization structure (Company → Carousel → Individual Assets) while preserving existing functionality for regular assets.

## Glossary

- **System**: The asset management application built with Next.js, Prisma ORM, PostgreSQL, and Cloudflare R2
- **Carousel**: A container asset type that groups multiple individual assets (images/videos) under a single company and shares common metadata
- **Content_Creator**: A user with role CONTENT_CREATOR who can upload assets and carousels
- **Admin**: A user with role ADMIN who reviews and approves/rejects assets and carousels
- **SEO_Specialist**: A user with role SEO_SPECIALIST who downloads approved assets for platform usage
- **Regular_Asset**: An asset of type IMAGE, VIDEO, DOCUMENT, or LINK (non-carousel)
- **Carousel_Asset**: An individual asset (image or video) that belongs to a carousel container
- **Asset_Hierarchy**: The organizational structure: Company → Carousel → Individual Assets
- **Download_Tracking**: Recording which assets were downloaded, by whom, when, and for which platform
- **Pending_Approvals**: Assets or carousels awaiting admin review with status PENDING_REVIEW
- **Approval_Granularity**: The ability to approve or reject entire carousels or individual assets within carousels

## Requirements

### Requirement 1: Carousel Asset Type Addition

**User Story:** As a content creator, I want to select "Carousel" as an asset type during upload, so that I can group multiple related assets together under a single company.

#### Acceptance Criteria

1. WHEN a Content_Creator accesses the upload form, THE System SHALL display CAROUSEL as an available AssetType option alongside IMAGE, VIDEO, DOCUMENT, and LINK
2. WHEN a Content_Creator selects the CAROUSEL asset type, THE System SHALL present an interface for uploading multiple assets
3. WHEN uploading a carousel, THE System SHALL require association with exactly one company
4. WHEN uploading a carousel, THE System SHALL accept only IMAGE and VIDEO asset types as carousel contents
5. WHEN a Content_Creator uploads a carousel with multiple assets, THE System SHALL apply the same metadata (company, campaign, platforms, tags, description) to all assets within the carousel

### Requirement 2: Carousel Upload and Storage

**User Story:** As a content creator, I want to upload multiple assets as a carousel, so that related assets are grouped together and share common metadata.

#### Acceptance Criteria

1. WHEN a Content_Creator uploads a carousel, THE System SHALL create a parent carousel record in the database
2. WHEN a Content_Creator uploads assets to a carousel, THE System SHALL store each asset file in Cloudflare R2
3. WHEN storing carousel assets, THE System SHALL maintain a relationship between the parent carousel and each child asset
4. WHEN a carousel is created, THE System SHALL assign it a status of PENDING_REVIEW
5. WHEN a carousel is created, THE System SHALL record the uploader, upload timestamp, and associated company
6. WHEN uploading carousel assets, THE System SHALL validate that at least one asset is included in the carousel
7. WHEN uploading carousel assets, THE System SHALL validate file types and sizes according to existing asset validation rules

### Requirement 3: Asset Hierarchy and Organization

**User Story:** As a user, I want to see assets organized in a hierarchy of Company → Carousel → Individual Assets, so that I can easily navigate and manage grouped assets.

#### Acceptance Criteria

1. WHEN viewing the assets page, THE System SHALL display company folders as the top-level organization
2. WHEN a user opens a company folder, THE System SHALL display both regular assets and carousel folders for that company
3. WHEN a user opens a carousel folder, THE System SHALL display all individual assets contained within that carousel
4. WHEN displaying carousels in the hierarchy, THE System SHALL show carousel metadata (title, description, upload date, status)
5. WHEN displaying assets within a carousel, THE System SHALL indicate the parent carousel relationship
6. WHEN a carousel contains no assets, THE System SHALL display an empty state message

### Requirement 4: Content Creator Carousel Management

**User Story:** As a content creator, I want to manage my uploaded carousels and view download tracking, so that I can maintain my content and understand its usage.

#### Acceptance Criteria

1. WHEN a Content_Creator views their uploaded carousels, THE System SHALL display all carousels they have uploaded regardless of status
2. WHEN a Content_Creator selects an individual asset within their carousel, THE System SHALL allow deletion of that specific asset
3. WHEN a Content_Creator deletes an individual asset from a carousel, THE System SHALL remove only that asset and preserve the carousel and remaining assets
4. WHEN a Content_Creator selects a carousel, THE System SHALL allow deletion of the entire carousel
5. WHEN a Content_Creator deletes a carousel, THE System SHALL remove the carousel and all contained assets from storage and database
6. WHEN a Content_Creator accesses the "Downloaded Assets" page from side navigation, THE System SHALL display all their assets (regular and carousel) that have been downloaded by SEO_Specialist users
7. WHEN displaying downloaded assets, THE System SHALL show the platform the asset was downloaded for, download date, and the SEO_Specialist who downloaded it
8. WHEN displaying a downloaded carousel asset, THE System SHALL provide a link back to the parent carousel

### Requirement 5: Admin Approval Workflow for Carousels

**User Story:** As an admin, I want to review and approve carousels with granular control over individual assets, so that I can ensure quality standards while maintaining flexibility.

#### Acceptance Criteria

1. WHEN an Admin accesses the Pending Approvals page, THE System SHALL divide pending items into two categories: Regular Assets and Carousels
2. WHEN an Admin views a pending carousel, THE System SHALL display it as a folder showing all contained assets
3. WHEN an Admin selects a pending carousel, THE System SHALL provide an option to approve the entire carousel
4. WHEN an Admin approves an entire carousel, THE System SHALL set the status of the carousel and all contained assets to APPROVED
5. WHEN an Admin selects a pending carousel, THE System SHALL provide an option to reject the entire carousel
6. WHEN an Admin rejects an entire carousel, THE System SHALL set the status of the carousel and all contained assets to REJECTED and record the rejection reason
7. WHEN an Admin views assets within a pending carousel, THE System SHALL provide options to approve individual assets
8. WHEN an Admin approves an individual asset within a carousel, THE System SHALL set that asset's status to APPROVED while leaving other assets unchanged
9. WHEN an Admin views assets within a pending carousel, THE System SHALL provide options to reject individual assets
10. WHEN an Admin rejects an individual asset within a carousel, THE System SHALL set that asset's status to REJECTED and record the rejection reason while leaving other assets unchanged
11. WHEN an Admin approves or rejects carousel assets, THE System SHALL update the carousel's overall status based on the status of its contained assets
12. WHEN an Admin views a company name, THE System SHALL provide the ability to rename that company

### Requirement 6: SEO Specialist Carousel Access and Download

**User Story:** As an SEO specialist, I want to view and download approved carousel assets, so that I can use them for platform campaigns.

#### Acceptance Criteria

1. WHEN an SEO_Specialist views the assets page, THE System SHALL display both regular assets and carousels
2. WHEN displaying carousels to SEO_Specialist users, THE System SHALL show only carousels that contain at least one approved asset
3. WHEN displaying carousels to SEO_Specialist users, THE System SHALL hide carousels with status PENDING_REVIEW or REJECTED
4. WHEN an SEO_Specialist opens a carousel folder, THE System SHALL display only the approved assets within that carousel
5. WHEN an SEO_Specialist selects an individual asset from a carousel, THE System SHALL allow download of that specific asset
6. WHEN an SEO_Specialist selects a carousel, THE System SHALL provide an option to download all approved assets in the carousel
7. WHEN an SEO_Specialist downloads an asset from a carousel, THE System SHALL record the download with asset ID, downloader ID, timestamp, and platform intent
8. WHEN an SEO_Specialist downloads multiple assets from a carousel, THE System SHALL create separate download records for each asset
9. WHEN an SEO_Specialist downloads a carousel asset, THE System SHALL maintain the relationship to the parent carousel in download tracking

### Requirement 7: Carousel Status Management

**User Story:** As the system, I want to maintain consistent status across carousels and their contained assets, so that the approval workflow remains coherent.

#### Acceptance Criteria

1. WHEN a carousel is created, THE System SHALL set its status to PENDING_REVIEW
2. WHEN all assets in a carousel are approved, THE System SHALL set the carousel status to APPROVED
3. WHEN all assets in a carousel are rejected, THE System SHALL set the carousel status to REJECTED
4. WHEN a carousel contains a mix of approved, rejected, and pending assets, THE System SHALL set the carousel status to PENDING_REVIEW
5. WHEN the last pending asset in a carousel is approved or rejected, THE System SHALL update the carousel status accordingly
6. WHEN an asset is deleted from a carousel, THE System SHALL recalculate the carousel status based on remaining assets

### Requirement 8: Database Schema Extensions

**User Story:** As a developer, I want the database schema to support carousel relationships, so that the system can store and query carousel data efficiently.

#### Acceptance Criteria

1. THE System SHALL add CAROUSEL to the AssetType enum
2. THE System SHALL add a parentCarouselId field to the Asset model to establish parent-child relationships
3. WHEN querying assets, THE System SHALL support filtering by parentCarouselId to retrieve carousel contents
4. WHEN querying carousels, THE System SHALL support including child assets in the query results
5. WHEN deleting a carousel, THE System SHALL cascade delete all child assets through database constraints
6. THE System SHALL maintain referential integrity between carousel parents and child assets

### Requirement 9: Download Tracking for Carousel Assets

**User Story:** As a content creator, I want to see which carousel assets were downloaded, so that I can understand the usage and value of my grouped content.

#### Acceptance Criteria

1. WHEN an asset from a carousel is downloaded, THE System SHALL create an AssetDownload record with the asset ID
2. WHEN displaying download history for carousel assets, THE System SHALL include the parent carousel information
3. WHEN a Content_Creator views the "Downloaded Assets" page, THE System SHALL group carousel asset downloads by parent carousel
4. WHEN displaying carousel download information, THE System SHALL show which specific assets from the carousel were downloaded
5. WHEN an SEO_Specialist downloads multiple assets from the same carousel, THE System SHALL record each download separately with timestamps

### Requirement 10: Carousel Visibility and Permissions

**User Story:** As the system, I want to enforce role-based access control for carousels, so that users only see carousels appropriate for their role.

#### Acceptance Criteria

1. WHEN a Content_Creator views carousels, THE System SHALL show only carousels they uploaded
2. WHEN an Admin views carousels, THE System SHALL show all carousels regardless of status or uploader
3. WHEN an SEO_Specialist views carousels, THE System SHALL show only carousels containing at least one approved asset
4. WHEN determining carousel visibility, THE System SHALL apply the same company-based filtering as regular assets
5. WHEN a user lacks permission to view a carousel, THE System SHALL exclude it from query results and navigation
