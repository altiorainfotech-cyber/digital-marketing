# Database Setup Guide

This guide walks you through setting up the Neon PostgreSQL database for DASCMS.

## Prerequisites

- Node.js 18+ installed
- A Neon account (sign up at https://neon.tech)
- Git (for version control)

## Step 1: Create a Neon Database

1. Go to https://neon.tech and sign in
2. Click "Create Project"
3. Choose a project name (e.g., "dascms")
4. Select a region close to your users
5. Click "Create Project"

## Step 2: Get Your Connection String

1. In your Neon dashboard, go to your project
2. Click on "Connection Details"
3. Copy the connection string (it should look like this):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## Step 3: Configure Environment Variables

1. Open the `.env` file in the root of the `dascms` directory
2. Replace the `DATABASE_URL` value with your Neon connection string:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
   ```
3. Save the file

## Step 4: Apply Database Migrations

### Option A: Using the Helper Script (Recommended)

Run the provided script that will check your configuration and apply migrations:

```bash
cd dascms
./scripts/apply-migrations.sh
```

### Option B: Manual Migration

If you prefer to run commands manually:

```bash
cd dascms

# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Step 5: Verify the Setup

1. Check your Neon dashboard to verify the tables were created
2. You should see the following tables:
   - User
   - Company
   - Asset
   - AssetVersion
   - AssetShare
   - PlatformUsage
   - AssetDownload
   - Approval
   - AuditLog
   - Notification

## Database Schema Overview

### Core Tables

**User**
- Stores user accounts with roles (Admin, Content_Creator, SEO_Specialist)
- Links to Company for non-Admin users
- Tracks authentication credentials

**Company**
- Organization entities that group users and assets
- Enforces unique company names

**Asset**
- Central table for all digital assets (images, videos, documents, links)
- Supports two upload types: SEO (requires approval) and DOC (private)
- Implements 7 visibility levels: UPLOADER_ONLY, ADMIN_ONLY, COMPANY, TEAM, ROLE, SELECTED_USERS, PUBLIC
- Tracks approval status and rejection reasons

### Supporting Tables

**AssetVersion**
- Maintains version history for assets
- Preserves all previous versions

**AssetShare**
- Manages explicit asset sharing between users
- Supports sharing with specific users, roles, or teams

**PlatformUsage**
- Tracks where assets are used (X, LinkedIn, Instagram, Meta Ads, YouTube)
- Records campaign names and post URLs

**AssetDownload**
- Logs all asset downloads
- Tracks platform intent for analytics

**Approval**
- Records approval/rejection actions by Admins
- Stores rejection reasons

**AuditLog**
- Immutable audit trail of all system operations
- Includes user, action, resource, and metadata

**Notification**
- In-app notifications for users
- Tracks read/unread status

## Troubleshooting

### Connection Issues

If you get a connection error:
1. Verify your DATABASE_URL is correct
2. Check that your Neon database is active (not suspended)
3. Ensure your IP is allowed (Neon allows all IPs by default)
4. Try connecting with `npx prisma studio` to test the connection

### Migration Errors

If migrations fail:
1. Check the error message carefully
2. Verify the database is empty (for initial migration)
3. If needed, reset the database:
   ```bash
   npx prisma migrate reset
   ```
   ⚠️ Warning: This will delete all data!

### Prisma Client Issues

If you get "Cannot find module '@prisma/client'":
```bash
npx prisma generate
```

## Next Steps

After setting up the database:

1. **Seed Initial Data** (optional):
   - Create an admin user
   - Add test companies
   - Upload sample assets

2. **Start Development**:
   ```bash
   npm run dev
   ```

3. **Access Prisma Studio** (database GUI):
   ```bash
   npx prisma studio
   ```

## Production Deployment

For production deployment:

1. Create a separate Neon database for production
2. Set the production DATABASE_URL in your deployment environment
3. Run migrations in production:
   ```bash
   npx prisma migrate deploy
   ```
4. Never use `prisma migrate dev` in production

## Database Maintenance

### Backup

Neon provides automatic backups. You can also:
- Use Neon's branching feature for testing
- Export data using `pg_dump`

### Monitoring

Monitor your database:
- Check query performance in Neon dashboard
- Review slow queries
- Monitor connection pool usage

### Scaling

Neon automatically scales:
- Storage scales automatically
- Compute scales based on your plan
- Consider upgrading your plan for production workloads

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [DASCMS Requirements](../.kiro/specs/dascms/requirements.md)
- [DASCMS Design](../.kiro/specs/dascms/design.md)
