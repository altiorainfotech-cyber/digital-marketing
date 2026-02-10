# Implementation Plan: Carousel Asset Management

## Overview

This implementation plan breaks down the carousel asset management feature into incremental, testable steps. The approach follows a bottom-up strategy: database schema → service layer → API layer → UI components. Each task builds on previous work, with checkpoints to ensure stability before proceeding.

## Tasks

- [-] 1. Database schema migration for carousel support
  - Add CAROUSEL to AssetType enum
  - Add parentCarouselId field to Asset model with self-referential relation
  - Add index on parentCarouselId for query performance
  - Create and run Prisma migration
  - _Requirements: 8.1, 8.2, 8.6_

- [ ] 2. Implement CarouselService for core carousel operations
  - [ ] 2.1 Create CarouselService class with createCarousel method
    - Validate at least one child asset (Requirement 2.6)
    - Validate child asset types are IMAGE or VIDEO only (Requirement 1.4)
    - Validate company association is required (Requirement 1.3)
    - Create parent carousel asset with type CAROUSEL
    - Create child assets with parentCarouselId reference
    - Apply metadata inheritance to all children (Requirement 1.5)
    - Set initial status to PENDING_REVIEW (Requirement 2.4)
    - Integrate with AuditService for logging
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 2.2 Write property test for carousel creation validation
    - **Property 15: Carousel Minimum Child Count Validation**
    - **Validates: Requirements 2.6**
  
  - [ ]* 2.3 Write property test for child asset type validation
    - **Property 3: Carousel Child Asset Type Validation**
    - **Validates: Requirements 1.4, 2.7**
  
  - [ ]* 2.4 Write property test for metadata inheritance
    - **Property 4: Carousel Company and Metadata Inheritance**
    - **Validates: Requirements 1.3, 1.5, 2.5**
  
  - [ ] 2.5 Implement getCarouselById method with permission checking
    - Query carousel with child assets included
    - Apply role-based visibility filtering
    - Return null if carousel not found or no permission
    - _Requirements: 3.3, 10.1, 10.2, 10.3_
  
  - [ ] 2.6 Implement listCarousels method with role-based filtering
    - Content Creator: show only their carousels (Requirement 10.1)
    - Admin: show all carousels (Requirement 10.2)
    - SEO Specialist: show only carousels with approved children (Requirement 10.3)
    - Support filtering by company, status
    - _Requirements: 3.2, 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 2.7 Write property test for SEO Specialist visibility
    - **Property 10: SEO Specialist Carousel Visibility**
    - **Validates: Requirements 6.2, 6.3, 6.4, 10.3**
  
  - [ ]* 2.8 Write property test for Content Creator ownership
    - **Property 11: Content Creator Carousel Ownership**
    - **Validates: Requirements 4.1, 10.1**
  
  - [ ] 2.9 Implement calculateCarouselStatus method
    - All children APPROVED → carousel APPROVED
    - All children REJECTED → carousel REJECTED
    - Any other combination → carousel PENDING_REVIEW
    - Handle empty carousel case
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 2.10 Write property test for status calculation
    - **Property 2: Carousel Status Calculation**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 5.11**
  
  - [ ] 2.11 Implement deleteCarousel method with cascade deletion
    - Check permissions (only uploader or admin can delete)
    - Delete all child assets from database (cascade)
    - Delete all child asset files from R2 storage
    - Delete parent carousel from database
    - Integrate with AuditService for logging
    - _Requirements: 4.4, 4.5, 8.5_
  
  - [ ]* 2.12 Write property test for cascade deletion
    - **Property 5: Carousel Cascade Deletion**
    - **Validates: Requirements 4.5, 8.5**

