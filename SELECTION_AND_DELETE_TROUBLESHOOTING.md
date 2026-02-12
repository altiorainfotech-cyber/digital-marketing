# Asset Selection and Delete Button Troubleshooting

## Issues Identified

### Issue 1: Assets Not Selectable
Users were unable to select assets by clicking on them.

### Issue 2: Delete Button Not Visible
The delete button wasn't appearing even when assets should be selected.

## Root Causes

### Selection Issue
1. **Event Propagation**: The checkbox container wasn't stopping event propagation properly
2. **Click Handler Logic**: The card click handler needed better event handling
3. **Visual Feedback**: No clear indication that selection mode was active

### Delete Button Issue
1. **State Management**: The `selectedAssets` Set wasn't being updated properly
2. **Conditional Rendering**: The bulk actions bar only shows when `selectedAssets.size > 0`
3. **Event Bubbling**: Clicks on the checkbox were bubbling up to the card

## Solutions Implemented

### 1. Enhanced Event Handling

#### Grid View Checkbox Container
```typescript
<div 
  className="absolute top-3 left-3 z-10"
  onClick={(e) => e.stopPropagation()}  // Added this
>
  <Checkbox
    checked={selected || false}
    onChange={(e) => {
      e.stopPropagation();
      onSelect?.(asset.id, !selected);
    }}
    aria-label={`Select ${asset.title}`}
  />
</div>
```

#### List View Checkbox Cell
```typescript
<td 
  className="px-6 py-4 whitespace-nowrap"
  onClick={(e) => e.stopPropagation()}  // Added this
>
  <Checkbox
    checked={selected || false}
    onChange={(e) => {
      e.stopPropagation();
      onSelect?.(asset.id, !selected);
    }}
    aria-label={`Select ${asset.title}`}
  />
</td>
```

### 2. Selection Mode Indicator

Added a helpful message when no assets are selected:

```typescript
{/* Selection Mode Indicator */}
{!loading && assets.length > 0 && selectedAssets.size === 0 && (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
    <p className="text-sm text-gray-600">
      💡 Click on any asset card to select it. Select multiple assets to perform bulk actions.
    </p>
  </div>
)}
```

### 3. Bulk Actions Bar (Already Implemented)

The bulk actions bar appears when assets are selected:

```typescript
{/* Bulk Actions Bar */}
{selectedAssets.size > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-blue-900">
        {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
      </span>
      <button
        onClick={() => setSelectedAssets(new Set())}
        className="text-sm text-blue-700 hover:text-blue-900 underline"
      >
        Clear selection
      </button>
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="danger"
        size="sm"
        onClick={handleDeleteSelected}
      >
        Delete Selected
      </Button>
    </div>
  </div>
)}
```

## How It Works Now

### Selection Flow

1. **User sees assets page**
   - Helpful message appears: "Click on any asset card to select it"
   - All asset cards show checkboxes

2. **User clicks on asset card**
   - Card click handler checks if `showCheckbox` is true
   - If true, toggles selection state
   - Checkbox updates visually
   - Card shows blue ring (grid) or blue background (list)

3. **User clicks on checkbox directly**
   - Checkbox container stops propagation
   - onChange handler toggles selection
   - State updates immediately

4. **Selection state updates**
   - `selectedAssets` Set is updated
   - Bulk actions bar appears
   - Delete button becomes visible

### Delete Flow

1. **User selects one or more assets**
   - Bulk actions bar appears with count
   - "Delete Selected" button is visible

2. **User clicks "Delete Selected"**
   - Permission check runs (CONTENT_CREATOR can only delete DRAFT/PENDING)
   - Confirmation dialog appears
   - User confirms deletion

3. **Assets are deleted**
   - API calls are made for each asset
   - UI updates to remove deleted assets
   - Selection is cleared
   - Success feedback shown

## Visual Indicators

### Unselected State
- **Grid**: White background, gray border
- **List**: White background
- **Checkbox**: Empty, gray border

