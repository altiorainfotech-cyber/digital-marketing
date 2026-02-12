# CAROUSEL Asset User Guide

## What is a CAROUSEL Asset?

A CAROUSEL asset is a collection of multiple images and/or videos grouped together. It allows you to upload and manage multiple media files as a single asset.

## For All Users

### Viewing CAROUSEL Assets
1. Navigate to `/assets`
2. Use the filter dropdown to select "Carousel" type
3. CAROUSEL assets display with a carousel icon (📷 multiple images)
4. Click on a CAROUSEL to view all items in a slider

### CAROUSEL Badge
- CAROUSEL assets show a yellow/orange badge labeled "CAROUSEL"
- This helps you quickly identify carousel assets in lists

## For Content Creators

### Uploading CAROUSEL (DOC Type)
1. Go to `/assets/upload`
2. Select "Carousel (Multiple Images/Videos)" as asset type
3. Select "Doc" as upload type
4. Upload 2 or more images/videos
5. Set title, description, tags
6. Choose visibility (Private, Company, etc.)
7. Submit

**Result**: CAROUSEL created immediately with DRAFT status, visible based on visibility setting.

### What You Can See
- ✅ Your own CAROUSEL uploads (any status)
- ✅ CAROUSEL assets explicitly shared with you
- ❌ Other users' CAROUSEL assets (unless shared)

## For SEO Specialists

### Uploading CAROUSEL (SEO Type)
1. Go to `/assets/upload`
2. Select "Carousel (Multiple Images/Videos)" as asset type
3. Select "SEO" as upload type
4. Select a company
5. Upload 2 or more images/videos
6. Set title, description, tags, platforms, campaign
7. Check "Submit for Review" if you want Admin approval
8. Submit

**Result**: 
- If "Submit for Review" checked: Status = PENDING_REVIEW, visible to you and Admin only
- If not checked: Status = DRAFT, visible based on visibility setting

### What You Can See
- ✅ Your own CAROUSEL uploads (any status: DRAFT, PENDING, APPROVED, REJECTED)
- ✅ APPROVED CAROUSEL assets from others (based on visibility rules)
- ❌ PENDING or REJECTED CAROUSEL from others
- ❌ DRAFT CAROUSEL from others (unless shared)

### After Admin Approval
Once Admin approves your CAROUSEL:
- Status changes to APPROVED
- Becomes visible to other users based on visibility setting
- You can download and share it
- Other SEO users can see it (if visibility allows)

## For Admins

### Reviewing CAROUSEL Assets
1. Go to `/admin/approvals`
2. See all PENDING_REVIEW assets including CAROUSEL
3. Filter by "Carousels" to see only CAROUSEL assets
4. Each CAROUSEL shows:
   - Carousel icon and badge
   - Title, description, tags
   - Uploader information
   - Company information
   - Upload date

### Approving CAROUSEL
1. Click on a CAROUSEL asset
2. Click "Approve" button
3. Select visibility level:
   - Private (Uploader Only)
   - Public (Everyone)
   - SEO Specialist Role
   - Content Creator Role
   - Company
4. Confirm approval

**Result**: 
- Status changes to APPROVED
- Visibility applied as selected
- Uploader notified
- Asset becomes visible to users based on visibility

### Rejecting CAROUSEL
1. Click on a CAROUSEL asset
2. Click "Reject" button
3. Enter rejection reason (required)
4. Confirm rejection

**Result**:
- Status changes to REJECTED
- Rejection reason stored
- Uploader can see reason
- Asset visible only to uploader and Admin

### Bulk Operations
1. Select multiple CAROUSEL assets using checkboxes
2. Click "Approve All" to approve all selected
3. Click "Reject All" to reject all selected (enter reason)

### What You Can See
- ✅ ALL CAROUSEL assets regardless of status
- ✅ DRAFT, PENDING, APPROVED, REJECTED - you see everything
- ✅ Full admin access to all CAROUSEL operations

## Visibility Levels Explained

### Private (Uploader Only)
- Only the uploader and Admin can see the CAROUSEL
- Most restrictive option

### Company
- All users in the same company can see the CAROUSEL
- Good for company-wide assets

### Role-Based (SEO Specialist / Content Creator)
- Only users with the specified role can see the CAROUSEL
- Good for role-specific assets

### Public (Everyone)
- All users can see the CAROUSEL
- Most permissive option

## Common Workflows

### Workflow 1: SEO User Uploads for Review
```
SEO User uploads CAROUSEL (SEO type, submit for review)
  ↓
Status: PENDING_REVIEW (visible to uploader + Admin)
  ↓
Admin reviews and approves with visibility=COMPANY
  ↓
Status: APPROVED (visible to all company users)
  ↓
Other SEO users can now see and use the CAROUSEL
```

### Workflow 2: Creator Uploads Private CAROUSEL
```
Creator uploads CAROUSEL (DOC type, visibility=UPLOADER_ONLY)
  ↓
Status: DRAFT (visible to uploader + Admin only)
  ↓
Creator can share with specific users if needed
  ↓
Shared users can view the CAROUSEL
```

### Workflow 3: Admin Rejects CAROUSEL
```
SEO User uploads CAROUSEL (SEO type, submit for review)
  ↓
Status: PENDING_REVIEW
  ↓
Admin reviews and rejects with reason
  ↓
Status: REJECTED (visible to uploader + Admin)
  ↓
Uploader sees rejection reason and can fix issues
  ↓
Uploader can re-upload or edit and resubmit
```

## Tips

### For SEO Users
- Always submit for review if you want the CAROUSEL to be visible to others
- Add clear descriptions and tags to help others find your CAROUSEL
- Specify target platforms and campaign names for better organization

### For Admins
- Use the type filter to focus on CAROUSEL assets only
- Review CAROUSEL items carefully before approving
- Set appropriate visibility based on who should see the CAROUSEL
- Provide clear rejection reasons to help users improve

### For All Users
- Use the search and filter features to find CAROUSEL assets quickly
- Check the status badge to know if a CAROUSEL is approved
- Click on CAROUSEL to view all items in the slider
- Download approved CAROUSEL for use in your campaigns

## Troubleshooting

### "I can't see a CAROUSEL asset"
- Check if you have permission based on visibility rules
- SEO users: Only APPROVED CAROUSEL from others are visible
- Creators: Only shared CAROUSEL are visible
- Check if the CAROUSEL is still PENDING or REJECTED

### "My CAROUSEL is stuck in PENDING"
- Wait for Admin to review and approve
- Contact Admin if urgent
- Check that you submitted for review

### "I can't upload a CAROUSEL"
- Ensure you have at least 2 files
- Only images and videos are allowed in CAROUSEL
- Check file size limits
- Verify you selected the correct asset type

## Support

For additional help:
- Contact your Admin for approval status
- Check the asset details page for more information
- Review the visibility settings if assets aren't showing
