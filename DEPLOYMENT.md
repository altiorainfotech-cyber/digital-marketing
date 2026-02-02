# DASCMS Deployment Guide

This guide covers deploying the Digital Asset & SEO Content Management System (DASCMS) to production using Cloudflare Pages and Neon PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Setup](#environment-variables-setup)
3. [Database Setup](#database-setup)
4. [Cloudflare Services Setup](#cloudflare-services-setup)
5. [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] Cloudflare account with Pages enabled
- [ ] Neon PostgreSQL account and database
- [ ] Git repository connected to Cloudflare Pages
- [ ] Node.js 20+ installed locally for testing
- [ ] All Cloudflare services enabled: R2, Stream, Images

## Environment Variables Setup

### Step 1: Create Production Environment File

1. Copy the example file:
   ```bash
   cp .env.production.example .env.production
   ```

2. Fill in all required values (see sections below)

### Step 2: Generate NextAuth Secret

Generate a secure secret for NextAuth.js:

```bash
openssl rand -base64 32
```

Copy the output and set it as `NEXTAUTH_SECRET` in your `.env.production` file.

### Step 3: Set Production URL

Update `NEXTAUTH_URL` to your production domain:

```env
NEXTAUTH_URL="https://your-domain.com"
```

## Database Setup

### Step 1: Create Neon Database

1. Log in to [Neon Console](https://console.neon.tech)
2. Create a new project named "dascms-production"
3. Create a database named "dascms_production"
4. Copy the connection string

### Step 2: Configure Database URL

Update `DATABASE_URL` in `.env.production`:

```env
DATABASE_URL='postgresql://username:password@your-neon-host.neon.tech/dascms_production?sslmode=require&channel_binding=require'
```

### Step 3: Run Migrations

Apply database migrations to production:

```bash
# Set production database URL
export DATABASE_URL='your-production-database-url'

# Generate Prisma client
npm run db:generate

# Apply migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

**Important**: Use `prisma migrate deploy` (not `migrate dev`) for production deployments.

## Cloudflare Services Setup

### Cloudflare R2 (Document Storage)

1. Navigate to **R2** in Cloudflare dashboard
2. Create a new bucket: `dascms-documents-prod`
3. Go to **R2 API Tokens** and create a new token with:
   - Permissions: Read & Write
   - Bucket: `dascms-documents-prod`
4. Copy the credentials:
   - Access Key ID → `R2_ACCESS_KEY_ID`
   - Secret Access Key → `R2_SECRET_ACCESS_KEY`
   - Account ID → `R2_ACCOUNT_ID`
5. (Optional) Set up custom domain for R2 bucket
6. Update `R2_PUBLIC_URL` with your custom domain or R2.dev URL

### Cloudflare Stream (Video Storage)

1. Navigate to **Stream** in Cloudflare dashboard
2. Go to **API Tokens**
3. Create a new token with Stream permissions
4. Copy the credentials:
   - Account ID → `STREAM_ACCOUNT_ID`
   - API Token → `STREAM_API_TOKEN`

### Cloudflare Images (Image Storage)

1. Navigate to **Images** in Cloudflare dashboard
2. Go to **API Tokens**
3. Create a new token with Images permissions
4. Copy the credentials:
   - Account ID → `IMAGES_ACCOUNT_ID`
   - API Token → `IMAGES_API_TOKEN`
   - Account Hash → `IMAGES_ACCOUNT_HASH` (found in Images dashboard)

## Cloudflare Pages Deployment

### Step 1: Connect Repository

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages**
3. Click **Create a project**
4. Connect your Git repository (GitHub/GitLab)
5. Select the repository containing DASCMS

### Step 2: Configure Build Settings

Set the following build configuration:

- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `dascms` (if monorepo, otherwise leave empty)
- **Node version**: 20.x

### Step 3: Set Environment Variables

In Cloudflare Pages project settings, add all environment variables from `.env.production`:

**Database:**
- `DATABASE_URL`

**NextAuth.js:**
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

**Cloudflare R2:**
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

**Cloudflare Stream:**
- `STREAM_ACCOUNT_ID`
- `STREAM_API_TOKEN`

**Cloudflare Images:**
- `IMAGES_ACCOUNT_ID`
- `IMAGES_API_TOKEN`
- `IMAGES_ACCOUNT_HASH`

**Application:**
- `NODE_ENV` = `production`

### Step 4: Configure Build Settings (Advanced)

Add these build settings in Cloudflare Pages:

1. **Environment variables for build**:
   ```
   NODE_VERSION=20
   NPM_FLAGS=--legacy-peer-deps
   ```

2. **Build command** (if using monorepo):
   ```bash
   cd dascms && npm install && npm run db:generate && npm run build
   ```

3. **Functions** (if using Cloudflare Functions):
   - Enable Functions
   - Set compatibility date to latest

### Step 5: Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (5-10 minutes)
3. Cloudflare will provide a deployment URL: `https://dascms.pages.dev`

### Step 6: Custom Domain (Optional)

1. In Pages project settings, go to **Custom domains**
2. Add your custom domain: `your-domain.com`
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable to match custom domain
5. Redeploy the project

## Post-Deployment Verification

### Step 1: Health Check

Visit your deployment URL and verify:

- [ ] Homepage loads without errors
- [ ] Login page is accessible
- [ ] API routes respond (check `/api/auth/session`)

### Step 2: Database Verification

Check database connection:

```bash
# Connect to production database
npx prisma studio --browser none

# Verify tables exist
npx prisma db pull
```

### Step 3: Storage Verification

Test storage services:

1. Log in as Admin
2. Upload a test image → verify Cloudflare Images
3. Upload a test video → verify Cloudflare Stream
4. Upload a test document → verify Cloudflare R2

### Step 4: Create Initial Admin User

Connect to production database and create admin user:

```bash
# Option 1: Using Prisma Studio
npx prisma studio

# Option 2: Using SQL
psql $DATABASE_URL
```

Create admin user (use bcrypt to hash password):

```typescript
// Run this in a Node.js script or Prisma Studio
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash('your-secure-password', 10);

// Then create user in database with:
// email: admin@yourdomain.com
// password: <hashedPassword>
// role: ADMIN
```

### Step 5: Test Core Workflows

1. **Authentication**: Log in with admin credentials
2. **Company Management**: Create a test company
3. **User Management**: Create a test user
4. **Asset Upload**: Upload SEO and Doc assets
5. **Approval Workflow**: Approve/reject assets
6. **Visibility Control**: Test different visibility levels
7. **Platform Usage**: Log platform usage
8. **Download Tracking**: Download an asset
9. **Audit Logs**: View audit log entries

## Troubleshooting

### Build Failures

**Issue**: Build fails with "Cannot find module '@prisma/client'"

**Solution**: Ensure `db:generate` runs before build:
```bash
npm run db:generate && npm run build
```

**Issue**: Build fails with memory errors

**Solution**: Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Database Connection Issues

**Issue**: "Connection refused" or "SSL required"

**Solution**: Verify connection string includes `sslmode=require`:
```env
DATABASE_URL='postgresql://...?sslmode=require&channel_binding=require'
```

**Issue**: "Too many connections"

**Solution**: Use Neon pooled connection string (ends with `-pooler`)

### Cloudflare Storage Issues

**Issue**: "Access denied" when uploading to R2

**Solution**: Verify R2 API token has Read & Write permissions

**Issue**: Images not displaying

**Solution**: Check CORS settings on R2 bucket and verify `R2_PUBLIC_URL`

### NextAuth Issues

**Issue**: "Invalid session" or "CSRF token mismatch"

**Solution**: 
1. Verify `NEXTAUTH_URL` matches deployment URL exactly
2. Regenerate `NEXTAUTH_SECRET`
3. Clear browser cookies and try again

**Issue**: Redirects to wrong URL after login

**Solution**: Update `NEXTAUTH_URL` to production domain and redeploy

### Performance Issues

**Issue**: Slow page loads

**Solution**:
1. Enable Cloudflare CDN caching
2. Optimize images using Cloudflare Images variants
3. Use Neon read replicas for read-heavy operations

## Rollback Procedure

If deployment fails or issues arise:

1. **Rollback deployment** in Cloudflare Pages:
   - Go to Deployments tab
   - Find previous working deployment
   - Click "Rollback to this deployment"

2. **Rollback database migrations** (if needed):
   ```bash
   # Revert last migration
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Restore environment variables** to previous working state

## Monitoring and Maintenance

### Recommended Monitoring

1. **Cloudflare Analytics**: Monitor traffic and performance
2. **Neon Monitoring**: Track database performance and connections
3. **Error Tracking**: Consider adding Sentry or similar service
4. **Uptime Monitoring**: Use UptimeRobot or Pingdom

### Regular Maintenance

- **Weekly**: Review audit logs for suspicious activity
- **Monthly**: Check storage usage and costs
- **Quarterly**: Review and rotate API tokens
- **As needed**: Apply database migrations for new features

## Security Checklist

Before going live:

- [ ] All environment variables use production values
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Database uses strong password
- [ ] All Cloudflare API tokens have minimal required permissions
- [ ] HTTPS is enforced (automatic with Cloudflare Pages)
- [ ] CORS is properly configured on R2 bucket
- [ ] Rate limiting is enabled (Cloudflare WAF)
- [ ] Admin user has strong password
- [ ] Audit logging is enabled and working

## Support

For issues or questions:

1. Check [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/)
2. Check [Neon documentation](https://neon.tech/docs)
3. Review application logs in Cloudflare Pages dashboard
4. Check database logs in Neon console

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Stream Documentation](https://developers.cloudflare.com/stream/)
- [Cloudflare Images Documentation](https://developers.cloudflare.com/images/)
