# Cloudflare Pages Setup Guide

This guide provides step-by-step instructions for deploying DASCMS to Cloudflare Pages.

## Prerequisites

- Cloudflare account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)
- Code pushed to repository
- All environment variables ready (see `.env.production.example`)

## Step 1: Create Cloudflare Pages Project

### 1.1 Access Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create application**
4. Select **Pages** tab
5. Click **Connect to Git**

### 1.2 Connect Git Repository

1. Choose your Git provider (GitHub, GitLab, or Bitbucket)
2. Authorize Cloudflare to access your repositories
3. Select the repository containing DASCMS
4. Click **Begin setup**

## Step 2: Configure Build Settings

### 2.1 Basic Settings

Set the following in the build configuration:

| Setting | Value |
|---------|-------|
| **Project name** | `dascms` (or your preferred name) |
| **Production branch** | `main` (or your default branch) |
| **Framework preset** | `Next.js` |
| **Build command** | `npm run build` |
| **Build output directory** | `.next` |

### 2.2 Advanced Settings

Click **Add build settings** and configure:

#### Root Directory
- If DASCMS is in a subdirectory (monorepo): `dascms`
- If DASCMS is at repository root: leave empty

#### Environment Variables (Build)

Add these for the build process:

```
NODE_VERSION=20
```

### 2.3 Build Command (Advanced)

If you need to run Prisma generation before build, use this custom build command:

```bash
npm install && npm run db:generate && npm run build
```

Or for monorepo:

```bash
cd dascms && npm install && npm run db:generate && npm run build
```

## Step 3: Configure Environment Variables

### 3.1 Access Environment Variables

1. In your Pages project, go to **Settings**
2. Click **Environment variables**
3. Add variables for **Production** environment

### 3.2 Required Environment Variables

Add all of these variables:

#### Database
```
DATABASE_URL = postgresql://username:password@host.neon.tech/database?sslmode=require
```

#### NextAuth.js
```
NEXTAUTH_URL = https://your-domain.com
NEXTAUTH_SECRET = <generate with: openssl rand -base64 32>
```

#### Cloudflare R2
```
R2_ACCOUNT_ID = your-cloudflare-account-id
R2_ACCESS_KEY_ID = your-r2-access-key-id
R2_SECRET_ACCESS_KEY = your-r2-secret-access-key
R2_BUCKET_NAME = dascms-documents-prod
R2_PUBLIC_URL = https://documents.your-domain.com
```

#### Cloudflare Stream
```
STREAM_ACCOUNT_ID = your-cloudflare-account-id
STREAM_API_TOKEN = your-stream-api-token
```

#### Cloudflare Images
```
IMAGES_ACCOUNT_ID = your-cloudflare-account-id
IMAGES_API_TOKEN = your-images-api-token
IMAGES_ACCOUNT_HASH = your-images-account-hash
```

#### Application
```
NODE_ENV = production
```

### 3.3 Preview Environment (Optional)

If you want preview deployments to use different credentials:

1. Switch to **Preview** tab in environment variables
2. Add the same variables with preview/staging values

## Step 4: Deploy

### 4.1 Initial Deployment

1. Click **Save and Deploy**
2. Cloudflare will:
   - Clone your repository
   - Install dependencies
   - Run build command
   - Deploy to edge network
3. Wait 5-10 minutes for first deployment

### 4.2 Monitor Build

1. Watch the build logs in real-time
2. Look for any errors or warnings
3. Common issues:
   - Missing environment variables
   - Prisma client not generated
   - TypeScript errors
   - Build timeout (increase in settings if needed)

### 4.3 Deployment URL

Once deployed, you'll get a URL like:
```
https://dascms.pages.dev
```

Or with custom subdomain:
```
https://dascms-abc.pages.dev
```

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain

1. In Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `app.yourdomain.com`
4. Click **Continue**

### 5.2 Configure DNS

Cloudflare will provide DNS instructions:

**Option A: Domain on Cloudflare**
- DNS records added automatically
- SSL certificate provisioned automatically

**Option B: Domain elsewhere**
- Add CNAME record: `app.yourdomain.com` → `dascms.pages.dev`
- Wait for DNS propagation (up to 24 hours)

### 5.3 Update Environment Variables

After custom domain is active:

1. Go to **Settings** → **Environment variables**
2. Update `NEXTAUTH_URL` to your custom domain:
   ```
   NEXTAUTH_URL = https://app.yourdomain.com
   ```
3. Save changes
4. Trigger a new deployment (see Step 6)

## Step 6: Redeploy

### 6.1 Manual Redeploy

To redeploy after changing environment variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Retry deployment**

### 6.2 Automatic Deploys