### Selected State
- **Grid**: Blue ring, enhanced shadow
- **List**: Light blue background
- **Checkbox**: Filled with blue, white checkmark

### Hover State
- **Grid**: Enhanced shadow
- **List**: Light gray background
- **Both**: Maintains selected state styling

## Testing Checklist

### Selection Testing
- [ ] Click on asset card body selects asset
- [ ] Click on checkbox selects asset
- [ ] Selected asset shows visual feedback (blue ring/background)
- [ ] Multiple assets can be selected
- [ ] Clicking selected asset deselects it
- [ ] Selection persists when scrolling
- [ ] Selection works in grid view
- [ ] Selection works in list view
- [ ] Selection works in company folder view

### Delete Button Testing
- [ ] Delete button appears when 1 asset is selected
- [ ] Delete button appears when multiple assets are selected
- [ ] Delete button shows correct count
- [ ] Delete button is hidden when no assets are selected
- [ ] "Clear selection" button works
- [ ] Delete button is red (danger variant)

### Permission Testing
- [ ] CONTENT_CREATOR can select DRAFT assets
- [ ] CONTENT_CREATOR can select PENDING_REVIEW assets
- [ ] CONTENT_CREATOR cannot delete APPROVED assets (error shown)
- [ ] ADMIN can select and delete any assets
- [ ] Error message shows when trying to delete non-deletable assets

### Edge Cases
- [ ] Rapid clicking doesn't cause issues
- [ ] Selecting all assets works
- [ ] Deselecting all assets hides bulk actions bar
- [ ] Deleting assets updates the list immediately
- [ ] Failed deletions show error message
- [ ] Partial deletion success is handled gracefully

## Common Issues and Solutions

### Issue: Clicking card navigates instead of selecting
**Solution**: Ensure `showCheckbox` prop is `true` on AssetCard component

### Issue: Checkbox doesn't respond to clicks
**Solution**: Check that `onSelect` callback is passed and working

### Issue: Delete button doesn't appear
**Solution**: Verify `selectedAssets.size > 0` and bulk actions bar is rendered

### Issue: Selection state doesn't update
**Solution**: Check that `setSelectedAssets` is being called with new Set

### Issue: Can't delete assets
**Solution**: Verify user has permission (CONTENT_CREATOR + DRAFT/PENDING status)

## Debugging Steps

1. **Check if checkboxes are visible**
   ```javascript
   console.log('showCheckbox:', showCheckbox);
   ```

2. **Check selection state**
   ```javascript
   console.log('selectedAssets:', Array.from(selectedAssets));
   ```

3. **Check if onSelect is called**
   ```javascript
   const handleSelectAsset = (id: string, selected: boolean) => {
     console.log('Selecting asset:', id, selected);
     // ... rest of code
   };
   ```

4. **Check bulk actions bar condition**
   ```javascript
   console.log('Should show bulk actions:', selectedAssets.size > 0);
   ```

5. **Check delete permissions**
   ```javascript
   console.log('User role:', user?.role);
   console.log('Asset status:', asset.status);
   ```

## Browser Console Commands

Test selection in browser console:
```javascript
// Check if assets are loaded
document.querySelectorAll('[data-asset-id]').length

// Check if checkboxes are visible
document.querySelectorAll('input[type="checkbox"]').length

// Simulate checkbox click
document.querySelector('input[type="checkbox"]').click()

// Check selected state
document.querySelectorAll('.ring-blue-500').length
```

## Future Enhancements

1. **Keyboard Shortcuts**
   - Ctrl+A to select all
   - Shift+Click for range selection
   - Escape to clear selection

2. **Select All Button**
   - Add checkbox in table header
   - Select/deselect all visible assets

3. **Selection Persistence**
   - Remember selection across page navigation
   - Restore selection on back button

4. **Bulk Actions Menu**
   - More actions beyond delete
   - Download selected
   - Share selected
   - Change status

5. **Selection Feedback**
   - Toast notification on selection
   - Sound effect on select/deselect
   - Animation on selection change
