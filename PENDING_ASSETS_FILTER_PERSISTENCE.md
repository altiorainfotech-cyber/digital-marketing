# Pending Assets Filter Persistence Implementation

## Overview
Implemented filter persistence for the admin pending assets page so that when an admin navigates to an asset detail page and clicks back, their applied filters are preserved.

## Problem
Previously, when an admin:
1. Applied filters on the pending assets page (type, company, date)
2. Clicked on an asset to view details
3. Clicked "Back to Assets" button

The filters would be lost and the admin would have to reapply them.

## Solution
Implemented URL-based filter persistence using Next.js search params:

### Changes Made

#### 1. `/app/admin/approvals/page.tsx`
- Added `useSearchParams` hook to read URL parameters
- Initialize filter state from URL params on page load
- Added `useEffect` to update URL when filters change
- Filters are now stored in URL query parameters:
  - `?type=IMAGE` - Asset type filter
  - `?company=abc123` - Company filter
  - `?date=last7days` - Date filter

**Key Changes:**
```typescript
// Import useSearchParams
import { useRouter, useSearchParams } from 'next/navigation';

// Initialize filters from URL
const searchParams = useSearchParams();
const [filterType, setFilterType] = useState<string>(searchParams.get('type') || '');
const [filterCompany, setFilterCompany] = useState<string>(searchParams.get('company') || '');
const [filterDate, setFilterDate] = useState<string>(searchParams.get('date') || '');

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams();
  if (filterType) params.set('type', filterType);
  if (filterCompany) params.set('company', filterCompany);
  if (filterDate) params.set('date', filterDate);
  
  const queryString = params.toString();
  const newUrl = queryString ? `/admin/approvals?${queryString}` : '/admin/approvals';
  router.replace(newUrl, { scroll: false });
}, [filterType, filterCompany, filterDate, router]);
```

#### 2. `/app/assets/[id]/page.tsx`
- Added state to track if user came from pending approvals page
- Added `handleBackNavigation` function with smart routing logic
- Updated button text to show "Back to Pending Assets" when appropriate
- Updated breadcrumb to show correct path and label
- Fixed admin navigation to use `/admin/assets` instead of `/assets`

**Key Changes:**
```typescript
// Track if user came from pending approvals
const [cameFromPendingApprovals, setCameFromPendingApprovals] = useState(false);

useEffect(() => {
  if (typeof window !== 'undefined' && document.referrer.includes('/admin/approvals')) {
    setCameFromPendingApprovals(true);
  }
}, []);

// Smart back navigation
const handleBackNavigation = () => {
  if (cameFromPendingApprovals) {
    router.back(); // Preserves filters in URL
  } else if (isAdmin) {
    router.push('/admin/assets');
  } else {
    router.push('/assets');
  }
};

// Dynamic button text
<Button onClick={handleBackNavigation}>
  {cameFromPendingApprovals ? 'Back to Pending Assets' : 'Back to Assets'}
</Button>

// Dynamic breadcrumb
const breadcrumbItems = [
  { 
    label: cameFromPendingApprovals ? 'Pending Assets' : 'Assets', 
    href: cameFromPendingApprovals ? '/admin/approvals' : (isAdmin ? '/admin/assets' : '/assets')
  },
  { label: asset.title, href: `/assets/${asset.id}` },
];
```

## User Experience

### Before
1. Admin applies filters: Type = "IMAGE", Company = "Acme Corp"
2. Admin clicks on an asset to view details
3. Admin clicks "Back to Assets"
4. ❌ Filters are lost, showing all pending assets
5. Admin must reapply filters

### After
1. Admin applies filters: Type = "IMAGE", Company = "Acme Corp"
2. URL updates to: `/admin/approvals?type=IMAGE&company=abc123`
3. Admin clicks "View Asset" on a pending asset card
4. Asset detail page shows "Back to Pending Assets" button
5. Breadcrumb shows "Pending Assets > Asset Title"
6. Admin clicks "Back to Pending Assets"
7. ✅ Returns to `/admin/approvals?type=IMAGE&company=abc123`
8. ✅ Filters are automatically restored from URL
9. ✅ Admin can continue reviewing with filters intact

## Benefits

1. **Filter Persistence**: Filters survive navigation and page refreshes
2. **Shareable URLs**: Admins can bookmark or share filtered views
3. **Browser History**: Back/forward buttons work correctly with filters
4. **No Additional Storage**: Uses URL params instead of localStorage/sessionStorage
5. **SEO Friendly**: Clean, readable URLs
6. **Context-Aware UI**: Button text and breadcrumbs adapt to navigation context
7. **Correct Admin Routing**: Admin users navigate to `/admin/assets` instead of `/assets`

## Technical Details

### URL Parameter Format
- Parameters are added as query strings
- Empty filters are omitted from URL
- Uses `router.replace()` to avoid cluttering browser history
- `scroll: false` prevents page scroll on filter changes

### Navigation Logic
- Checks `document.referrer` to detect source page
- Uses `router.back()` for browser history navigation
- Falls back to direct navigation for bookmarked links

### Edge Cases Handled
- Direct URL access with filters works correctly
- Page refresh preserves filters
- Multiple filter combinations work together
- Clearing filters removes URL parameters
- Works with bulk selection and actions

## Testing Checklist

- [x] Apply single filter and navigate to asset detail
- [x] Apply multiple filters and navigate to asset detail
- [x] Click back button - filters should persist
- [x] Refresh page - filters should persist
- [x] Clear filters - URL should update
- [x] Direct URL access with filters works
- [x] Bookmark filtered URL and revisit
- [x] Browser back/forward buttons work correctly

## Future Enhancements

Potential improvements for future iterations:

1. **Scroll Position**: Preserve scroll position when returning
2. **Selected Assets**: Persist bulk selection state
3. **Sort Order**: Add sort preferences to URL
4. **View Mode**: Persist grid/list view preference
5. **Expanded Sections**: Remember which sections were expanded

## Related Files

- `/app/admin/approvals/page.tsx` - Main pending approvals page
- `/app/assets/[id]/page.tsx` - Asset detail page
- `/app/admin/assets/page.tsx` - Could benefit from same pattern

## Notes

- This pattern can be applied to other filtered pages in the application
- URL-based state is preferred over localStorage for better UX
- The implementation is backward compatible with existing bookmarks
