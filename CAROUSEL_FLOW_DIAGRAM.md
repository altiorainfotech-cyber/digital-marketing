# CAROUSEL Asset Flow Diagram

## Upload and Approval Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAROUSEL ASSET LIFECYCLE                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   UPLOAD     │
└──────┬───────┘
       │
       ├─────────────────────────────────────────────────────────┐
       │                                                         │
       ▼                                                         ▼
┌──────────────────┐                                  ┌──────────────────┐
│  DOC Type        │                                  │  SEO Type        │
│  (Creator)       │                                  │  (SEO User)      │
└────────┬─────────┘                                  └────────┬─────────┘
         │                                                     │
         │                                                     │
         ▼                                                     ▼
   ┌──────────┐                                         ┌─────────────┐
   │  DRAFT   │                                         │ Submit for  │
   │  Status  │                                         │   Review?   │
   └────┬─────┘                                         └──────┬──────┘
        │                                                      │
        │                                                ┌─────┴─────┐
        │                                                │           │
        │                                               Yes          No
        │                                                │           │
        │                                                ▼           ▼
        │                                         ┌──────────┐  ┌──────────┐
        │                                         │ PENDING  │  │  DRAFT   │
        │                                         │  REVIEW  │  │  Status  │
        │                                         └────┬─────┘  └────┬─────┘
        │                                              │             │
        │                                              │             │
        └──────────────────────────────────────────────┼─────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  ADMIN REVIEW   │
                                              │  /admin/        │
                                              │  approvals      │
                                              └────────┬────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │                 │
                                              ▼                 ▼
                                        ┌──────────┐      ┌──────────┐
                                        │ APPROVE  │      │  REJECT  │
                                        └────┬─────┘      └────┬─────┘
                                             │                 │
                                             ▼                 ▼
                                      ┌──────────┐      ┌──────────┐
                                      │ APPROVED │      │ REJECTED │
                                      │  Status  │      │  Status  │
                                      └────┬─────┘      └────┬─────┘
                                           │                 │
                                           │                 │
                                           ▼                 ▼
                                    ┌─────────────┐   ┌─────────────┐
                                    │  Visible to │   │  Visible to │
                                    │  Users per  │   │  Uploader + │
                                    │  Visibility │   │    Admin    │
                                    └─────────────┘   └─────────────┘
```

## User Visibility Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHO CAN SEE CAROUSEL ASSETS?                         │
└─────────────────────────────────────────────────────────────────────────┘

                    │  Own    │ Others' │ Others' │ Others' │ Others' │
                    │ CAROUSEL│  DRAFT  │ PENDING │APPROVED │REJECTED │
────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
                    │         │         │         │         │         │
ADMIN               │   ✅    │   ✅    │   ✅    │   ✅    │   ✅    │
(Full Access)       │   All   │   All   │   All   │   All   │   All   │
                    │         │         │         │         │         │
────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
                    │         │         │         │         │         │
SEO SPECIALIST      │   ✅    │   ❌    │   ❌    │   ✅    │   ❌    │
(Approved Only)     │   All   │   No    │   No    │  Yes*   │   No    │
                    │         │         │         │         │         │
────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
                    │         │         │         │         │         │
CONTENT CREATOR     │   ✅    │   ❌    │   ❌    │   ✅    │   ❌    │
(Own + Shared)      │   All   │   No    │   No    │ Shared* │   No    │
                    │         │         │         │         │         │
────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

* Based on visibility settings (COMPANY, ROLE, PUBLIC, etc.)
```

