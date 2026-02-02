# Database Migrations

This directory contains Prisma migration files for the DASCMS database.

## Initial Migration

The `20250128000000_init` migration creates the complete database schema including:

### Tables Created:
- **User** - User accounts with roles (Admin, Content_Creator, SEO_Specialist)
- **Company** - Company/organization entities
- **Asset** - Digital assets (images, videos, documents, links)
- **AssetVersion** - Version history for assets
- **AssetShare** - Asset sharing records
- **PlatformUsage** - Platform usage tracking (X, LinkedIn, Instagram, etc.)
- **AssetDownload** - Download tracking
- **Approval** - Asset approval/rejection records
- **AuditLog** - Immutable audit trail
- **Notification** - In-app notifications

### Enums Created:
- UserRole, AssetType, UploadType, AssetStatus, VisibilityLevel
- Platform, ApprovalAction, AuditAction, ResourceType, NotificationType

## Applying Migrations

### Prerequisites
1. Set up a Neon PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file with your Neon connection string

### Apply Migrations

To apply all pending migrations to your database:

```bash
npx prisma migrate deploy
```

Or to apply migrations in development mode (with additional checks):

```bash
npx prisma migrate dev
```

### Verify Migration Status

To check which migrations have been applied:

```bash
npx prisma migrate status
```

### Generate Prisma Client

After applying migrations, regenerate the Prisma Client:

```bash
npx prisma generate
```

## Database Connection

The database connection is configured in `prisma.config.ts` and uses the `DATABASE_URL` environment variable.

Example Neon connection string format:
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Notes

- All migrations are immutable and should not be modified after being applied
- The schema includes comprehensive indexes for optimal query performance
- Foreign key constraints ensure referential integrity
- Cascade deletes are configured for dependent records (e.g., AssetVersion, AssetShare)
