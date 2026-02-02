# Rejection Reason Display Fix

## Issues Fixed

### 1. VisibilityService Error
**Error:** `TypeError: this.visibilityService.canUserViewAsset is not a function`

**Root Cause:** The versions route was instantiating `VisibilityChecker` with `prisma` instead of `VisibilityService`.

**Fix:** Updated `app/api/assets/[id]/versions/route.ts` to properly instantiate services:
```typescript
// Before
const visibilityChecker = new VisibilityChecker(prisma as any);

// After
const visibilityService = new VisibilityService(prisma as any);
const visibilityChecker = new VisibilityChecker(visibilityService);
```

### 2. Rejection Reason Not Visible to Users
**Issue:** When admin rejects an asset with a reason, users couldn't see the rejection reason in the asset list.

**Fix:** Added rejection reason display to both grid and list views in `AssetCard` component.

## Changes Made

### 1. Fixed VisibilityChecker Instantiation
**File:** `app/api/assets/[id]/versions/route.ts`
- Added `VisibilityService` import
- Created `visibilityService` instance
- Passed `visibilityService` to `VisibilityChecker` constructor

### 2. Updated AssetCard Component
**File:** `components/assets/AssetCard.tsx`

#### Added rejectionReason to Interface
```typescript
export interface AssetCardData {
  // ... other fields
  rejectionReason?: string;
}
```

#### Grid View - Added Rejection Reason Display
```typescript
{/* Rejection Reason */}
{asset.status === AssetStatus.REJECTED && asset.rejectionReason && (
  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
    <strong>Rejected:</strong> {asset.rejectionReason}
  </div>
)}
```

#### List View - Added Rejection Reason Display
```typescript
{asset.status === AssetStatus.REJECTED && asset.rejectionReason && (
  <div className="text-xs text-red-600 mt-1 truncate max-w-md">
    <strong>Rejected:</strong> {asset.rejectionReason}
  </div>
)}
```

### 3. Ensured SearchService Returns Rejection Reason
**File:** `lib/services/SearchService.ts`
- Confirmed `rejectionReason` is included in asset mapping
- Already present, just added comment for clarity

## How It Works Now

### Asset List View (Grid)
When an asset is rejected:
1. Shows red "REJECTED" badge
2. Displays rejection reason in a red box below the title
3. Format: "Rejected: [reason text]"

### Asset List View (List)
When an asset is rejected:
1. Shows red "REJECTED" badge
2. Displays rejection reason below the asset title in red text
3. Replaces description with rejection reason for rejected assets

### Asset Detail Page
When an asset is rejected:
1. Shows prominent rejection reason banner at the top
2. Includes rejection date
3. Full rejection reason text displayed

## User Experience

### For Users Who Uploaded Assets
1. **In Asset List:**
   - Immediately see rejection status with red badge
   - See rejection reason without clicking into asset
   - Can quickly understand why asset was rejected

2. **In Asset Detail:**
   - Full rejection reason with timestamp
   - Can see all asset details along with rejection info

### For Admins
1. **When Rejecting:**
   - Must provide rejection reason (required field)
   - Reason is stored in database

2. **Viewing Rejected Assets:**
   - Can see rejection reasons they or other admins provided
   - Full audit trail maintained

## Testing

### Test Rejection Reason Display

1. **As Admin:**
   ```
   - Go to Pending Approvals
   - Click "Reject" on an asset
   - Enter reason: "Image quality is too low for publication"
   - Submit rejection
   ```

2. **As User (Asset Owner):**
   ```
   - Go to Assets page
   - See rejected asset with red badge
   - See rejection reason: "Rejected: Image quality is too low for publication"
   - Click on asset to see full details
   - See rejection reason banner with timestamp
   ```

3. **Verify in Different Views:**
   - Grid view: Rejection reason in red box
   - List view: Rejection reason below title
   - Detail page: Rejection reason banner at top

## Files Modified

1. `app/api/assets/[id]/versions/route.ts` - Fixed VisibilityChecker instantiation
2. `components/assets/AssetCard.tsx` - Added rejection reason display
3. `lib/services/SearchService.ts` - Confirmed rejection reason included

## Benefits

✅ Users immediately see why their assets were rejected
✅ No need to click into each asset to see rejection reason
✅ Clear visual indication with red styling
✅ Consistent display across grid, list, and detail views
✅ Improved user experience and transparency
✅ Faster workflow for users to understand and fix issues

## No Breaking Changes

- All existing functionality preserved
- Only added new display elements
- Backward compatible with assets without rejection reasons
