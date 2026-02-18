# Filter Persistence Implementation for SEO SPECIALIST Users

## Problem Statement
When SEO SPECIALIST users navigated from the Assets page or Download History page to an asset detail page and clicked back, they lost their applied filters and scroll position. Additionally, when coming from the Download History page, the back button would incorrectly navigate to the Assets page instead of returning to Download History.

## Solution Overview
Implemented URL-based filter persistence and proper back navigation using:
1. URL search parameters to store filter state
2. SessionStorage to track scroll position and navigation source
3. `router.back()` for consistent back navigation that preserves state

## Changes Made

### 1. Assets Page (`app/assets/page.tsx`)

#### Added URL Parameter Support
- Import `useSearchParams` from Next.js
- Initialize all filters from URL parameters on page load
- Update URL whenever filters change using `router.replace()`
- Preserve scroll position using sessionStorage

#### Key Features
- Filters persist in URL: `?query=test&assetType=IMAGE&status=APPROVED`
- Scroll position saved before navigating to asset detail
- Scroll position restored when returning from asset detail
- All filters (query, assetType, status, uploadType, companyId, sortBy, sortOrder, date, uploaderScope) are URL-persisted

#### Code Changes
```typescript
// Initialize from URL params
const searchParams = useSearchParams();
const [filters, setFilters] = useState<SearchFilters>({
  query: searchParams.get('query') || '',
  assetType: searchParams.get('assetType') || '',
  // ... all other filters
});

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  // ... add all filters to params
  
  const queryString = params.toString();
  const newUrl = queryString ? `/assets?${queryString}` : '/assets';
  router.replace(newUrl, { scroll: false });
}, [filters, router]);

// Store scroll position before navigation
useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href^="/assets/"]')) {
      sessionStorage.setItem('assetsScrollPosition', window.scrollY.toString());
    }
  };
  
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []);

// Restore scroll position on mount
useEffect(() => {
  const savedScrollPosition = sessionStorage.getItem('assetsScrollPosition');
  if (savedScrollPosition && assets.length > 0) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScrollPosition, 10));
      sessionStorage.removeItem('assetsScrollPosition');
    }, 100);
  }
}, [assets]);
```

### 2. Download History Page (`app/downloads/page.tsx`)

#### Added URL Parameter Support
- Import `useSearchParams` from Next.js
- Initialize all filters from URL parameters
- Update URL whenever filters change
- Track navigation source using sessionStorage flag

#### Key Features
- Filters persist in URL: `?platform=INSTAGRAM&company=Gandhi&dateFrom=2024-01-01`
- Scroll position saved before navigating to asset detail
- Sets `cameFromDownloads` flag in sessionStorage for proper back navigation
- All filters (platform, company, dateFrom, dateTo) are URL-persisted

#### Code Changes
```typescript
// Initialize from URL params
const searchParams = useSearchParams();
const [filterPlatform, setFilterPlatform] = useState<Platform | ''>(
  (searchParams.get('platform') as Platform) || ''
);
const [filterCompany, setFilterCompany] = useState<string>(
  searchParams.get('company') || ''
);
// ... other filters

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams();
  if (filterPlatform) params.set('platform', filterPlatform);
  if (filterCompany) params.set('company', filterCompany);
  // ... add all filters
  
  const queryString = params.toString();
  const newUrl = queryString ? `/downloads?${queryString}` : '/downloads';
  router.replace(newUrl, { scroll: false });
}, [filterPlatform, filterCompany, filterDateFrom, filterDateTo, router]);

// Store scroll position and source flag before navigation
useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href^="/assets/"]')) {
      sessionStorage.setItem('downloadsScrollPosition', window.scrollY.toString());
      sessionStorage.setItem('cameFromDownloads', 'true');
    }
  };
  
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []);
```

### 3. Asset Detail Page (`app/assets/[id]/page.tsx`)

#### Improved Back Navigation
- Detect navigation source (Downloads, Pending Approvals, or Assets)
- Always use `router.back()` to preserve filter state
- Update button text based on navigation source

