# CAROUSEL Asset Visibility Implementation Guide

## Overview
This document explains how CAROUSEL assets are visible to all users (SEO, Admin, Creator) with proper approval workflow.

## Current Implementation Status

### ✅ Already Working

1. **CAROUSEL Type Support**
   - CAROUSEL is defined in AssetType enum
   - Supported in upload flow (`/assets/upload`)
   - Supported in asset listing (`/assets`)
   - Supported in admin approvals (`/admin/approvals`)
   - Supported in asset details page (`/assets/[id]`)

2. **Visibility Rules (All Asset Types Including CAROUSEL)**
   - **Admin**: Can see ALL assets regardless of status
   - **Creator**: Can see own uploads + explicitly shared assets
   - **SEO Specialist**: Can see own uploads + APPROVED assets they have permission to view

3. **Approval Workflow**
   - Admin can approve/reject CAROUSEL assets via `/admin/approvals`
   - Approval changes status from PENDING_REVIEW → APPROVED
   - Rejection changes status to REJECTED with reason
   - Visibility can be modified during approval

4. **Asset Filtering**
   - SearchService applies role-based filtering
   - VisibilityChecker enforces permission rules
   - No special restrictions on CAROUSEL type

## How CAROUSEL Assets Flow Through the System

### Upload (Creator/SEO User)
1. User uploads CAROUSEL via `/assets/upload`
2. Selects "Carousel (Multiple Images/Videos)" as asset type
3. If uploadType = SEO and submitForReview = true:
   - Status set to PENDING_REVIEW
   - Asset visible to uploader and Admin only
4. If uploadType = DOC or submitForReview = false:
   - Status set to DRAFT
   - Asset visible based on visibility setting

### Admin Review
1. Admin navigates to `/admin/approvals`
2. Sees all PENDING_REVIEW assets (including CAROUSEL)
3. Can filter by type to see only CAROUSEL assets
4. For each CAROUSEL:
   - View preview/details
   - Approve with visibility setting
   - Reject with reason

### After Approval
1. Status changes to APPROVED
2. Visibility applied (COMPANY, ROLE, PUBLIC, etc.)
3. Asset now visible to:
   - **Admin**: Always visible
   - **SEO Specialist**: Visible if APPROVED and has permission
   - **Creator**: Visible if has permission based on visibility

### Asset Listing
1. All users see assets based on role:
   - `/assets` page shows filtered assets
   - Grid/List/Company view modes
   - Filter by type (can select CAROUSEL)
2. CAROUSEL assets display with carousel icon
3. Click to view full details with carousel slider

## Code Locations

### Key Files
- `prisma/schema.prisma` - Asset model with assetType enum
- `lib/services/VisibilityChecker.ts` - Permission checking
- `lib/services/SearchService.ts` - Asset filtering and search
- `lib/services/ApprovalService.ts` - Approval workflow
- `app/api/assets/carousel/route.ts` - CAROUSEL upload endpoint
- `app/admin/approvals/page.tsx` - Admin approval interface
- `app/assets/page.tsx` - Asset listing page
- `components/assets/AssetCard.tsx` - Asset display component

### API Endpoints
- `POST /api/assets/carousel` - Create CAROUSEL asset
- `GET /api/assets/pending` - Get pending assets (includes CAROUSEL)
- `POST /api/assets/[id]/approve` - Approve asset (works for CAROUSEL)
- `POST /api/assets/[id]/reject` - Reject asset (works for CAROUSEL)
- `GET /api/assets/search` - Search assets (includes CAROUSEL)

## Verification Steps

### Test CAROUSEL Visibility

1. **As Creator**:
   ```
   - Upload CAROUSEL with uploadType=DOC → Should see immediately
   - Upload CAROUSEL with uploadType=SEO, submitForReview=true → Should see in own list as PENDING
   ```

2. **As Admin**:
   ```
   - Navigate to /admin/approvals → Should see all PENDING CAROUSEL assets
   - Filter by type "Carousel" → Should see only CAROUSEL assets
   - Approve CAROUSEL with visibility=COMPANY → Status changes to APPROVED
   ```

3. **As SEO Specialist**:
   ```
   - Navigate to /assets → Should see own CAROUSEL uploads (any status)
   - Should see APPROVED CAROUSEL assets from others (based on visibility)
   - Should NOT see PENDING or REJECTED CAROUSEL from others
   ```

4. **Asset Listing**:
   ```
   - Filter by Asset Type → Select "Carousel"
   - Should show all CAROUSEL assets user has permission to view
   - Grid view shows carousel icon
   - List view shows "Carousel" type
   ```

## No Changes Needed

The system already implements the requested functionality:
- ✅ CAROUSEL visible to all users based on role and approval status
- ✅ Admin can approve/reject CAROUSEL
- ✅ SEO users see CAROUSEL when approved
- ✅ Creator users see own CAROUSEL + shared CAROUSEL
- ✅ Proper filtering in asset listing
- ✅ Proper display in admin approvals

## Summary

CAROUSEL assets work exactly like IMAGE, VIDEO, and DOCUMENT assets in terms of visibility and approval workflow. There are no special restrictions on CAROUSEL type. The role-based visibility system ensures:

1. **Admin** sees everything
2. **SEO Specialist** sees own uploads + approved assets
3. **Creator** sees own uploads + explicitly shared assets

This applies uniformly to ALL asset types including CAROUSEL.
