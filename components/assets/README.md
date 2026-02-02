# Asset Components

This directory contains reusable components for asset management.

## ShareModal

A modal component for sharing Doc assets with specific users.

### Features

- **User Selection Interface**: Search and select users to share assets with
- **Current Shares Display**: View all users who currently have access to the asset
- **Share/Revoke Actions**: Add or remove user access with a single click
- **Real-time Updates**: Automatically refreshes the share list after changes
- **Permission Validation**: Only available for Doc assets with UPLOADER_ONLY or SELECTED_USERS visibility

### Requirements

Implements requirements 13.1-13.5:
- 13.1: Allow selection of specific users
- 13.2: Create AssetShare records for each recipient
- 13.3: Shared users can access the asset
- 13.4: Revoke sharing functionality
- 13.5: Audit logging for all sharing actions

### Usage

```tsx
import { ShareModal } from '@/components/assets';

function AssetDetailPage() {
  const [showShareModal, setShowShareModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowShareModal(true)}>
        Share
      </button>
      
      <ShareModal
        assetId="asset-id"
        assetTitle="My Asset"
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        currentUserId="user-id"
      />
    </>
  );
}
```

### Props

- `assetId` (string): ID of the asset to share
- `assetTitle` (string): Title of the asset (displayed in modal header)
- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Callback when modal is closed
- `currentUserId` (string): ID of the current user (excluded from selection)

### Behavior

1. **Opening the Modal**: Loads all users and current shares
2. **Searching Users**: Filter users by name or email
3. **Selecting Users**: Check/uncheck users to share with
4. **Sharing**: Click "Share" to grant access to selected users
5. **Revoking**: Click "Revoke" next to a user to remove their access
6. **Closing**: Click "Cancel" or the X button to close without changes

### API Integration

The component integrates with the following API endpoints:

- `GET /api/users` - Fetch all users for selection
- `GET /api/assets/[id]/share` - Fetch current shares
- `POST /api/assets/[id]/share` - Share asset with users
- `DELETE /api/assets/[id]/share/[userId]` - Revoke share

### Validation

- Only the asset uploader can share their assets
- Assets must be Doc type with UPLOADER_ONLY or SELECTED_USERS visibility
- Cannot share with yourself
- Duplicate shares are prevented

### Notifications

When an asset is shared, the recipient receives an in-app notification with:
- Title: "Asset Shared With You"
- Message: "[Sharer Name] shared '[Asset Title]' with you"
- Link to the asset

### Audit Logging

All sharing actions are logged in the audit log with:
- User ID of the sharer
- Asset ID
- List of users shared with
- Timestamp
- IP address and user agent