#### Key Features
- Detects if user came from Download History page using sessionStorage flag
- Detects if user came from Pending Approvals using document.referrer
- Always uses `router.back()` which preserves URL parameters
- Shows correct back button text: "Back to Download History", "Back to Pending Assets", or "Back"

#### Code Changes
```typescript
// Detect navigation source
const [cameFromPendingApprovals, setCameFromPendingApprovals] = useState(false);
const [cameFromDownloads, setCameFromDownloads] = useState(false);

useEffect(() => {
  if (typeof window !== 'undefined') {
    if (document.referrer.includes('/admin/approvals')) {
      setCameFromPendingApprovals(true);
    }
    const fromDownloads = sessionStorage.getItem('cameFromDownloads');
    if (fromDownloads === 'true') {
      setCameFromDownloads(true);
      sessionStorage.removeItem('cameFromDownloads');
    }
  }
}, []);

// Always use router.back() to preserve state
const handleBackNavigation = () => {
  router.back();
};

// Update button text based on source
<Button onClick={handleBackNavigation}>
  {cameFromDownloads ? 'Back to Download History' : 
   cameFromPendingApprovals ? 'Back to Pending Assets' : 'Back'}
</Button>
```

## User Experience Flow

### Scenario 1: Assets Page → Asset Detail → Back
1. User applies filters on Assets page (e.g., Type: IMAGE, Status: APPROVED)
2. URL updates to `/assets?assetType=IMAGE&status=APPROVED`
3. User clicks on an asset
4. Scroll position saved to sessionStorage
5. User views asset detail page
6. User clicks "Back" button
7. `router.back()` returns to `/assets?assetType=IMAGE&status=APPROVED`
8. Filters are restored from URL parameters
9. Scroll position is restored from sessionStorage
10. User sees the same filtered view at the same scroll position

### Scenario 2: Download History → Asset Detail → Back
1. User applies filters on Download History page (e.g., Platform: INSTAGRAM)
2. URL updates to `/downloads?platform=INSTAGRAM`
3. User clicks on an asset
4. Scroll position saved to sessionStorage
5. `cameFromDownloads` flag set in sessionStorage
6. User views asset detail page
7. Back button shows "Back to Download History"
8. User clicks "Back" button
9. `router.back()` returns to `/downloads?platform=INSTAGRAM`
10. Filters are restored from URL parameters
11. Scroll position is restored from sessionStorage
12. User sees the same filtered view at the same scroll position

## Technical Implementation Details

### Why URL Parameters?
- Browser-native state management
- Shareable URLs with filters applied
- Works with browser back/forward buttons
- Persists across page refreshes
- Matches the pattern already used in Pending Approvals page

### Why SessionStorage for Scroll Position?
- Scroll position is ephemeral (not needed after navigation)
- Doesn't clutter URL
- Automatically cleared when tab is closed
- Fast access without URL parsing

### Why router.back()?
- Preserves the entire navigation history
- Maintains URL parameters automatically
- Works with browser back button
- Simpler than manual navigation logic

## Benefits

1. **Improved User Experience**: Users don't lose their work when exploring assets
2. **Consistency**: Matches the behavior of the Pending Approvals page
3. **Efficiency**: Users can quickly review multiple assets without re-applying filters
4. **Shareable State**: Users can bookmark or share filtered views
5. **Browser Integration**: Works seamlessly with browser back/forward buttons

## Testing Checklist

- [x] Assets page filters persist in URL
- [x] Download History filters persist in URL
- [x] Scroll position restored on Assets page
- [x] Scroll position restored on Download History page
- [x] Back button from asset detail returns to correct page
- [x] Back button shows correct text based on source
- [x] Filters are restored when returning from asset detail
- [x] No TypeScript compilation errors
- [x] Works for SEO_SPECIALIST role
- [x] Works for other roles (ADMIN, CONTENT_CREATOR)

## Future Enhancements

1. Add view mode (grid/list/company) to URL parameters
2. Add page number to URL for pagination state
3. Consider using URL hash for scroll position as alternative
4. Add filter presets that can be saved and shared
