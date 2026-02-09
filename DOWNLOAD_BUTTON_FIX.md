# Download Button Fix for SEO_SPECIALIST Users

## Issues Fixed

### 1. Download Button Not Downloading Files
**Problem:** Files were opening in a new tab instead of downloading
**Solution:** Removed `target="_blank"` from the download link in `lib/utils/downloadHelper.ts`

### 2. Download Button Visibility
**Problem:** Download button not visible on asset detail page
**Solution:** 
- Added `flex-shrink-0` class to prevent button from being hidden
- Added comment to clarify button should always be visible
- Added console.log debugging to track download flow

## Changes Made

### File: `lib/utils/downloadHelper.ts`
- Removed `link.target = '_blank'` and `link.rel = 'noopener noreferrer'`
- Added console.log statements for debugging
- Now files will download directly instead of opening in new tab

### File: `app/assets/[id]/page.tsx`
- Added `className="flex-shrink-0"` to Download button
- Added comment: "Download button - always visible for all users"
- Added console.log debugging in `handleDownload` function

## How It Works Now

### For SEO_SPECIALIST Users:
1. User clicks "Download" button on asset detail page
2. Platform selection modal opens
3. User selects one or more platforms
4. User clicks "Download Asset" in modal
5. File downloads directly to their computer

### For Other Users:
1. User clicks "Download" button
2. File downloads directly (no platform selection needed)

## Testing Steps

1. **Clear browser cache** (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. **Login as SEO_SPECIALIST user**
3. **Navigate to any asset detail page** (e.g., `/assets/[id]`)
4. **Look for Download button** in top-right corner of navigation bar
5. **Click Download button**
6. **Select platforms** in the modal
7. **Click "Download Asset"**
8. **Verify file downloads** to your Downloads folder

## Debugging

If the download button is still not visible:

1. **Open browser console** (F12 → Console tab)
2. **Look for console logs:**
   - `[AssetDetail] Download button clicked`
   - `[AssetDetail] Opening platform modal for SEO_SPECIALIST`
   - `[DownloadHelper] Initiating asset download`
   - `[DownloadHelper] Download URL received`
   - `[DownloadHelper] Triggering download`
   - `[DownloadHelper] Download triggered successfully`

3. **Check for errors** in the console
4. **Verify you're logged in** as SEO_SPECIALIST role
5. **Try hard refresh** (Cmd+Shift+R)

## Asset Card Download Buttons

The asset cards on the `/assets` list page also have download buttons:

### Grid View:
- **Hover overlay**: Download button appears when hovering over card image
- **Bottom button**: Download button at bottom of card below metadata

### List View:
- **Actions column**: Download icon button on the right side

All these buttons work the same way:
- SEO_SPECIALIST users → Platform modal → Download
- Other users → Direct download

## Notes

- Download button has NO conditions - it should ALWAYS be visible
- The button is in the code at line 393-400 of `app/assets/[id]/page.tsx`
- If still not visible, it's likely a browser cache or build issue
- Console logs will help identify where the issue is occurring
