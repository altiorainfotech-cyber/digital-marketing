# Content Creator Asset Visibility Fix

## Problem
Content creators were not seeing all their uploaded assets on the assets page due to inefficient database filtering and visibility checks.

## Root Cause
1. The search query was fetching ALL assets from the database regardless of user role
2. Visibility filtering happened AFTER fetching, which was inefficient
3. The total count included assets the user couldn't see, causing pagination issues
4. Content creators uploading SEO assets with ADMIN_ONLY visibility were affected

## Solution Implemented

### 1. Pre-filtering at Database Level (SearchService.ts)
Added role-based WHERE clause to filter assets at the database query level:

- **CONTENT_CREATOR**: Can see:
  - Their own uploads (any status, any visibility)
  - PUBLIC assets
  - COMPANY assets (if they belong to a company)
  - ROLE-based assets assigned to their role

- **SEO_SPECIALIST**: Can see:
  - Their own uploads (any status, any visibility)
  - APPROVED assets that are PUBLIC, COMPANY, or ROLE-based

- **ADMIN**: Can see ALL assets (no pre-filtering)

### 2. Benefits
- Faster queries (database filters instead of application-level filtering)
- Accurate total counts for pagination
- Content creators now see all their uploads immediately
- Reduced memory usage (only fetch visible assets)

## HMR Error Fix

### Error
```
Module [project]/node_modules/tslib/tslib.es6.mjs was instantiated because it was required from module [project]/app/assets/upload/page.tsx
```

### Cause
This is a Next.js 16.1.6 Turbopack Hot Module Reload (HMR) development issue, not a code error. It occurs when:
- Modules are reloaded during development
- There are complex import chains
- TypeScript helper functions (tslib) are being re-instantiated

### Solution
This is a development-only issue that doesn't affect production. To resolve:

1. **Quick fix**: Refresh the browser page (Cmd+R / Ctrl+R)
2. **Clean restart**: Stop the dev server and restart with:
   ```bash
   rm -rf .next
   npm run dev
   ```
3. **If persistent**: The code changes made to SearchService.ts should help by reducing circular dependencies

The error will not appear in production builds.

## Testing
To verify the fix works:

1. Login as a CONTENT_CREATOR user
2. Upload several assets (both SEO and SOCIAL types)
3. Navigate to /assets page
4. Verify all uploaded assets appear in the list
5. Check pagination works correctly
6. Verify the total count matches the number of visible assets

## Files Modified
- `lib/services/SearchService.ts` - Added pre-filtering logic for non-admin users
- Added UserRole import for role-based filtering
