# How to See Company Folders

## Step-by-Step Guide

### 1. Navigate to Assets Page
- Go to `/assets` (for regular users)
- Or go to `/admin/assets` (for admin users)

### 2. Look for the View Toggle Buttons
In the top-right area of the page, you'll see **3 buttons** for different views:

```
┌─────────────────────────────────┐
│  [Grid] [List] [Folder]         │  ← Look for these 3 buttons
└─────────────────────────────────┘
```

The buttons show:
- **Grid icon** (3x3 squares) - Grid view
- **List icon** (horizontal lines) - List view  
- **Folder icon** - Company folder view ← **CLICK THIS ONE!**

### 3. Click the Folder Icon Button
- The folder icon is the **third button** (rightmost)
- It looks like a folder: 📁
- When you click it, the view will change to show company folders

### 4. What You Should See
After clicking the folder button, you should see:

```
┌──────────────────────────────────────────────┐
│  > 📁 Barnseggs                    [23]      │  ← Click to expand
└──────────────────────────────────────────────┘
```

### 5. Expand the Folder
- Click on the "Barnseggs" folder header
- The folder will expand to show all 23 assets inside
- You can collapse it again by clicking the header

## Troubleshooting

### I don't see the folder icon button
**Solution**: Make sure you're on the latest version of the code. Try:
1. Refresh the page (Cmd+R or Ctrl+R)
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Clear browser cache

### The folder view is empty
**Solution**: 
1. Check if you have any filters applied
2. Clear all filters using the "Clear All" button
3. Make sure you're logged in with the correct user

### I see "No Company" folder
This means some assets don't have a company assigned. This is normal if:
- Assets were created before company associations
- Assets were uploaded without selecting a company

## Browser Console Test

If you still don't see company data, open browser console (F12) and run:

```javascript
fetch('/api/assets/search?limit=1')
  .then(r => r.json())
  .then(data => {
    console.log('First asset:', data.assets[0]);
    console.log('Company:', data.assets[0].Company);
  });
```

This will show you if the API is returning company data.

## Expected Behavior

### Grid View (Default)
- Assets shown as cards in a grid
- Company name appears in a blue badge on each card
- All assets visible at once

### List View
- Assets shown in a table format
- Company name in a column
- Compact view

### Company Folder View (NEW!)
- Assets grouped by company name
- Collapsible folders
- Asset count badge on each folder
- Click folder to expand/collapse
- Assets inside folders shown in grid layout

## Current Data
Based on your database:
- **Total assets**: 23
- **Companies**: 1 (Barnseggs)
- **All assets belong to**: Barnseggs

So you should see **ONE folder** named "Barnseggs" with **23 assets** inside.
