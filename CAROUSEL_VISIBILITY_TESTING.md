# CAROUSEL Asset Visibility Testing Guide

## Changes Made

### 1. Admin Approvals Page (`app/admin/approvals/page.tsx`)
- ✅ Added CAROUSEL to type filter dropdown
- ✅ Added CAROUSEL icon (Images from lucide-react)
- ✅ Added CAROUSEL badge variant (warning = yellow/orange)
- ✅ Added special preview rendering for CAROUSEL assets

## Testing Scenarios

### Scenario 1: Creator Uploads CAROUSEL (DOC Type)
**Steps:**
1. Login as Content Creator
2. Navigate to `/assets/upload`
3. Select "Carousel (Multiple Images/Videos)" as asset type
4. Select "Doc" as upload type
5. Upload 2+ images/videos
6. Set visibility to "Private" or "Company"
7. Submit without "Submit for Review"

**Expected Result:**
- CAROUSEL created with status = DRAFT
- Visible immediately in `/assets` page
- Creator can see it in their asset list
- Admin can see it in all assets
- SEO users cannot see it (unless visibility allows)

### Scenario 2: SEO User Uploads CAROUSEL (SEO Type) for Review
**Steps:**
1. Login as SEO Specialist
2. Navigate to `/assets/upload`
3. Select "Carousel (Multiple Images/Videos)" as asset type
4. Select "SEO" as upload type
5. Select a company
6. Upload 2+ images/videos
7. Check "Submit for Review"
8. Submit

**Expected Result:**
- CAROUSEL created with status = PENDING_REVIEW
- Visible to uploader in `/assets` page (shows as PENDING)
- Visible to Admin in `/admin/approvals` page
- NOT visible to other SEO users yet
- NOT visible to Content Creators

### Scenario 3: Admin Reviews CAROUSEL
**Steps:**
1. Login as Admin
2. Navigate to `/admin/approvals`
3. Filter by type "Carousels" (should show only CAROUSEL assets)
4. Click on a CAROUSEL asset
5. Click "Approve"
6. Select visibility level (e.g., "Company" or "SEO Specialist Role")
7. Confirm approval

**Expected Result:**
- CAROUSEL status changes to APPROVED
- Visibility applied as selected
- Uploader receives notification (if implemented)
- CAROUSEL now visible to users based on visibility setting

### Scenario 4: SEO User Views Approved CAROUSEL
**Steps:**
1. Login as SEO Specialist
2. Navigate to `/assets`
3. Filter by type "Carousel"
4. Look for approved CAROUSEL assets

**Expected Result:**
- SEO user sees:
  - Own CAROUSEL uploads (any status)
  - APPROVED CAROUSEL assets from others (based on visibility)
- SEO user does NOT see:
  - PENDING CAROUSEL from others
  - REJECTED CAROUSEL from others
  - DRAFT CAROUSEL from others (unless shared)

### Scenario 5: Admin Rejects CAROUSEL
**Steps:**
1. Login as Admin
2. Navigate to `/admin/approvals`
3. Click on a CAROUSEL asset
4. Click "Reject"
5. Enter rejection reason
6. Confirm rejection

**Expected Result:**
- CAROUSEL status changes to REJECTED
- Rejection reason stored
- Uploader can see rejection reason
- CAROUSEL visible only to uploader and Admin
- NOT visible to other users

### Scenario 6: Bulk Operations on CAROUSEL
**Steps:**
1. Login as Admin
2. Navigate to `/admin/approvals`
3. Select multiple CAROUSEL assets (use checkboxes)
4. Click "Approve All" or "Reject All"
5. Confirm action

**Expected Result:**
- All selected CAROUSEL assets approved/rejected
- Status updated for all
- Visibility applied (for approval)
- Rejection reason applied (for rejection)

### Scenario 7: Filter and Search CAROUSEL
**Steps:**
1. Navigate to `/assets`
2. Use filter dropdown to select "Carousel" type
3. Search for CAROUSEL by title
4. Sort by upload date, title, etc.

**Expected Result:**
- Only CAROUSEL assets shown
- Search works across CAROUSEL titles
- Sorting works correctly
- User sees only CAROUSEL they have permission to view

### Scenario 8: View CAROUSEL Details
**Steps:**
1. Navigate to `/assets`
2. Click on a CAROUSEL asset card
3. View full details page

**Expected Result:**
- CAROUSEL details page shows:
  - Carousel slider with all items
  - Asset metadata
  - Approval status
  - Action buttons (approve/reject for Admin)
  - Download button (if approved)

## Verification Checklist

### Admin User
- [ ] Can see all CAROUSEL assets in `/admin/approvals`
- [ ] Can filter by "Carousels" type
- [ ] Can approve CAROUSEL with visibility setting
- [ ] Can reject CAROUSEL with reason
- [ ] Can bulk approve/reject CAROUSEL assets
- [ ] CAROUSEL shows with carousel icon (Images)
- [ ] CAROUSEL badge shows in warning color (yellow/orange)

### SEO Specialist User
- [ ] Can upload CAROUSEL with SEO type
- [ ] Can submit CAROUSEL for review
- [ ] Can see own CAROUSEL uploads (any status)
- [ ] Can see APPROVED CAROUSEL from others (based on visibility)
- [ ] Cannot see PENDING/REJECTED CAROUSEL from others
- [ ] Can filter by CAROUSEL type in `/assets`
- [ ] Can download approved CAROUSEL

### Content Creator User
- [ ] Can upload CAROUSEL with DOC type
- [ ] Can see own CAROUSEL uploads
- [ ] Can see shared CAROUSEL assets
- [ ] Cannot see PENDING CAROUSEL from others
- [ ] Can filter by CAROUSEL type in `/assets`

## API Endpoints to Test

### CAROUSEL Upload
```bash
POST /api/assets/carousel
Body: {
  "title": "Test Carousel",
  "description": "Test description",
  "tags": ["test"],
  "uploadType": "SEO",
  "companyId": "company-id",
  "submitForReview": true,
  "fileCount": 3
}
```

### Get Pending Assets (Admin)
```bash
GET /api/assets/pending
# Should include CAROUSEL assets with PENDING_REVIEW status
```

### Approve CAROUSEL
```bash
POST /api/assets/{carouselId}/approve
Body: {
  "newVisibility": "COMPANY"
}
```

### Reject CAROUSEL
```bash
POST /api/assets/{carouselId}/reject
Body: {
  "reason": "Quality issues"
}
```

### Search Assets (Include CAROUSEL)
```bash
GET /api/assets/search?assetType=CAROUSEL
# Should return CAROUSEL assets user has permission to view
```

## Expected Behavior Summary

| User Role | Own CAROUSEL | Others' DRAFT | Others' PENDING | Others' APPROVED | Others' REJECTED |
|-----------|--------------|---------------|-----------------|------------------|------------------|
| Admin | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| SEO Specialist | ✅ All | ❌ No | ❌ No | ✅ Yes (if visible) | ❌ No |
| Content Creator | ✅ All | ❌ No | ❌ No | ✅ Yes (if shared) | ❌ No |

## Notes

1. CAROUSEL assets follow the same visibility rules as other asset types
2. No special restrictions on CAROUSEL type
3. Approval workflow works identically for CAROUSEL
4. Role-based filtering applies uniformly
5. CAROUSEL can have visibility: UPLOADER_ONLY, COMPANY, ROLE, PUBLIC, etc.
6. Admin can modify visibility during approval
7. CAROUSEL preview shows carousel icon in admin approvals
8. CAROUSEL badge uses warning variant (yellow/orange color)
