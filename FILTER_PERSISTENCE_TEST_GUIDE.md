# Filter Persistence Test Guide

## How to Test the Implementation

### Test Scenario 1: Filter Persistence from Pending Assets

**Steps:**

1. **Login as Admin**
   - Navigate to `/admin/approvals`

2. **Apply Filters**
   - Select Type: "VIDEO"
   - Select Company: "Gandhi Immigration"
   - Select Date: "Last 7 Days"
   - Notice URL updates to: `/admin/approvals?type=VIDEO&company=abc123&date=last7days`

3. **View an Asset**
   - Click "View Asset" button on any pending asset card
   - Navigate to asset detail page (e.g., `/assets/xyz789`)
   - **Verify**: Button shows "Back to Pending Assets" (not "Back to Assets")
   - **Verify**: Breadcrumb shows "Pending Assets > Asset Title"

4. **Navigate Back**
   - Click "Back to Pending Assets" button
   - **Expected Result**: Returns to `/admin/approvals?type=VIDEO&company=abc123&date=last7days`
   - **Verify**: All three filters are still applied
   - **Verify**: Filtered results are displayed
   - **Verify**: Filter dropdowns show selected values

5. **Test Multiple Times**
   - Click on another asset
   - Click "Back to Pending Assets" again
   - **Verify**: Filters remain applied each time

### Test Scenario 2: Browser Back Button

**Steps:**

1. **Apply filters on pending assets page**
   - Type: "IMAGE"
   - Company: "Acme Corp"

2. **View an asset**
   - Click "View Asset"

3. **Use browser back button**
   - Click browser's back button (←)
   - **Expected Result**: Returns to pending assets with filters intact

4. **Use browser forward button**
   - Click browser's forward button (→)
   - **Expected Result**: Returns to asset detail page

### Test Scenario 3: Page Refresh

**Steps:**

1. **Apply filters**
   - Type: "DOCUMENT"
   - Date: "Today"

2. **Note the URL**
   - URL should be: `/admin/approvals?type=DOCUMENT&date=today`

3. **Refresh the page**
   - Press F5 or Cmd+R
   - **Expected Result**: Filters are still applied after refresh

### Test Scenario 4: Bookmark and Revisit

**Steps:**

1. **Apply filters**
   - Type: "CAROUSEL"
   - Company: "Test Company"

2. **Bookmark the page**
   - Save bookmark with current URL

3. **Navigate away**
   - Go to another page

4. **Use bookmark**
   - Click the bookmark
   - **Expected Result**: Page loads with filters already applied

### Test Scenario 5: Clear Filters

**Steps:**

1. **Apply multiple filters**
   - Type: "VIDEO"
   - Company: "Gandhi Immigration"
   - Date: "Last 30 Days"

2. **Click "Clear" button**
   - **Expected Result**: All filters are cleared
   - **Expected Result**: URL updates to `/admin/approvals` (no query params)

3. **View an asset and come back**
   - Click "View Asset"
   - Click "Back to Pending Assets"
   - **Expected Result**: No filters are applied (shows all pending assets)

### Test Scenario 6: Direct URL Access

**Steps:**

1. **Copy a filtered URL**
   - Example: `/admin/approvals?type=IMAGE&company=abc123`

2. **Open in new tab**
   - Paste URL in new browser tab
   - **Expected Result**: Page loads with filters already applied

3. **Share URL with another admin**
   - Send URL to colleague
   - **Expected Result**: They see the same filtered view

## Expected Behavior Summary

### ✅ What Should Work

1. **Filter Persistence**
   - Filters survive navigation to asset detail and back
   - Filters survive page refresh
   - Filters survive browser back/forward navigation

2. **URL Updates**
   - URL automatically updates when filters change
   - URL parameters are clean and readable
   - Empty filters are removed from URL

3. **Button Text**
   - Shows "Back to Pending Assets" when from pending approvals
   - Shows "Back to Assets" when from other pages

4. **Breadcrumb**
   - Shows "Pending Assets" when from pending approvals
   - Links to correct page with filters preserved

5. **Navigation**
   - `router.back()` preserves URL parameters
   - Admin users navigate to `/admin/assets` (not `/assets`)

### ❌ What Should NOT Happen

1. **Filters should NOT be lost** when:
   - Navigating to asset detail and back
   - Refreshing the page
   - Using browser back/forward buttons

2. **URL should NOT contain** filters when:
   - All filters are cleared
   - User clicks "Clear" button

3. **Button should NOT show** "Back to Assets" when:
   - User came from pending approvals page

## Troubleshooting

### Issue: Filters are lost after clicking back

**Check:**
- Is `useSearchParams` imported correctly?
- Are filters initialized from URL params?
- Is `router.replace()` being called in useEffect?
- Is `handleBackNavigation` using `router.back()`?

### Issue: Button shows wrong text

**Check:**
- Is `cameFromPendingApprovals` state being set correctly?
- Is `document.referrer` check working?
- Is the conditional rendering correct?

### Issue: URL doesn't update

**Check:**
- Is the useEffect dependency array correct?
- Is `router.replace()` being called?
- Are filter state variables updating?

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Performance Notes

- URL updates use `router.replace()` to avoid cluttering browser history
- `scroll: false` prevents page jumping on filter changes
- Filter state is read from URL on mount (no flash of unfiltered content)

## Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Admin applies filters on /admin/approvals                   │
│ Type: VIDEO, Company: Gandhi Immigration                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ useEffect detects filter change                             │
│ Updates URL: /admin/approvals?type=VIDEO&company=abc123    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin clicks "View Asset" on a pending asset                │
│ Navigates to: /assets/xyz789                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Asset detail page loads                                     │
│ useEffect checks document.referrer                          │
│ Contains "/admin/approvals" → setCameFromPendingApprovals   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Button renders: "Back to Pending Assets"                    │
│ Breadcrumb: "Pending Assets > Asset Title"                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin clicks "Back to Pending Assets"                       │
│ handleBackNavigation() executes router.back()               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser navigates back to previous URL                      │
│ Returns to: /admin/approvals?type=VIDEO&company=abc123     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Pending approvals page loads                                │
│ useSearchParams reads: type=VIDEO, company=abc123          │
│ Initializes filter state from URL                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ ✅ Filters are applied automatically                         │
│ ✅ Filtered results are displayed                            │
│ ✅ Admin can continue reviewing                              │
└─────────────────────────────────────────────────────────────┘
```

## Success Criteria

The implementation is successful if:

1. ✅ Admin can apply filters
2. ✅ Filters persist in URL
3. ✅ Admin can navigate to asset detail
4. ✅ Button shows "Back to Pending Assets"
5. ✅ Clicking back returns to filtered view
6. ✅ Filters are still applied after returning
7. ✅ Process can be repeated multiple times
8. ✅ Page refresh preserves filters
9. ✅ Browser back/forward buttons work correctly
10. ✅ Bookmarked URLs work with filters

All criteria should be met for the feature to be considered complete.
