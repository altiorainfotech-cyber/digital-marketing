# Download URL Generation Fix

## Problem
Users were experiencing "Failed to generate download URL" errors when attempting to download assets.

## Root Causes Identified

1. **Missing Optional Credentials**: The `StorageService` required Stream and Images API credentials even though all files are stored in R2
2. **Insufficient Error Handling**: Error messages weren't providing enough detail to diagnose issues
3. **Configuration Validation**: No validation of R2 credentials at initialization

## Changes Made

### 1. Updated Type Definitions (`types/index.ts`)
- Made Stream and Images credentials optional in `StorageConfig` interface
- Only R2 credentials are now required since all file types use R2 storage

### 2. Enhanced StorageService (`lib/services/StorageService.ts`)
- Added validation in constructor to check required R2 credentials
- Improved error handling in `generateR2SignedUrl()` method
- Updated `validateConfig()` to only require R2 credentials
- Added detailed error messages for troubleshooting

### 3. Improved DownloadService (`lib/services/DownloadService.ts`)
- Added validation to check if asset has a storage URL
- Added detailed logging for debugging
- Enhanced error handling with try-catch wrapper
- Better error messages for troubleshooting

### 4. Enhanced Download API Route (`app/api/assets/[id]/download/route.ts`)
- Added detailed logging for download requests
- Improved error response to include error details
- Better error categorization (404, 400, 403, 500)

### 5. Improved AssetCard Component (`components/assets/AssetCard.tsx`)
- Enhanced error handling to parse and display server error messages
- Added validation to check if download URL is received
- Better error logging for debugging

## Testing

### Test Storage Configuration
Run the test script to verify your storage configuration:

```bash
npx tsx scripts/test-download.ts
```

This will:
- Check if all required R2 credentials are set
- Validate the storage configuration
- Test signed URL generation

### Manual Testing
1. Log in to the application
2. Navigate to an asset
3. Click the download button
4. Check browser console for detailed error messages if it fails

## Environment Variables Required

Ensure these variables are set in your `.env` file:

```env
# Required for downloads
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"
R2_PUBLIC_URL="https://your-public-url.r2.dev"

# Optional (not needed if using R2 for all files)
STREAM_ACCOUNT_ID=""
STREAM_API_TOKEN=""
IMAGES_ACCOUNT_ID=""
IMAGES_API_TOKEN=""
```

## Troubleshooting

### Error: "Missing required R2 configuration"
**Cause**: One or more R2 environment variables are not set

**Solution**: 
1. Check your `.env` file
2. Ensure all R2 variables are set correctly
3. Restart your development server

### Error: "Asset has no storage URL"
**Cause**: The asset record in the database doesn't have a storage URL

**Solution**:
1. Check if the asset was uploaded correctly
2. Verify the upload process completed successfully
3. Check the asset record in the database

### Error: "Failed to generate download URL"
**Cause**: Issue with R2 credentials or network connectivity

**Solution**:
1. Verify R2 credentials are correct
2. Check R2 bucket exists and is accessible
3. Verify network connectivity to Cloudflare R2
4. Check browser console and server logs for detailed error messages

### Download URL Generated but File Not Found
**Cause**: File doesn't exist in R2 bucket at the specified path

**Solution**:
1. Verify the file was uploaded to R2
2. Check the storage URL format in the database
3. Use the R2 dashboard to verify file exists
4. Run: `npx tsx scripts/list-r2-files.ts` to list all files in bucket

## How Downloads Work

1. **User clicks download button** → Triggers `handleDownload()` in AssetCard
2. **POST request to API** → `/api/assets/[id]/download`
3. **Authentication check** → Verifies user is logged in
4. **Asset validation** → Checks asset exists and has storage URL
5. **Generate signed URL** → Creates temporary URL with expiration (default 1 hour)
6. **Log download** → Records download in database and audit log
7. **Return URL** → Client opens URL in new tab to download file

## Security Features

- **Signed URLs**: All download URLs are temporary and expire after 1 hour
- **Authentication**: Users must be logged in to download
- **Audit Logging**: All downloads are logged with user, timestamp, and platform intent
- **Access Control**: Future enhancement for role-based download permissions

## Next Steps

If issues persist:
1. Check server logs for detailed error messages
2. Run the test script to validate configuration
3. Verify R2 bucket CORS settings allow downloads
4. Check R2 bucket permissions for the access key
