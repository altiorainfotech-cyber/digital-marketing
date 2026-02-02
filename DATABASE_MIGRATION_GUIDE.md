# Database Migration Guide for Production

This guide covers running Prisma migrations in production for DASCMS.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Strategy](#migration-strategy)
4. [Running Migrations](#running-migrations)
5. [Verification](#verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

## Overview

DASCMS uses Prisma ORM for database management. Migrations are version-controlled changes to the database schema that must be applied to production in a safe, repeatable manner.

### Key Principles

- **Never use `prisma migrate dev` in production** - it's for development only
- **Always use `prisma migrate deploy`** - designed for production
- **Test migrations in staging first** - catch issues before production
- **Backup before migrating** - enable quick rollback if needed
- **Monitor during migration** - watch for errors or performance issues

## Prerequisites

### Before Running Migrations

- [ ] Production database URL available
- [ ] Database backup completed
- [ ] Migrations tested in staging environment
- [ ] Downtime window scheduled (if needed)
- [ ] Team notified of deployment
- [ ] Rollback plan prepared

### Required Tools

```bash
# Install Prisma CLI globally (optional)
npm install -g prisma

# Or use npx (recommended)
npx prisma --version
```

### Environment Setup

Set production database URL:

```bash
# Option 1: Export environment variable
export DATABASE_URL='postgresql://username:password@host.neon.tech/database?sslmode=require'

# Option 2: Use .env.production file
cp .env.production.example .env.production
# Edit .env.production with production values
```

## Migration Strategy

### Development Workflow

1. **Create migration** (development):
   ```bash
   npm run db:migrate
   # or
   npx prisma migrate dev --name descriptive_name
   ```

2. **Review migration SQL**:
   ```bash
   cat prisma/migrations/YYYYMMDDHHMMSS_descriptive_name/migration.sql
   ```

3. **Test migration** (staging):
   ```bash
   npx prisma migrate deploy
   ```

4. **Commit migration files**:
   ```bash
   git add prisma/migrations/
   git commit -m "Add migration: descriptive_name"
   git push
   ```

### Production Workflow

1. **Backup database** (see below)
2. **Apply migrations** (see below)
3. **Verify schema** (see below)
4. **Monitor application** (see below)

## Running Migrations

### Step 1: Backup Database

**Neon PostgreSQL Backup:**

Neon provides automatic backups, but create a manual backup before major migrations:

1. Log in to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to **Backups** tab
4. Click **Create backup**
5. Wait for backup to complete

**Alternative: Manual Backup:**

```bash
# Export database schema and data
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or schema only
pg_dump --schema-only $DATABASE_URL > schema_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Check Migration Status

Before applying migrations, check current status:

```bash
# Set production database URL
export DATABASE_URL='your-production-database-url'

# Check migration status
npx prisma migrate status
```

Output will show:
- Applied migrations (✓)
- Pending migrations (⚠)
- Failed migrations (✗)

### Step 3: Apply Migrations

**Production Migration Command:**

```bash
# Apply all pending migrations
npx prisma migrate deploy
```

This command:
- Applies migrations in order
- Skips already-applied migrations
- Fails fast on errors
- Does not prompt for input (safe for CI/CD)

**With Logging:**

```bash
# Verbose output
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### Step 4: Generate Prisma Client

After migrations, regenerate Prisma client:

```bash
npm run db:generate
# or
npx prisma generate
```

### Step 5: Restart Application

If running on Cloudflare Pages:
- Redeploy the application
- Cloudflare will automatically restart

If running elsewhere:
```bash
# Restart your application server
pm2 restart dascms
# or
systemctl restart dascms
```

## Verification

### Step 1: Verify Schema

Check that schema matches expectations:

```bash
# Pull current schema from database
npx prisma db pull

# Compare with prisma/schema.prisma
diff prisma/schema.prisma prisma/schema.prisma.backup
```

### Step 2: Check Migration History

Verify all migrations applied:

```bash
npx prisma migrate status
```

Should show all migrations with ✓ (applied).

### Step 3: Test Database Connectivity

```bash
# Open Prisma Studio to verify data
npx prisma studio
```

Or test with a simple query:

```bash
# Connect to database
psql $DATABASE_URL

# Run test query
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Asset";
\q
```

### Step 4: Application Health Check

Test application endpoints:

```bash
# Health check
curl https://your-domain.com/api/auth/session

# Test database query
curl https://your-domain.com/api/users
```

### Step 5: Monitor Logs

Check application logs for errors:

1. Cloudflare Pages: View function logs in dashboard
2. Database: Check Neon logs for slow queries or errors
3. Application: Monitor error tracking (Sentry, etc.)

## Rollback Procedures

### Scenario 1: Migration Failed

If migration fails during `prisma migrate deploy`:

1. **Check error message**:
   ```bash
   npx prisma migrate status
   ```

2. **Mark migration as rolled back**:
   ```bash
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```

3. **Fix migration SQL** (if possible):
   - Edit migration file
   - Test in staging
   - Reapply

4. **Or create new migration** to fix:
   ```bash
   # In development
   npx prisma migrate dev --name fix_previous_migration
   
   # In production
   npx prisma migrate deploy
   ```

### Scenario 2: Migration Succeeded but Application Broken

If migration applied but application has issues:

1. **Restore from backup**:
   ```bash
   # Restore database from backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Or create rollback migration**:
   ```sql
   -- Create migration to undo changes
   -- Example: If you added a column, drop it
   ALTER TABLE "Asset" DROP COLUMN "newColumn";
   ```

3. **Apply rollback migration**:
   ```bash
   npx prisma migrate dev --name rollback_feature_name
   npx prisma migrate deploy
   ```

### Scenario 3: Data Corruption

If data is corrupted:

1. **Stop application** immediately
2. **Restore from backup**:
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```
3. **Investigate root cause**
4. **Fix and retest** before redeploying

## Troubleshooting

### Issue: "Migration failed to apply"

**Symptoms**: Migration fails with SQL error

**Solutions**:

1. **Check SQL syntax**:
   ```bash
   cat prisma/migrations/MIGRATION_NAME/migration.sql
   ```

2. **Test SQL manually**:
   ```bash
   psql $DATABASE_URL
   # Paste SQL from migration file
   ```

3. **Check for conflicts**:
   - Existing data violates new constraints
   - Column already exists
   - Foreign key conflicts

4. **Fix and retry**:
   ```bash
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   # Fix issue
   npx prisma migrate deploy
   ```

### Issue: "Database is out of sync"

**Symptoms**: Prisma reports schema drift

**Solutions**:

1. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

2. **Pull current schema**:
   ```bash
   npx prisma db pull
   ```

3. **Compare schemas**:
   ```bash
   diff prisma/schema.prisma prisma/schema.prisma.backup
   ```

4. **Resolve drift**:
   - If production is correct: update schema.prisma
   - If schema.prisma is correct: create migration to fix production

### Issue: "Connection timeout"

**Symptoms**: Cannot connect to database

**Solutions**:

1. **Check connection string**:
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Check Neon status**:
   - Visit [Neon Status](https://neonstatus.com)
   - Check project in Neon Console

4. **Verify SSL settings**:
   ```bash
   # Ensure connection string includes sslmode=require
   DATABASE_URL='postgresql://...?sslmode=require'
   ```

### Issue: "Too many connections"

**Symptoms**: "remaining connection slots are reserved" error

**Solutions**:

1. **Use pooled connection**:
   ```bash
   # Use -pooler endpoint
   DATABASE_URL='postgresql://...@host-pooler.neon.tech/...'
   ```

2. **Close existing connections**:
   ```sql
   -- Check active connections
   SELECT * FROM pg_stat_activity;
   
   -- Terminate idle connections
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle';
   ```

3. **Increase connection limit** (Neon Console)

### Issue: "Migration takes too long"

**Symptoms**: Migration times out or hangs

**Solutions**:

1. **Check migration SQL**:
   - Large data migrations should be batched
   - Indexes should be created concurrently

2. **Optimize migration**:
   ```sql
   -- Instead of:
   CREATE INDEX idx_name ON table(column);
   
   -- Use:
   CREATE INDEX CONCURRENTLY idx_name ON table(column);
   ```

3. **Split large migrations**:
   - Break into smaller migrations
   - Apply incrementally

4. **Schedule during low traffic**:
   - Run during maintenance window
   - Notify users of downtime

## Best Practices

### 1. Always Test First

```bash
# Test in staging
export DATABASE_URL='staging-database-url'
npx prisma migrate deploy

# Verify application works
# Then apply to production
```

### 2. Use Descriptive Migration Names

```bash
# Good
npx prisma migrate dev --name add_asset_rejection_fields

# Bad
npx prisma migrate dev --name update
```

### 3. Review Migration SQL

Always review generated SQL before applying:

```bash
cat prisma/migrations/LATEST_MIGRATION/migration.sql
```

### 4. Backup Before Major Changes

```bash
# Before adding/dropping columns
# Before changing data types
# Before adding constraints
pg_dump $DATABASE_URL > backup.sql
```

### 5. Monitor After Migration

- Check application logs
- Monitor database performance
- Watch for user-reported issues
- Be ready to rollback

### 6. Document Changes

Add comments to migration files:

```sql
-- Migration: Add rejection tracking to assets
-- Date: 2024-01-15
-- Author: Team
-- Ticket: DASCMS-123

ALTER TABLE "Asset" ADD COLUMN "rejectedAt" TIMESTAMP;
ALTER TABLE "Asset" ADD COLUMN "rejectedById" TEXT;
ALTER TABLE "Asset" ADD COLUMN "rejectionReason" TEXT;
```

## Migration Checklist

Use this checklist for production migrations:

- [ ] Migration tested in staging
- [ ] Database backup completed
- [ ] Team notified of deployment
- [ ] Downtime window scheduled (if needed)
- [ ] Production DATABASE_URL set
- [ ] Migration status checked
- [ ] Migration SQL reviewed
- [ ] Migrations applied successfully
- [ ] Prisma client regenerated
- [ ] Application restarted
- [ ] Schema verified
- [ ] Application health checked
- [ ] Logs monitored for errors
- [ ] Users notified of completion

## Automated Migration Script

For convenience, use this script:

```bash
#!/bin/bash
# scripts/migrate-production.sh

set -e

echo "🔍 Checking migration status..."
npx prisma migrate status

echo "📦 Applying migrations..."
npx prisma migrate deploy

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Migrations complete!"
echo "🔍 Verifying schema..."
npx prisma migrate status

echo "✅ All done! Remember to restart your application."
```

Make it executable:

```bash
chmod +x scripts/migrate-production.sh
```

Run it:

```bash
export DATABASE_URL='production-url'
./scripts/migrate-production.sh
```

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
