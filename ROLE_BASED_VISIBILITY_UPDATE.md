# Role-Based Visibility Update

## Summary
Updated the asset approval system to support 4 specific visibility levels for admin users when approving assets.

## Changes Made

### 1. Database Schema Update
- Added `allowedRole` field to the `Asset` model in `prisma/schema.prisma`
- Field type: `UserRole?` (optional)
- Created and applied migration: `20260202115504_add_allowed_role_to_asset`

### 2. Admin Approvals Page (`app/admin/approvals/page.tsx`)
Updated visibility options to show only 4 levels:
- **Private (Uploader Only)** - Only the uploader can view
- **Public (Everyone)** - Everyone can view
- **SEO Specialist Role** - Only users with SEO_SPECIALIST role can view
- **Content Creator Role** - Only users with CONTENT_CREATOR role can view

### 3. Approval Service (`lib/services/ApprovalService.ts`)
- Added `allowedRole` parameter to `ApproveAssetParams` interface
- Updated `approveAsset` method to handle role-based visibility
- Added audit logging for `allowedRole` changes

### 4. Approval API Route (`app/api/assets/[id]/approve/route.ts`)
- Updated to accept `allowedRole` parameter from request body
- Passes `allowedRole` to the approval service

## How It Works

When an admin approves an asset and selects a role-based visibility option:

1. Frontend sends:
   - `newVisibility: "ROLE"`
   - `allowedRole: "SEO_SPECIALIST"` or `"CONTENT_CREATOR"`

2. Backend stores:
   - `visibility` field set to `ROLE`
   - `allowedRole` field set to the specific role

3. Visibility checking logic can now use both fields to determine access

## Usage

When approving an asset, admins can now select:
- **Private** → Sets visibility to `UPLOADER_ONLY`
- **Public** → Sets visibility to `PUBLIC`
- **SEO Specialist Role** → Sets visibility to `ROLE` with `allowedRole = SEO_SPECIALIST`
- **Content Creator Role** → Sets visibility to `ROLE` with `allowedRole = CONTENT_CREATOR`

## Next Steps

To fully implement role-based visibility, you may need to update:
1. `VisibilityChecker` service to check the `allowedRole` field when visibility is `ROLE`
2. Asset listing queries to filter based on user role and `allowedRole`
3. Asset detail pages to respect role-based visibility
