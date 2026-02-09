# Doc Upload 500 Error Fix

## Issue
Content Creator users were getting a **500 Internal Server Error** when uploading to "Doc (Private)" section:
```
POST /api/assets/presign 500 (Internal Server Error)
```

## Root Cause
The upload form was **always requiring a company** to be selected, even for Doc uploads. However, the backend validation explicitly rejects Doc uploads with a company:

```typescript
// AssetService.ts line 171
if (uploadType === UploadType.DOC && companyId) {
  throw new Error('Doc uploads should not have a company assigned');
}
```

This created a conflict:
- Frontend: "Company is required" (for all uploads)
- Backend: "Doc uploads should not have a company assigned"

## Solution
Updated `app/assets/upload/page.tsx` to make company field **conditional**:

### Changes Made

1. **Company field now only shows for SEO uploads:**
   ```typescript
   {/* Company - Required for SEO uploads only */}
   {uploadType === UploadType.SEO && (
     <div className="mb-6">
       <Select label="Company" ... />
     </div>
   )}
   ```

2. **Updated validation logic:**
   ```typescript
   const validateForm = (): string | null => {
     // Company is only required for SEO uploads
     if (uploadType === UploadType.SEO && !companyId) {
       return 'Company is required for SEO/Digital Marketing uploads';
     }
     // ... rest of validation
   };
   ```

3. **Fixed API calls to only send companyId for SEO uploads:**
   ```typescript
   companyId: uploadType === UploadType.SEO ? companyId : undefined
   ```

## Expected Behavior After Fix

### For SEO Uploads
- ✅ Company field is visible and required
- ✅ Validation enforces company selection
- ✅ companyId is sent to backend

### For Doc (Private) Uploads
- ✅ Company field is hidden
- ✅ No company validation
- ✅ companyId is NOT sent to backend (undefined)
- ✅ Upload succeeds without 500 error

## Testing
1. Login as CONTENT_CREATOR
2. Go to Upload page
3. Select "Doc (Private)" mode
4. Notice company field is now hidden
5. Upload a file
6. ✅ Should succeed without 500 error