- [ ] 3. Extend AssetService for carousel child operations
  - [ ] 3.1 Update deleteAsset method to handle carousel children
    - When deleting a child asset, recalculate parent carousel status
    - Verify parent carousel and other children remain unchanged
    - _Requirements: 4.2, 4.3, 7.6_
  
  - [ ]* 3.2 Write property test for individual asset deletion
    - **Property 6: Individual Asset Deletion Preserves Carousel**
    - **Validates: Requirements 4.3, 7.6**
  
  - [ ] 3.3 Update listAssetsWithPermission to include carousel filtering
    - Support filtering by parentCarouselId
    - Apply role-based visibility to carousel children
    - _Requirements: 3.3, 8.3_
  
  - [ ]* 3.4 Write property test for parent-child referential integrity
    - **Property 1: Carousel Parent-Child Referential Integrity**
    - **Validates: Requirements 2.3, 8.3, 8.6**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Extend ApprovalService for granular carousel approval
  - [ ] 5.1 Implement approveCarousel method for bulk approval
    - Validate carousel is in PENDING_REVIEW status
    - Update all child assets to APPROVED status
    - Update carousel status to APPROVED
    - Create Approval records for each child
    - Integrate with AuditService for logging
    - _Requirements: 5.3, 5.4, 5.11_
  
  - [ ]* 5.2 Write property test for bulk approval
    - **Property 8: Bulk Carousel Approval**
    - **Validates: Requirements 5.4**
  
  - [ ] 5.3 Implement rejectCarousel method for bulk rejection
    - Validate carousel is in PENDING_REVIEW status
    - Validate rejection reason is provided
    - Update all child assets to REJECTED status with reason
    - Update carousel status to REJECTED
    - Create Approval records for each child
    - Integrate with AuditService for logging
    - _Requirements: 5.5, 5.6, 5.11_
  
  - [ ]* 5.4 Write property test for bulk rejection
    - **Property 9: Bulk Carousel Rejection**
    - **Validates: Requirements 5.6**
  
  - [ ] 5.5 Implement approveCarouselAsset method for individual approval
    - Validate asset belongs to carousel
    - Validate asset is in PENDING_REVIEW status
    - Update only the specified asset to APPROVED
    - Recalculate parent carousel status
    - Create Approval record
    - Integrate with AuditService for logging
    - _Requirements: 5.7, 5.8, 5.11_
  
  - [ ] 5.6 Implement rejectCarouselAsset method for individual rejection
    - Validate asset belongs to carousel
    - Validate asset is in PENDING_REVIEW status
    - Validate rejection reason is provided
    - Update only the specified asset to REJECTED with reason
    - Recalculate parent carousel status
    - Create Approval record
    - Integrate with AuditService for logging
    - _Requirements: 5.9, 5.10, 5.11_
  
  - [ ]* 5.7 Write property test for granular approval
    - **Property 7: Granular Carousel Approval**
    - **Validates: Requirements 5.8, 5.10**
  
  - [ ] 5.8 Update getPendingAssets to categorize carousels separately
    - Query pending assets where parentCarouselId is null
    - Separate results into Regular Assets and Carousels
    - Include child asset counts for carousels
    - _Requirements: 5.1_
  
  - [ ]* 5.9 Write property test for pending approvals categorization
    - **Property 17: Pending Approvals Categorization**
    - **Validates: Requirements 5.1**

- [ ] 6. Extend DownloadService for carousel downloads
  - [ ] 6.1 Implement downloadCarousel method
    - Validate carousel exists and user has permission
    - Get all approved child assets from carousel
    - Create AssetDownload record for each child asset
    - Record downloader ID, timestamp, platform intent
    - Return download URLs for all child assets
    - Integrate with AuditService for logging
    - _Requirements: 6.5, 6.6, 6.7, 6.8_
  
  - [ ]* 6.2 Write property test for carousel download tracking
    - **Property 14: Bulk Carousel Download Tracking**
    - **Validates: Requirements 6.8, 9.5**
  
  - [ ] 6.3 Update getDownloadHistory to include carousel information
    - Include parentCarouselId in download records
    - Group carousel asset downloads by parent carousel
    - Show carousel title and metadata
    - _Requirements: 4.6, 4.7, 4.8, 9.2, 9.3_
  
  - [ ]* 6.4 Write property test for download record creation
    - **Property 13: Carousel Download Record Creation**
    - **Validates: Requirements 6.7, 9.1, 4.6, 4.7, 4.8, 9.2**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Create API endpoints for carousel management
  - [ ] 8.1 Create POST /api/carousels endpoint
    - Accept carousel metadata and child asset data
    - Validate user is Content Creator
    - Handle file uploads to R2 for each child asset
    - Call CarouselService.createCarousel
    - Return created carousel with children
    - Handle errors with appropriate status codes
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  
  - [ ] 8.2 Create GET /api/carousels endpoint
    - Accept query parameters for filtering (companyId, status)
    - Call CarouselService.listCarousels with user context
    - Return paginated carousel list
    - Apply role-based filtering
    - _Requirements: 3.1, 3.2_
  
  - [ ] 8.3 Create GET /api/carousels/[id] endpoint
    - Call CarouselService.getCarouselById with user context
    - Return carousel with child assets
    - Return 404 if not found or no permission
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 8.4 Create DELETE /api/carousels/[id] endpoint
    - Validate user has permission (uploader or admin)
    - Call CarouselService.deleteCarousel
    - Return success response
    - Handle errors with appropriate status codes
    - _Requirements: 4.4, 4.5_
  
  - [ ] 8.5 Create DELETE /api/carousels/[carouselId]/assets/[assetId] endpoint
    - Validate asset belongs to carousel
    - Validate user has permission
    - Call AssetService.deleteAsset
    - Trigger carousel status recalculation
    - Return success response
    - _Requirements: 4.2, 4.3_
  
  - [ ]* 8.6 Write integration tests for carousel API endpoints
    - Test create, list, get, delete operations
    - Test permission checks for each role
    - Test error cases (validation, not found, forbidden)

