# SEO SPECIALIST Company Filter - Visual Guide

## Filter Location

The company filter appears in the **Filter Panel** on the Assets page, alongside other filters.

## Desktop View (4 columns)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ASSETS PAGE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  [Search box...]                                    [Calendar Filter]    │
│                                                                          │
│  🔍 Filters (4) ▼                                   [Grid] [List] [📁]  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Asset Type   │  │ Status       │  │ Upload Type  │  │ Company      ││
│  │ ▼ All Types  │  │ ▼ All Status │  │ ▼ All Types  │  │ ▼ All Comp.  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                          │
│  Sort By: [Upload Date ▼]  Order: [Desc ▼]  [Clear All Filters]       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tablet View (2 columns)

```
┌────────────────────────────────────────────────┐
│              ASSETS PAGE                        │
├────────────────────────────────────────────────┤
│  [Search box...]          [Calendar]           │
│                                                 │
│  🔍 Filters (4) ▼          [Grid] [List] [📁] │
│  ──────────────────────────────────────────── │
│                                                 │
│  ┌────────────────┐  ┌────────────────┐       │
│  │ Asset Type     │  │ Status         │       │
│  │ ▼ All Types    │  │ ▼ All Statuses │       │
│  └────────────────┘  └────────────────┘       │
│                                                 │
│  ┌────────────────┐  ┌────────────────┐       │
│  │ Upload Type    │  │ Company        │       │
│  │ ▼ All Types    │  │ ▼ All Companies│       │
│  └────────────────┘  └────────────────┘       │
│                                                 │
│  Sort By: [Upload Date ▼]                     │
│  Order: [Desc ▼]                               │
│  [Clear All Filters]                           │
└────────────────────────────────────────────────┘
```

## Mobile View (1 column - Stacked)

```
┌──────────────────────────────────┐
│        ASSETS PAGE               │
├──────────────────────────────────┤
│  [Search box...............]     │
│  [📅 Calendar]                   │
│                                  │
│  🔍 Filters (4) ▼   [Grid] [📁] │
│  ──────────────────────────────  │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Asset Type                 │ │
│  │ ▼ All Types                │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Status                     │ │
│  │ ▼ All Statuses             │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Upload Type                │ │
│  │ ▼ All Types                │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Company                    │ │
│  │ ▼ All Companies            │ │
│  └────────────────────────────┘ │
│                                  │
│  Sort By: [Upload Date ▼]      │
│  Order: [Desc ▼]                │
│  [Clear All Filters]            │
└──────────────────────────────────┘
```

## Company Dropdown Options

When SEO SPECIALIST clicks on the Company dropdown:

```
┌────────────────────────────┐
│ Company                    │
│ ▼ All Companies            │ ← Currently selected
├────────────────────────────┤
│ ✓ All Companies            │ ← Default option
│   Acme Corporation         │
│   TechStart Inc            │
│   Global Media Group       │
│   Digital Solutions Ltd    │
│   Creative Agency Co       │
└────────────────────────────┘
```

After selecting a company:

```
┌────────────────────────────┐
│ Company                    │
│ ▼ Acme Corporation         │ ← Selected company
└────────────────────────────┘
```

## Filter Badge Indicator

When company filter is active, the filter count badge updates:

```
Before selection:
🔍 Filters (3) ▼

After selecting company:
🔍 Filters (4) ▼  ← Count increased
```

## User Roles Comparison

### ADMIN User View:
```
Filters visible:
✓ Asset Type
✓ Status
✓ Upload Type
✓ Company          ← Available
```

### SEO_SPECIALIST User View:
```
Filters visible:
✓ Asset Type
✓ Status
✓ Upload Type
✓ Company          ← Available (NEW!)
```

### CONTENT_CREATOR User View:
```
Filters visible:
✓ Show Assets From (Uploader Scope)
✓ Asset Type
✓ Status
✓ Upload Type
✗ Company          ← NOT available
```

## Filter Interaction Flow

### Step-by-Step Usage:

1. **Initial State**
   ```
   Company: [All Companies ▼]
   Assets shown: All visible assets (200 assets)
   ```

