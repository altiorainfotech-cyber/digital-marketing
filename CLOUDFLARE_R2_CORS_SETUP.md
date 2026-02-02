# Fix CORS Error for Cloudflare R2 Uploads

## The Problem

You're seeing this error:
```
Access to XMLHttpRequest at 'https://digitalmarketing.9c22162cd4763f9e41394570a2e9c856.r2.cloudflarestorage.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

This means your R2 bucket doesn't allow uploads from your local development server.

## Solution: Configure CORS in Cloudflare Dashboard

### Method 1: Using Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Login to your account

2. **Navigate to R2**
   - Click on "R2" in the left sidebar
   - Find and click on your bucket: `digitalmarketing`

3. **Open Settings**
   - Click on the "Settings" tab
   - Scroll down to "CORS Policy"

4. **Add CORS Policy**
   - Click "Add CORS Policy" or "Edit CORS Policy"
   - Add the following configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Save the Configuration**
   - Click "Save" or "Update"
   - Wait a few seconds for the changes to propagate

### Method 2: Using Wrangler CLI

If you have Wrangler installed, you can configure CORS via command line:

1. **Create a CORS configuration file** (`cors.json`):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

2. **Apply the CORS configuration**:

```bash
wrangler r2 bucket cors put digitalmarketing --file cors.json
```

### Method 3: Using AWS CLI (S3-Compatible)

If you have AWS CLI configured:

```bash
aws s3api put-bucket-cors \
  --bucket digitalmarketing \
  --cors-configuration file://cors.json \
  --endpoint-url https://9c22162cd4763f9e41394570a2e9c856.r2.cloudflarestorage.com
```

## CORS Configuration Explained

```json
{
  "AllowedOrigins": [
    "http://localhost:3000"  // Your development server
  ],
  "AllowedMethods": [
    "GET",    // Download files
    "PUT",    // Upload files (presigned URLs)
    "POST",   // Alternative upload method
    "DELETE", // Delete files
    "HEAD"    // Check file existence
  ],
  "AllowedHeaders": [
    "*"       // Allow all headers (Content-Type, etc.)
  ],
  "ExposeHeaders": [
    "ETag"    // Allow browser to read ETag header
  ],
  "MaxAgeSeconds": 3600  // Cache preflight requests for 1 hour
}
```

## For Production

When deploying to production, update the CORS policy to include your production domain:

```json
{
  "AllowedOrigins": [
    "http://localhost:3000",           // Development
    "https://your-domain.com",         // Production
    "https://www.your-domain.com"      // Production with www
  ],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

## Security Best Practices

### Development
- Allow `http://localhost:3000` for local testing
- Allow `http://localhost:3001` if you use different ports

### Production
- Only allow your actual production domain(s)
- Use HTTPS only (no HTTP)
- Be specific with allowed origins (don't use `*`)

### Example Production CORS:
```json
{
  "AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
  ],
  "AllowedMethods": ["GET", "PUT", "HEAD"],
  "AllowedHeaders": ["Content-Type", "Content-Length"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

## Verify CORS is Working

After configuring CORS:

1. **Wait 30-60 seconds** for changes to propagate
2. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. **Try uploading again** at http://localhost:3000/assets/upload
4. **Check browser console** - CORS errors should be gone

## Troubleshooting

### CORS errors still appearing?
- Wait a bit longer (up to 5 minutes)
- Clear browser cache
- Try in incognito/private window
- Verify the origin matches exactly (http vs https, port number)

### Can't find CORS settings in dashboard?
- Make sure you're in the R2 section
- Click on the bucket name
- Look for "Settings" tab
- CORS Policy should be there

### Wrangler command not working?
- Install Wrangler: `npm install -g wrangler`
- Login: `wrangler login`
- Try the command again

## Alternative: Server-Side Upload (If CORS is problematic)

If you can't configure CORS or prefer server-side uploads, you can modify the upload flow to send files through your Next.js API instead of directly to R2. However, this is less efficient and not recommended for large files.

## Next Steps

1. ✅ Configure CORS in Cloudflare R2 dashboard
2. ✅ Wait for changes to propagate (30-60 seconds)
3. ✅ Refresh browser and try uploading again
4. ✅ Verify files appear in R2 bucket

Once CORS is configured, your uploads will work perfectly! 🚀