## Approval Workflow Detail

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ADMIN APPROVAL PROCESS                             │
└─────────────────────────────────────────────────────────────────────────┘

    SEO User                    Admin                      System
       │                          │                           │
       │  Upload CAROUSEL         │                           │
       │  (SEO, Submit Review)    │                           │
       ├─────────────────────────>│                           │
       │                          │                           │
       │                          │  Create Asset             │
       │                          │  Status: PENDING_REVIEW   │
       │                          ├──────────────────────────>│
       │                          │                           │
       │                          │  Navigate to              │
       │                          │  /admin/approvals         │
       │                          │<──────────────────────────┤
       │                          │                           │
       │                          │  Filter by "Carousels"    │
       │                          │  (Optional)               │
       │                          │                           │
       │                          │  Review CAROUSEL          │
       │                          │  - View preview           │
       │                          │  - Check metadata         │
       │                          │  - Verify quality         │
       │                          │                           │
       │                          │  Decision:                │
       │                          │  Approve or Reject?       │
       │                          │                           │
       ├──────────────────────────┼───────────────────────────┤
       │                          │                           │
       │      APPROVE PATH        │                           │
       │                          │                           │
       │                          │  Click "Approve"          │
       │                          │  Select Visibility        │
       │                          │  Confirm                  │
       │                          ├──────────────────────────>│
       │                          │                           │
       │                          │  Update Asset             │
       │                          │  Status: APPROVED         │
       │                          │  Apply Visibility         │
       │                          │<──────────────────────────┤
       │                          │                           │
       │  Notification            │                           │
       │  "Asset Approved"        │                           │
       │<─────────────────────────┤                           │
       │                          │                           │
       │  Can now see in          │                           │
       │  /assets (APPROVED)      │                           │
       │                          │                           │
       ├──────────────────────────┼───────────────────────────┤
       │                          │                           │
       │      REJECT PATH         │                           │
       │                          │                           │
       │                          │  Click "Reject"           │
       │                          │  Enter Reason             │
       │                          │  Confirm                  │
       │                          ├──────────────────────────>│
       │                          │                           │
       │                          │  Update Asset             │
       │                          │  Status: REJECTED         │
       │                          │  Store Reason             │
       │                          │<──────────────────────────┤
       │                          │                           │
       │  Notification            │                           │
       │  "Asset Rejected"        │                           │
       │  + Reason                │                           │
       │<─────────────────────────┤                           │
       │                          │                           │
       │  Can see rejection       │                           │
       │  reason in /assets       │                           │
       │                          │                           │
```

## Visibility Settings Impact

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VISIBILITY LEVEL EFFECTS                             │
└─────────────────────────────────────────────────────────────────────────┘

UPLOADER_ONLY (Private)
├─ Uploader: ✅ Can view
├─ Admin: ✅ Can view
└─ Others: ❌ Cannot view

COMPANY
├─ Uploader: ✅ Can view
├─ Admin: ✅ Can view
├─ Same Company Users: ✅ Can view (if APPROVED)
└─ Other Company Users: ❌ Cannot view

ROLE (SEO_SPECIALIST)
├─ Uploader: ✅ Can view
├─ Admin: ✅ Can view
├─ SEO Specialists: ✅ Can view (if APPROVED)
└─ Other Roles: ❌ Cannot view

ROLE (CONTENT_CREATOR)
├─ Uploader: ✅ Can view
├─ Admin: ✅ Can view
├─ Content Creators: ✅ Can view (if APPROVED)
└─ Other Roles: ❌ Cannot view

PUBLIC
├─ Uploader: ✅ Can view
├─ Admin: ✅ Can view
└─ All Users: ✅ Can view (if APPROVED)
```

## Asset Listing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ASSET LISTING (/assets)                              │
└─────────────────────────────────────────────────────────────────────────┘

    User                    Frontend                   Backend
     │                         │                          │
     │  Navigate to /assets    │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │                         │  GET /api/assets/search  │
     │                         ├─────────────────────────>│
     │                         │                          │
     │                         │  Apply Role Filter       │
     │                         │  - Admin: All            │
     │                         │  - SEO: Own + APPROVED   │
     │                         │  - Creator: Own + Shared │
     │                         │<─────────────────────────┤
     │                         │                          │
     │  Display Assets         │                          │
     │  (Including CAROUSEL)   │                          │
     │<────────────────────────┤                          │
     │                         │                          │
     │  Filter by "Carousel"   │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │                         │  GET /api/assets/search  │
     │                         │  ?assetType=CAROUSEL     │
     │                         ├─────────────────────────>│
     │                         │                          │
     │                         │  Filter + Apply Role     │
     │                         │<─────────────────────────┤
     │                         │                          │
     │  Display Only CAROUSEL  │                          │
     │  Assets                 │                          │
     │<────────────────────────┤                          │
     │                         │                          │
```

## Key Points

1. **CAROUSEL = Regular Asset**: Treated identically to IMAGE, VIDEO, DOCUMENT, LINK
2. **Role-Based Visibility**: Same rules apply to all asset types
3. **Admin Full Access**: Admin sees everything, always
4. **SEO Approved Only**: SEO users see only APPROVED assets from others
5. **Creator Shared Only**: Creators see only explicitly shared assets from others
6. **Approval Required**: SEO type with "Submit for Review" requires Admin approval
7. **Visibility Flexible**: Admin can set visibility during approval
8. **Rejection Tracked**: Rejection reason stored and visible to uploader