Cloudflare Pages automatically deploys when you:
- Push to production branch (e.g., `main`)
- Merge a pull request
- Create a new tag

### 6.3 Preview Deployments

Every pull request gets a preview deployment:
- Unique URL for testing
- Uses preview environment variables
- Automatically deleted when PR is closed

## Step 7: Configure Build Settings (Advanced)

### 7.1 Build Configuration

In **Settings** → **Builds & deployments**:

#### Build Cache
- Enable build cache for faster builds
- Caches `node_modules` and `.next/cache`

#### Build Timeout
- Default: 20 minutes
- Increase if builds timeout

#### Concurrent Builds
- Default: 1
- Increase for faster preview deployments (paid plans)

### 7.2 Branch Deployments

Configure which branches trigger deployments:

1. Go to **Settings** → **Builds & deployments**
2. Under **Branch deployments**, configure:
   - **Production branch**: `main`
   - **Preview branches**: All branches or specific patterns

### 7.3 Build Notifications

Set up notifications for build status:

1. Go to **Settings** → **Notifications**
2. Add email or webhook for:
   - Build failures
   - Deployment success
   - Preview deployments

## Step 8: Verify Deployment

### 8.1 Health Checks

Visit these URLs to verify deployment:

```
https://your-domain.com/
https://your-domain.com/auth/signin
https://your-domain.com/api/auth/session
```

### 8.2 Check Logs

View logs in Cloudflare Pages:

1. Go to **Deployments** tab
2. Click on latest deployment
3. View **Build logs** and **Function logs**

### 8.3 Test Functionality

Run through the deployment checklist:
- See `DEPLOYMENT_CHECKLIST.md`

## Step 9: Continuous Deployment

### 9.1 Git Workflow

Recommended workflow:

```bash
# Development
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature
# Creates preview deployment

# Review preview deployment
# Merge to main when ready
git checkout main
git merge feature/new-feature
git push origin main
# Triggers production deployment
```

### 9.2 Rollback

If deployment has issues:

1. Go to **Deployments** tab
2. Find previous working deployment
3. Click **⋯** → **Rollback to this deployment**
4. Confirm rollback

### 9.3 Deployment Protection

Enable deployment protection (paid plans):

1. Go to **Settings** → **Builds & deployments**
2. Enable **Deployment protection**
3. Require approval before production deploys

## Troubleshooting

### Build Fails: "Cannot find module '@prisma/client'"

**Solution**: Ensure Prisma client is generated before build:

```bash
npm run db:generate && npm run build
```

Update build command in Pages settings.

### Build Fails: "Out of memory"

**Solution**: Increase Node.js memory:

1. Add environment variable:
   ```
   NODE_OPTIONS = --max-old-space-size=4096
   ```
2. Or update build command:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

### Build Fails: "Module not found"

**Solution**: Clear build cache:

1. Go to **Settings** → **Builds & deployments**
2. Click **Clear build cache**
3. Retry deployment

### Runtime Error: "Database connection failed"

**Solution**: Verify `DATABASE_URL` environment variable:

1. Check it's set in **Production** environment
2. Verify connection string is correct
3. Test connection locally with same URL

### Runtime Error: "NEXTAUTH_URL mismatch"

**Solution**: Ensure `NEXTAUTH_URL` matches deployment URL:

1. Update environment variable
2. Redeploy
3. Clear browser cookies

### Slow Build Times

**Solutions**:
- Enable build cache
- Use `npm ci` instead of `npm install`
- Optimize dependencies
- Consider upgrading to paid plan for faster builds

### Preview Deployments Not Working

**Solution**: Check branch deployment settings:

1. Go to **Settings** → **Builds & deployments**
2. Ensure preview branches are enabled
3. Check branch name patterns

## Best Practices

### 1. Environment Variables

- Never commit `.env` files to Git
- Use different values for preview and production
- Rotate secrets regularly
- Use strong `NEXTAUTH_SECRET`

### 2. Database

- Use Neon pooled connection string
- Enable connection pooling
- Monitor connection usage
- Set up read replicas for scaling

### 3. Deployments

- Test in preview before merging to main
- Use semantic versioning for releases
- Tag production deployments
- Keep deployment history for rollbacks

### 4. Monitoring

- Enable Cloudflare Analytics
- Set up error tracking (Sentry)
- Monitor build times
- Track deployment frequency

### 5. Security

- Enable HTTPS (automatic)
- Use Cloudflare WAF for protection
- Enable rate limiting
- Review security headers

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)

## Support

For issues:

1. Check [Cloudflare Community](https://community.cloudflare.com/)
2. Review [Cloudflare Status](https://www.cloudflarestatus.com/)
3. Contact Cloudflare Support (paid plans)
4. Check application logs in Pages dashboard
