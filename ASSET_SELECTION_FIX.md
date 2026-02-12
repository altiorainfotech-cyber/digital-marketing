# Asset Selection Fix

## Problem
When users tried to select assets using checkboxes, clicking on the asset card would navigate to the asset detail page instead of selecting the asset.

## Root Cause
The entire asset card had an `onClick` handler that navigated to the asset detail page. While the checkbox had a `stopPropagation()` call, clicking anywhere else on the card would trigger navigation instead of selection.

## Solution

### Updated Click Behavior
Modified the click handlers in both grid and list views to check if checkboxes are visible. When checkboxes are shown, clicking anywhere on the card (except action buttons) will toggle selection instead of navigating.

### Changes Made

#### 1. Grid View (AssetCardGrid)

**Before:**
```typescript
const handleCardClick = (e: React.MouseEvent) => {
  // Don't navigate if clicking checkbox or action buttons
  if ((e.target as HTMLElement).closest('input, button')) {
    return;
  }
  router.push(`/assets/${asset.id}`);
};
```

**After:**
```typescript
const handleCardClick = (e: React.MouseEvent) => {
  // If checkboxes are shown, clicking the card should toggle selection
  if (showCheckbox && onSelect) {
    // Don't toggle if clicking action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect(asset.id, !selected);
    return;
  }
  
  // Otherwise, navigate to asset detail (but not if clicking checkbox or buttons)
  if ((e.target as HTMLElement).closest('input, button')) {
    return;
  }
  router.push(`/assets/${asset.id}`);
};
```

#### 2. List View (AssetCardList)

**Before:**
```typescript
const handleRowClick = (e: React.MouseEvent) => {
  // Don't navigate if clicking checkbox or action buttons
  if ((e.target as HTMLElement).closest('input, button')) {
    return;
  }
  router.push(`/assets/${asset.id}`);
};
```

**After:**
```typescript
const handleRowClick = (e: React.MouseEvent) => {
  // If checkboxes are shown, clicking the row should toggle selection
  if (showCheckbox && onSelect) {
    // Don't toggle if clicking action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect(asset.id, !selected);
    return;
  }
  
  // Otherwise, navigate to asset detail (but not if clicking checkbox or buttons)
  if ((e.target as HTMLElement).closest('input, button')) {
    return;
  }
  router.push(`/assets/${asset.id}`);
};
```

### Visual Feedback

Added visual indicators to show when an asset is selected:

#### Grid View
```typescript
<div
  className={`bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group relative ${
    selected ? 'ring-2 ring-blue-500 shadow-lg' : ''
  }`}
>
```

**Selected State:**
- Blue ring around the card
- Enhanced shadow
- Clear visual distinction from unselected cards

#### List View
```typescript
<tr
  className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
    selected ? 'bg-blue-50' : ''
  }`}
>
```

**Selected State:**
- Light blue background
- Maintains hover effect
- Clear visual distinction from unselected rows

## User Experience

### Before Fix
1. User clicks on asset card
2. Browser navigates to asset detail page
3. User cannot select multiple assets
4. Bulk operations are impossible

### After Fix
1. User sees checkboxes on asset cards
2. User clicks anywhere on the card
3. Asset is selected (checkbox toggles)
4. Card shows visual feedback (blue ring/background)
5. User can select multiple assets
6. Bulk operations (delete) work as expected

### Navigation Behavior
- **With checkboxes visible**: Click card = select asset
- **Without checkboxes**: Click card = navigate to detail page
- **Action buttons**: Always perform their specific action (View, Download)

## Testing Checklist

### Grid View
- [ ] Click on card body selects asset
- [ ] Click on checkbox selects asset
- [ ] Click on "View" button navigates to detail page
- [ ] Click on "Download" button downloads asset
- [ ] Selected card shows blue ring
- [ ] Multiple cards can be selected
- [ ] Clicking selected card deselects it

### List View
- [ ] Click on row selects asset
- [ ] Click on checkbox selects asset
- [ ] Click on action buttons performs action
- [ ] Selected row shows blue background
- [ ] Multiple rows can be selected
- [ ] Clicking selected row deselects it

### Company Folder View
- [ ] Assets within folders can be selected
- [ ] Selection works same as grid view
- [ ] Visual feedback is consistent

### Edge Cases
- [ ] Rapid clicking doesn't cause navigation
- [ ] Selecting while hovering shows both hover and selected states
- [ ] Keyboard navigation still works (if implemented)
- [ ] Touch devices can select assets

## Technical Details

### Click Event Handling
1. Check if `showCheckbox` prop is true
2. If true and `onSelect` callback exists:
   - Check if click target is a button
   - If not a button, toggle selection
   - Return early to prevent navigation
3. If false or no `onSelect`:
   - Check if click target is input or button
   - If not, navigate to asset detail page

### Visual State Management
- Uses conditional className with template literals
- Applies Tailwind CSS classes based on `selected` prop
- Maintains existing hover and transition effects
- Ensures accessibility with proper contrast

## Benefits

1. **Intuitive Selection**: Users can click anywhere on the card to select
2. **Clear Feedback**: Visual indicators show selected state
3. **Consistent Behavior**: Same logic in grid and list views
4. **Preserved Navigation**: Action buttons still work as expected
5. **Better UX**: No accidental navigation when trying to select
6. **Bulk Operations**: Enables efficient multi-asset management

## Future Enhancements

1. **Keyboard Selection**: Add keyboard shortcuts (Shift+Click, Ctrl+Click)
2. **Select All**: Add "Select All" checkbox in table header
3. **Selection Count**: Show count of selected assets in header
4. **Drag Selection**: Allow dragging to select multiple assets
5. **Context Menu**: Right-click menu for bulk actions
6. **Selection Persistence**: Remember selection across page navigation
