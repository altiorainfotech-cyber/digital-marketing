# Admin Approve/Reject Buttons on Asset Detail Page

## Overview
Added Approve and Reject buttons on the asset detail page for admin users to quickly approve or reject pending assets without having to navigate back to the pending approvals page.

## Feature Description

### What Was Added

1. **Approve Button** (Green)
   - Icon: CheckCircle
   - Variant: Success (green)
   - Opens approval modal with visibility selection

2. **Reject Button** (Red)
   - Icon: XCircle
   - Variant: Danger (red)
   - Opens rejection modal with reason input

### When Buttons Appear

The buttons only appear when:
- User is an Admin (`UserRole.ADMIN`)
- Asset status is `PENDING_REVIEW`

This is controlled by the `canApproveReject` variable:
```typescript
const canApproveReject = isAdmin && asset?.status === AssetStatus.PENDING_REVIEW;
```

## User Interface

### Button Placement

The buttons are placed in the top navigation bar, between the "Admin Panel" button and the "Share" button:

```
┌────────────────────────────────────────────────────────────────┐
│ ← Back to Pending Assets  [Admin Panel] [Approve] [Reject]    │
│                            [Share] [Download]                  │
└────────────────────────────────────────────────────────────────┘
```

### Approval Modal

When admin clicks "Approve":

```
┌─────────────────────────────────────────────────────────┐
│ Approve Asset                                      [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ You are approving: Gandhi-Study in Canada.mp4          │
│                                                         │
│ Set Visibility Level                                   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Public (Everyone)                          ▼    │   │
│ └─────────────────────────────────────────────────┘   │
│ Choose who can view this asset after approval         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel] [Approve Asset]  │
└─────────────────────────────────────────────────────────┘
```

**Visibility Options:**
- Private (Uploader Only)
- Public (Everyone)
- Company
- SEO Specialist Role
- Content Creator Role

### Rejection Modal

When admin clicks "Reject":

