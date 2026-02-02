# DASCMS Deployment Summary

This document provides a quick reference for deploying DASCMS to production.

## Quick Start

### 1. Pre-Deployment

```bash
# Navigate to project directory
cd dascms

# Validate environment variables
npm run validate:env:prod

# Run all pre-deployment checks
npm run pre-deploy
```

### 2. Database Setup

```bash
# Set production database URL
export DATABASE_URL='postgresql://username:password@host.neon.tech/database?sslmode=require'

# Apply migrations
npm run db:migrate:production

# Verify schema
npm run db:verify

# Create admin user
npm run db:create-admin
```

### 3. Cloudflare Pages Deployment

1. Push code to Git repository
2. Connect repository to Cloudflare Pages
3. Configure build settings (see `CLOUDFLARE_PAGES_SETUP.md`)
4. Set environment variables in Cloudflare dashboard
5. Deploy

### 4. Post-Deployment

```bash
# Verify deployment
curl https://your-domain.com/api/auth/session

# Check logs in Cloudflare Pages dashboard
# Test critical workflows
# Monitor for errors
```

## Documentation Index

### Main Guides

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md)** - Cloudflare Pages setup
- **[DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md)** - Database migration guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Deployment checklist

### Configuration Files

- **[.env.production.example](./.env.production.example)** - Production environment template
- **[.env.example](./.env.example)** - Development environment template
- **[wrangler.toml](./wrangler.toml)** - Cloudflare configuration
- **[.node-version](./.node-version)** - Node.js version specification

### Scripts

- **[scripts/README.md](./scripts/README.md)** - Scripts documentation
- **[scripts/pre-deploy.sh](./scripts/pre-deploy.sh)** - Pre-deployment checks
- **[scripts/migrate-production.sh](./scripts/migrate-production.sh)** - Production migrations
- **[scripts/verify-schema.sh](./scripts/verify-schema.sh)** - Schema verification
- **[scripts/validate-env.ts](./scripts/validate-env.ts)** - Environment validation
- **[scripts/create-admin-user.ts](./scripts/create-admin-user.ts)** - Create admin user

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection | `postgresql://...` |
| `NEXTAUTH_URL` | Production domain | `https://app.example.com` |
| `NEXTAUTH_SECRET` | Auth secret (32+ chars) | Generate with `openssl rand -base64 32` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | From Cloudflare dashboard |
| `R2_ACCESS_KEY_ID` | R2 access key | From R2 API tokens |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | From R2 API tokens |
| `R2_BUCKET_NAME` | R2 bucket name | `dascms-documents-prod` |
| `R2_PUBLIC_URL` | R2 public URL | `https://documents.example.com` |
| `STREAM_ACCOUNT_ID` | Cloudflare account ID | From Cloudflare dashboard |
| `STREAM_API_TOKEN` | Stream API token | From Stream settings |
| `IMAGES_ACCOUNT_ID` | Cloudflare account ID | From Cloudflare dashboard |
| `IMAGES_API_TOKEN` | Images API token | From Images settings |
| `IMAGES_ACCOUNT_HASH` | Images account hash | From Images dashboard |
| `NODE_ENV` | Environment | `production` |

### Where to Set

- **Development**: `.env` file (local)
- **Production**: Cloudflare Pages dashboard → Settings → Environment variables

## NPM Scripts Reference

### Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run linter
npm test                 # Run tests
```

### Database

```bash
npm run db:generate              # Generate Prisma client
npm run db:migrate               # Create migration (dev)
npm run db:migrate:deploy        # Apply migrations (prod)
npm run db:migrate:production    # Interactive production migration
npm run db:verify                # Verify schema
npm run db:create-admin          # Create admin user
npm run db:studio                # Open Prisma Studio
```

### Deployment

```bash
npm run validate:env             # Validate dev environment
npm run validate:env:prod        # Validate prod environment
npm run deploy:check             # Run all pre-deployment checks
npm run pre-deploy               # Full pre-deployment verification
```

## Common Issues

### Build Fails

**Issue**: "Cannot find module '@prisma/client'"

**Solution**:
```bash
npm run db:generate
npm run build
```

### Database Connection Fails

**Issue**: "Connection refused"

**Solution**:
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Use pooled connection
# URL should end with -pooler.neon.tech
```

### Environment Variables Not Working

**Issue**: Variables not loaded in production

**Solution**:
1. Set in Cloudflare Pages dashboard (not in code)
2. Redeploy after changing variables
3. Verify with `console.log(process.env.VARIABLE_NAME)`

### Migration Fails

**Issue**: Migration fails to apply

**Solution**:
```bash
# Check status
npx prisma migrate status

# Mark as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Fix and reapply
npm run db:migrate:production
```

## Support Checklist

Before asking for help:

- [ ] Checked error logs in Cloudflare Pages
- [ ] Verified all environment variables are set
- [ ] Tested database connection
- [ ] Reviewed relevant documentation
- [ ] Checked Cloudflare status page
- [ ] Tried in staging environment first

## Production URLs

After deployment, bookmark these:

- **Application**: `https://your-domain.com`
- **Admin Dashboard**: `https://your-domain.com/admin`
- **Login**: `https://your-domain.com/auth/signin`
- **Cloudflare Pages**: `https://dash.cloudflare.com/pages`
- **Neon Console**: `https://console.neon.tech`

## Monitoring

### What to Monitor

- **Application**: Error rates, response times
- **Database**: Connection pool, query performance
- **Storage**: Upload success rate, bandwidth
- **Users**: Login success rate, active sessions

### Where to Monitor

- **Cloudflare Analytics**: Traffic and performance
- **Neon Monitoring**: Database metrics
- **Application Logs**: Cloudflare Pages function logs
- **Audit Logs**: In-app audit log viewer (Admin only)

## Maintenance Schedule

### Daily
- Check error logs
- Monitor uptime

### Weekly
- Review audit logs
- Check storage usage
- Review performance metrics

### Monthly
- Review and rotate API tokens
- Check for security updates
- Review database performance
- Optimize slow queries

### Quarterly
- Security audit
- Dependency updates
- Performance optimization
- Backup verification

## Emergency Contacts

### Service Status Pages

- Cloudflare: https://www.cloudflarestatus.com/
- Neon: https://neonstatus.com/

### Support

- Cloudflare Support: https://dash.cloudflare.com/support
- Neon Support: https://console.neon.tech/support

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-29 | Initial deployment setup |

## Next Steps

After successful deployment:

1. ✅ Test all critical workflows
2. ✅ Create initial companies and users
3. ✅ Upload test assets
4. ✅ Configure monitoring and alerts
5. ✅ Document any custom configurations
6. ✅ Train users on the system
7. ✅ Set up regular backups
8. ✅ Plan for scaling and optimization

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Neon Documentation](https://neon.tech/docs)
- [DASCMS Requirements](../.kiro/specs/dascms/requirements.md)
- [DASCMS Design](../.kiro/specs/dascms/design.md)
