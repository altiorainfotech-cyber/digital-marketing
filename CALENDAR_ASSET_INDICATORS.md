# Calendar Asset Date Indicators

## Overview
Added visual indicators to the calendar date filter showing which dates have assets uploaded. Users can now quickly see which days contain assets with small image icons displayed under the date numbers.

## Changes Made

### 1. Calendar Component (`lib/design-system/components/composite/Calendar/Calendar.tsx`)
- Added `datesWithAssets` prop to accept dates that have assets
- Modified date button rendering to show a small image icon under dates with assets
- Dates with assets now have a light blue background (`bg-blue-50`)
- Icon color adapts: blue for normal dates, white for selected dates
- Updated accessibility labels to include "has assets" information

### 2. CalendarFilter Component (`components/assets/CalendarFilter.tsx`)
- Added state management for `datesWithAssets`
- Fetches asset dates from API when calendar opens
- Passes asset dates to CalendarModal component
- Caches dates to avoid repeated API calls

### 3. New API Endpoint (`app/api/assets/dates/route.ts`)
- Created `/api/assets/dates` endpoint
- Returns all unique dates (YYYY-MM-DD format) that have assets
- Respects user permissions (filters by company for non-admin users)
- Sorted date list for consistent ordering

## Visual Design

### Date with Assets
- Light blue background (`bg-blue-50`)
- Small image icon (3x3) displayed below the date number
- Icon uses blue color (`text-blue-600`) for normal state
- Icon uses white color when date is selected

### Selected Date with Assets
- Blue background (`bg-blue-600`)
- White text and white icon
- Maintains hover state (`hover:bg-blue-700`)

## User Experience
1. User clicks "Filter by Date" button
2. Calendar modal opens and fetches asset dates
3. Dates with assets show blue background + small image icon
4. User can quickly identify which dates have content
5. Clicking a date filters assets to that specific day

## Technical Details
- Asset dates are fetched once per calendar session
- API returns dates in ISO format (YYYY-MM-DD)
- Frontend converts strings to Date objects for comparison
- Icon uses SVG for crisp rendering at any size
- Fully accessible with ARIA labels