2. **Click Dropdown**
   ```
   Company: [All Companies ▼] ← Dropdown opens
   ├─ All Companies
   ├─ Acme Corporation
   ├─ TechStart Inc
   └─ ...
   ```

3. **Select Company**
   ```
   Company: [Acme Corporation ▼]
   Assets shown: Only Acme assets (45 assets)
   Filter badge: (4) ← Increased
   ```

4. **Combined Filters**
   ```
   Asset Type: [Image ▼]
   Status: [Approved ▼]
   Company: [Acme Corporation ▼]
   
   Assets shown: Approved images from Acme (12 assets)
   Filter badge: (3)
   ```

5. **Clear Filter**
   ```
   Option A: Select "All Companies" from dropdown
   Option B: Click "Clear All Filters" button
   
   Result: Company filter removed, all assets shown
   ```

## Mobile Touch Interaction

On mobile devices, the company filter uses native select UI:

### iOS:
```
┌──────────────────────────────────┐
│  Company                         │
│  All Companies              ▼    │
└──────────────────────────────────┘
         ↓ Tap
┌──────────────────────────────────┐
│  Company                         │
│                                  │
│  ┌────────────────────────────┐ │
│  │  All Companies         ✓   │ │
│  │  Acme Corporation          │ │
│  │  TechStart Inc             │ │
│  │  Global Media Group        │ │
│  │  [Cancel]         [Done]   │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

### Android:
```
┌──────────────────────────────────┐
│  Company                         │
│  All Companies              ▼    │
└──────────────────────────────────┘
         ↓ Tap
┌──────────────────────────────────┐
│  Select Company                  │
├──────────────────────────────────┤
│  ○ All Companies                 │
│  ○ Acme Corporation              │
│  ○ TechStart Inc                 │
│  ○ Global Media Group            │
│  ○ Digital Solutions Ltd         │
└──────────────────────────────────┘
```

## Responsive Breakpoints

The filter grid adapts at these breakpoints:

- **Mobile (< 768px)**: 1 column, stacked vertically
- **Tablet (768px - 1023px)**: 2 columns, 2x2 grid
- **Desktop (≥ 1024px)**: 4 columns, single row

## Visual States

### Default State:
```
┌────────────────────────────┐
│ Company                    │
│ ▼ All Companies            │
└────────────────────────────┘
```

### Hover State (Desktop):
```
┌────────────────────────────┐
│ Company                    │
│ ▼ All Companies            │ ← Slightly darker border
└────────────────────────────┘
```

### Focus State:
```
┌────────────────────────────┐
│ Company                    │
│ ▼ All Companies            │ ← Blue ring/outline
└────────────────────────────┘
```

### Active/Selected State:
```
┌────────────────────────────┐
│ Company                    │
│ ▼ Acme Corporation         │ ← Shows selected value
└────────────────────────────┘
```

## Integration with Other Features

### With Search:
```
Search: "logo"
Company: [Acme Corporation ▼]
Result: Logo assets from Acme Corporation
```

### With Date Filter:
```
Date: [Jan 15, 2024]
Company: [Acme Corporation ▼]
Result: Assets from Acme uploaded on Jan 15, 2024
```

### With Pagination:
```
Company: [Acme Corporation ▼]
Page 1 of 3 (45 assets from Acme)
[< Previous] [1] [2] [3] [Next >]
```

### With View Modes:
```
Company: [Acme Corporation ▼]
View: [Grid] [List] [Company Folders]
Filter persists across all view modes
```

## Accessibility Features

- ✓ Keyboard navigable (Tab, Arrow keys, Enter)
- ✓ Screen reader compatible
- ✓ Clear labels and ARIA attributes
- ✓ Focus indicators visible
- ✓ Touch targets ≥ 44x44px on mobile

## Performance Notes

- Companies loaded once on page mount
- Filter changes trigger efficient API queries
- Results cached during pagination
- Smooth transitions and interactions
- No layout shift when filter applied

---

This visual guide demonstrates how the company filter integrates seamlessly into the existing filter system while maintaining mobile responsiveness and accessibility standards.