```
┌─────────────────────────────────────────────────────────┐
│ Reject Asset                                       [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ You are rejecting: Gandhi-Study in Canada.mp4          │
│                                                         │
│ Rejection Reason *                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Explain why this asset is being rejected...    │   │
│ │                                                 │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│ The uploader will see this reason                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel] [Reject Asset]   │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### State Management

Added new state variables:
```typescript
const [showApprovalModal, setShowApprovalModal] = useState(false);
const [showRejectionModal, setShowRejectionModal] = useState(false);
const [rejectionReason, setRejectionReason] = useState('');
const [newVisibility, setNewVisibility] = useState<VisibilityLevel | 'SEO_SPECIALIST' | 'CONTENT_CREATOR'>(VisibilityLevel.COMPANY);
const [processing, setProcessing] = useState(false);
```

### Handler Functions

#### `handleApprove()`
```typescript
const handleApprove = async () => {
  // 1. Prepare request body with visibility settings
  // 2. Call /api/assets/${assetId}/approve
  // 3. Update asset state with response
  // 4. Close modal
  // 5. If came from pending approvals, navigate back
};
```

#### `handleReject()`
```typescript
const handleReject = async () => {
  // 1. Validate rejection reason is provided
  // 2. Call /api/assets/${assetId}/reject
  // 3. Update asset state with response
  // 4. Close modal and clear form
  // 5. If came from pending approvals, navigate back
};
```

### API Integration

Uses existing API endpoints:
- `POST /api/assets/${assetId}/approve` - Approve asset
- `POST /api/assets/${assetId}/reject` - Reject asset

### Navigation Behavior

After approval or rejection:
- If user came from pending approvals page → `router.back()` (returns to filtered view)
- Otherwise → Stay on asset detail page (asset status updates)

## User Workflows

### Workflow 1: Approve from Pending Approvals

1. Admin navigates to Pending Approvals
2. Applies filters (Type: VIDEO)
3. Clicks "View Asset" on a pending video
4. Reviews the asset content
5. Clicks "Approve" button
6. Selects visibility level (e.g., "Public")
7. Clicks "Approve Asset"
8. ✅ Asset is approved
9. ✅ Automatically returns to Pending Approvals with filters intact
10. ✅ Can continue reviewing next asset

### Workflow 2: Reject from Pending Approvals

1. Admin navigates to Pending Approvals
2. Clicks "View Asset" on a pending asset
3. Reviews the asset and finds issues
4. Clicks "Reject" button
5. Enters rejection reason: "Video quality is too low"
6. Clicks "Reject Asset"
7. ✅ Asset is rejected
8. ✅ Automatically returns to Pending Approvals
9. ✅ Can continue reviewing next asset

### Workflow 3: Approve from Direct Link

1. Admin receives direct link to asset: `/assets/xyz789`
2. Opens link and reviews asset
3. Clicks "Approve" button
4. Selects visibility level
5. Clicks "Approve Asset"
6. ✅ Asset is approved
7. ✅ Stays on asset detail page (now shows APPROVED status)

## Benefits

### 1. Faster Review Process
- No need to go back to pending approvals to approve/reject
- Can make decision while viewing asset details
- Reduces clicks and navigation time

### 2. Better Context
- Admin can review all asset details before deciding
- Can see metadata, tags, uploader info, etc.
- More informed decision-making

### 3. Seamless Workflow
- Approve/reject and automatically return to pending list
- Filters are preserved when returning
- Can quickly review multiple assets in sequence

### 4. Consistent UI
- Same modals as pending approvals page
- Same visibility options
- Same rejection reason flow

### 5. Flexible Access
- Works from pending approvals page
- Works from direct asset links
- Works from search results

## Code Changes

### File: `/app/assets/[id]/page.tsx`

**Imports Added:**
```typescript
import { Modal } from '@/lib/design-system/components/composite/Modal';
import { Select, SelectOption } from '@/lib/design-system/components/primitives/Select';
```

**State Added:**
```typescript
const [showApprovalModal, setShowApprovalModal] = useState(false);
const [showRejectionModal, setShowRejectionModal] = useState(false);
const [rejectionReason, setRejectionReason] = useState('');
const [newVisibility, setNewVisibility] = useState<VisibilityLevel | 'SEO_SPECIALIST' | 'CONTENT_CREATOR'>(VisibilityLevel.COMPANY);
const [processing, setProcessing] = useState(false);
const canApproveReject = isAdmin && asset?.status === AssetStatus.PENDING_REVIEW;
```

**Functions Added:**
- `handleApprove()` - Approve asset with visibility selection
- `handleReject()` - Reject asset with reason

**UI Components Added:**
- Approve button in navigation bar
- Reject button in navigation bar
- Approval modal with visibility selector
- Rejection modal with reason textarea

## Testing Checklist

### Visibility Tests
- [x] Buttons only show for admin users
- [x] Buttons only show when asset status is PENDING_REVIEW
- [x] Buttons don't show for approved assets
- [x] Buttons don't show for rejected assets
- [x] Buttons don't show for non-admin users

### Approval Tests
- [x] Click Approve button opens modal
- [x] Modal shows asset title
- [x] Visibility dropdown has all options
- [x] Can select different visibility levels
- [x] Cancel button closes modal without changes
- [x] Approve button is disabled while processing
- [x] Success: Asset status updates to APPROVED
- [x] Success: Returns to pending approvals if came from there
- [x] Error: Shows error message if API fails

### Rejection Tests
- [x] Click Reject button opens modal
- [x] Modal shows asset title
- [x] Rejection reason textarea is required
- [x] Reject button is disabled when reason is empty
- [x] Cancel button closes modal without changes
- [x] Reject button is disabled while processing
- [x] Success: Asset status updates to REJECTED
- [x] Success: Returns to pending approvals if came from there
- [x] Error: Shows error message if API fails

### Navigation Tests
- [x] From pending approvals → approve → returns to pending approvals
- [x] From pending approvals → reject → returns to pending approvals
- [x] From direct link → approve → stays on asset page
- [x] From direct link → reject → stays on asset page
- [x] Filters are preserved when returning to pending approvals

### Integration Tests
- [x] Approval updates asset in database
- [x] Rejection updates asset in database
- [x] Rejection reason is saved
- [x] Visibility level is applied correctly
- [x] Role-based visibility works (SEO_SPECIALIST, CONTENT_CREATOR)
- [x] Asset status badge updates after approval/rejection

## Edge Cases Handled

1. **Empty Rejection Reason**
   - Reject button is disabled until reason is entered
   - Alert shown if user tries to submit without reason

2. **Processing State**
   - Buttons disabled during API call
   - Loading spinner shown
   - Prevents double-submission

3. **API Errors**
   - Error messages displayed to user
   - Modal stays open on error
   - User can retry or cancel

4. **Navigation Context**
   - Detects if came from pending approvals
   - Returns to correct page after action
   - Preserves filters when returning

5. **Asset Status Changes**
   - Buttons disappear after approval/rejection
   - Status badge updates immediately
   - UI reflects new state

## Accessibility

- ✅ Buttons have clear labels
- ✅ Icons provide visual context
- ✅ Modals are keyboard accessible
- ✅ Form fields have proper labels
- ✅ Required fields are marked
- ✅ Error states are announced
- ✅ Loading states are indicated

## Performance

- ✅ No additional API calls on page load
- ✅ Modals render only when needed
- ✅ State updates are optimized
- ✅ No unnecessary re-renders

## Security

- ✅ Admin-only functionality (checked on frontend and backend)
- ✅ API endpoints validate user permissions
- ✅ Asset status is validated before allowing actions
- ✅ Rejection reason is sanitized

## Future Enhancements

Potential improvements:
1. Bulk approve/reject from asset detail page
2. Quick approve with default visibility
3. Rejection reason templates
4. Approval history timeline
5. Undo approval/rejection
6. Email notifications on approval/rejection

## Related Files

- `/app/assets/[id]/page.tsx` - Asset detail page with approve/reject
- `/app/admin/approvals/page.tsx` - Pending approvals page
- `/api/assets/[id]/approve/route.ts` - Approval API endpoint
- `/api/assets/[id]/reject/route.ts` - Rejection API endpoint

## Summary

Admin users can now approve or reject pending assets directly from the asset detail page, making the review process faster and more efficient. The feature integrates seamlessly with the existing pending approvals workflow and preserves filter state when navigating back.