- [ ] 9. Create API endpoints for carousel approval
  - [ ] 9.1 Create POST /api/admin/approvals/carousel/[id]/approve endpoint
    - Validate user is Admin
    - Call ApprovalService.approveCarousel
    - Return updated carousel with all children approved
    - _Requirements: 5.3, 5.4_
  
  - [ ] 9.2 Create POST /api/admin/approvals/carousel/[id]/reject endpoint
    - Validate user is Admin
    - Validate rejection reason in request body
    - Call ApprovalService.rejectCarousel
    - Return updated carousel with all children rejected
    - _Requirements: 5.5, 5.6_
  
  - [ ] 9.3 Create POST /api/admin/approvals/carousel/[carouselId]/assets/[assetId]/approve endpoint
    - Validate user is Admin
    - Validate asset belongs to carousel
    - Call ApprovalService.approveCarouselAsset
    - Return updated asset and recalculated carousel status
    - _Requirements: 5.7, 5.8_
  
  - [ ] 9.4 Create POST /api/admin/approvals/carousel/[carouselId]/assets/[assetId]/reject endpoint
    - Validate user is Admin
    - Validate asset belongs to carousel
    - Validate rejection reason in request body
    - Call ApprovalService.rejectCarouselAsset
    - Return updated asset and recalculated carousel status
    - _Requirements: 5.9, 5.10_
  
  - [ ]* 9.5 Write integration tests for carousel approval endpoints
    - Test bulk and individual approval/rejection
    - Test status recalculation after approvals
    - Test permission checks (admin only)

- [ ] 10. Create API endpoints for carousel downloads
  - [ ] 10.1 Create POST /api/downloads/carousel/[id] endpoint
    - Validate user is SEO Specialist
    - Validate carousel has approved assets
    - Call DownloadService.downloadCarousel
    - Return download URLs for all approved assets
    - _Requirements: 6.6, 6.7, 6.8_
  
  - [ ] 10.2 Update GET /api/downloads/history endpoint
    - Include carousel information in response
    - Group carousel asset downloads by parent
    - Filter by user role (Content Creator sees their assets)
    - _Requirements: 4.6, 4.7, 4.8, 9.2, 9.3, 9.4_
  
  - [ ]* 10.3 Write integration tests for carousel download endpoints
    - Test carousel download creates multiple records
    - Test download history includes carousel info
    - Test permission checks

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Update upload form UI to support carousel type
  - [ ] 12.1 Add CAROUSEL option to asset type selector
    - Show CAROUSEL alongside IMAGE, VIDEO, DOCUMENT, LINK
    - Only visible to Content Creator users
    - _Requirements: 1.1_
  
  - [ ] 12.2 Create carousel upload interface
    - Show multi-file upload component when CAROUSEL selected
    - Accept only IMAGE and VIDEO files
    - Show preview thumbnails for uploaded files
    - Allow reordering of assets
    - Allow removal of individual assets before submission
    - _Requirements: 1.2, 1.4_
  
  - [ ] 12.3 Implement carousel metadata form
    - Single form for carousel-level metadata (title, description, tags)
    - Company selector (required)
    - Target platforms selector
    - Campaign name input
    - Apply metadata to all child assets on submission
    - _Requirements: 1.3, 1.5_
  
  - [ ] 12.4 Implement carousel upload submission
    - Upload files to R2 using presigned URLs
    - Call POST /api/carousels with metadata and file URLs
    - Show upload progress for each file
    - Handle errors and show user-friendly messages
    - Redirect to assets page on success
    - _Requirements: 2.1, 2.2_

- [ ] 13. Update assets page UI for hierarchical organization
  - [ ] 13.1 Implement company folder view
    - Group assets by company at top level
    - Show company name as expandable folder
    - Show asset count for each company
    - _Requirements: 3.1_
  
  - [ ] 13.2 Implement carousel folder view within companies
    - Show carousels as expandable folders within company folders
    - Display carousel icon, title, status badge
    - Show child asset count
    - Show carousel metadata (upload date, campaign)
    - _Requirements: 3.2, 3.4_
  
  - [ ] 13.3 Implement carousel children view
    - Show child assets when carousel folder is expanded
    - Display asset thumbnails, titles, types
    - Show individual asset status badges
    - Indicate parent carousel relationship
    - _Requirements: 3.3, 3.5_
  
  - [ ] 13.4 Implement empty carousel state
    - Show "No assets in this carousel" message
    - Provide option to delete empty carousel
    - _Requirements: 3.6_
  
  - [ ] 13.5 Add carousel deletion controls
    - Show delete button for entire carousel (Content Creator only)
    - Show delete button for individual assets (Content Creator only)
    - Confirm deletion with modal dialog
    - Update UI after successful deletion
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 14. Update admin approvals page for carousel support
  - [ ] 14.1 Implement pending approvals categorization
    - Create two tabs: "Regular Assets" and "Carousels"
    - Show count badges for each category
    - Filter pending items by category
    - _Requirements: 5.1_
  
  - [ ] 14.2 Implement carousel approval view
    - Show carousel as expandable folder in pending list
    - Display all child assets within carousel
    - Show carousel-level metadata
    - _Requirements: 5.2_
  
  - [ ] 14.3 Implement bulk carousel approval controls
    - Add "Approve All" button for entire carousel
    - Add "Reject All" button with reason input modal
    - Show confirmation dialog before bulk actions
    - Update UI after successful approval/rejection
    - _Requirements: 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 14.4 Implement individual asset approval controls
    - Add approve/reject buttons for each child asset
    - Show rejection reason input modal for individual rejections
    - Update only the affected asset in UI
    - Show updated carousel status after individual actions
    - _Requirements: 5.7, 5.8, 5.9, 5.10_
  
  - [ ] 14.5 Add carousel status indicator
    - Show real-time carousel status based on children
    - Update status badge when children are approved/rejected
    - _Requirements: 5.11_

- [ ] 15. Update SEO specialist view for carousel access
  - [ ] 15.1 Filter carousels to show only those with approved assets
    - Hide carousels with no approved children
    - Hide carousels with PENDING_REVIEW or REJECTED status
    - _Requirements: 6.2, 6.3_
  
  - [ ] 15.2 Show only approved assets within carousels
    - Filter child assets to show only APPROVED status
    - Hide pending or rejected children from SEO specialists
    - _Requirements: 6.4_
  
  - [ ] 15.3 Implement carousel download controls
    - Add "Download All" button for entire carousel
    - Add individual download buttons for each asset
    - Show platform selector modal before download
    - _Requirements: 6.5, 6.6_
  
  - [ ] 15.4 Implement carousel download functionality
    - Call POST /api/downloads/carousel/[id] for bulk download
    - Download all approved assets as zip file or individual files
    - Show download progress
    - _Requirements: 6.7, 6.8, 6.9_

- [ ] 16. Create "Downloaded Assets" page for Content Creators
  - [ ] 16.1 Create new page route /downloads/history
    - Add navigation link in sidebar for Content Creators
    - _Requirements: 4.6_
  
  - [ ] 16.2 Implement download history display
    - Show all assets (regular and carousel) that were downloaded
    - Display platform, download date, downloader name
    - Group carousel assets by parent carousel
    - Provide link back to original asset/carousel
    - _Requirements: 4.6, 4.7, 4.8, 9.3_
  
  - [ ] 16.3 Implement carousel download grouping
    - Show carousel title as group header
    - List individual assets downloaded from carousel
    - Show download details for each asset
    - _Requirements: 9.3, 9.4_

- [ ] 17. Update company management for admin rename capability
  - [ ] 17.1 Add company rename functionality to admin companies page
    - Add edit button next to company names
    - Show inline edit or modal for rename
    - Call PATCH /api/companies/[id] endpoint
    - _Requirements: 5.12_
  
  - [ ] 17.2 Verify company name propagation
    - Test that renamed companies show updated name in all views
    - Verify carousel queries reflect new company name
    - _Requirements: 5.12_
  
  - [ ]* 17.3 Write property test for company rename propagation
    - **Property 20: Company Rename Propagation**
    - **Validates: Requirements 5.12**

- [ ] 18. Final integration and testing
  - [ ] 18.1 Test complete carousel workflow end-to-end
    - Content Creator uploads carousel
    - Admin reviews and approves (bulk and individual)
    - SEO Specialist downloads carousel assets
    - Content Creator views download history
  
  - [ ] 18.2 Test role-based permissions across all features
    - Verify Content Creators can only manage their carousels
    - Verify Admins can manage all carousels
    - Verify SEO Specialists can only see approved carousels
  
  - [ ] 18.3 Test error handling and edge cases
    - Empty carousels
    - Large carousels (many assets)
    - Network failures during upload
    - Concurrent approval actions
    - Deletion of assets being downloaded
  
  - [ ]* 18.4 Run all property-based tests with 100+ iterations
    - Verify all 20 correctness properties hold
    - Fix any failures discovered by property tests

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with randomized inputs
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → services → API → UI
- All carousel operations integrate with existing audit logging and notification systems
