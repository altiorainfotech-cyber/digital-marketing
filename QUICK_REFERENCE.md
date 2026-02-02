# DASCMS Quick Reference

## Essential Commands

### Development
```bash
npm run dev                    # Start dev server (localhost:3000)
npm test                       # Run tests
npm run lint                   # Check code quality
npm run db:studio              # Open database GUI
```

### Database
```bash
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Create new migration
npm run db:migrate:production  # Apply migrations to production
npm run db:verify              # Verify database schema
npm run db:create-admin        # Create admin user
```

### Deployment
```bash
npm run validate:env:prod      # Check production env vars
npm run pre-deploy             # Run all pre-deployment checks
npm run deploy:check           # Validate, lint, test, build
```

## Environment Setup

### Development
```bash
cp .env.example .env
# Edit .env with your values
npm install
npm run db:generate
npm run dev
```

### Production
```bash
cp .env.production.example .env.production
# Edit .env.production with production values
npm run validate:env:prod
npm run pre-deploy
# Deploy via Cloudflare Pages
```

## Database URLs

### Development (Neon)
```
postgresql://user:pass@host.neon.tech/db?sslmode=require
```

### Production (Neon with pooling)
```
postgresql://user:pass@host-pooler.neon.tech/db?sslmode=require
```

## Cloudflare Services

### R2 (Documents)
- Bucket: `dascms-documents-prod`
- Endpoint: `https://<account-id>.r2.cloudflarestorage.com`

### Stream (Videos)
- Dashboard: `https://dash.cloudflare.com/stream`
- API: `https://api.cloudflare.com/client/v4/accounts/<account-id>/stream`

### Images
- Dashboard: `https://dash.cloudflare.com/images`
- Delivery: `https://imagedelivery.net/<account-hash>/<image-id>/<variant>`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/session` - Get session
- `POST /api/auth/logout` - Logout

### Assets
- `GET /api/assets` - List assets
- `POST /api/assets/presign` - Get upload URL
- `POST /api/assets/complete` - Complete upload
- `GET /api/assets/[id]` - Get asset
- `DELETE /api/assets/[id]` - Delete asset

### Admin
- `GET /api/assets/pending` - Pending approvals
- `POST /api/assets/[id]/approve` - Approve asset
- `POST /api/assets/[id]/reject` - Reject asset

### Users & Companies
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company

## User Roles

### Admin
- Full system access
- Manage users and companies
- Approve/reject assets
- View all audit logs
- Access all assets (except UPLOADER_ONLY docs)

### Content_Creator
- Upload SEO and Doc assets
- View own uploads
- View shared assets
- Log platform usage

### SEO_Specialist
- Upload SEO assets
- View approved SEO assets
- Log platform usage
- Cannot see Doc assets

## Asset Visibility Levels

1. **UPLOADER_ONLY** - Only uploader can view
2. **ADMIN_ONLY** - Admin and uploader can view
3. **COMPANY** - All company users can view
4. **TEAM** - All team members can view
5. **ROLE** - All users with specific role can view
6. **SELECTED_USERS** - Only selected users can view
7. **PUBLIC** - All authenticated users can view

## Asset Upload Types

### SEO Upload
- Requires company selection
- Default visibility: ADMIN_ONLY (non-Admin)
- Status: DRAFT or PENDING_REVIEW
- Notifies Admin when submitted for review

### Doc Upload
- No company required
- Visibility: UPLOADER_ONLY
- Status: DRAFT
- Private to uploader

## Common Workflows

### Create Admin User
```bash
export DATABASE_URL='production-url'
npm run db:create-admin
# Follow prompts
```

### Deploy to Production
```bash
# 1. Validate
npm run validate:env:prod

# 2. Run checks
npm run pre-deploy

# 3. Push to Git
git push origin main

# 4. Cloudflare Pages auto-deploys
```

### Run Migrations
```bash
# Development
npm run db:migrate

# Production
export DATABASE_URL='production-url'
npm run db:migrate:production
```

### Rollback Deployment
1. Go to Cloudflare Pages dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click "Rollback to this deployment"

## Troubleshooting

### Build Fails
```bash
npm run db:generate
npm run build
```

### Database Connection Fails
```bash
# Check URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Environment Variables Not Working
1. Set in Cloudflare Pages dashboard
2. Redeploy after changes
3. Check with `console.log(process.env.VAR)`

### Migration Fails
```bash
npx prisma migrate status
npx prisma migrate resolve --rolled-back MIGRATION_NAME
npm run db:migrate:production
```

## File Locations

### Configuration
- `.env` - Development environment
- `.env.production` - Production environment
- `prisma/schema.prisma` - Database schema
- `wrangler.toml` - Cloudflare config
- `next.config.ts` - Next.js config

### Documentation
- `DEPLOYMENT.md` - Full deployment guide
- `CLOUDFLARE_PAGES_SETUP.md` - Cloudflare setup
- `DATABASE_MIGRATION_GUIDE.md` - Migration guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `scripts/README.md` - Scripts documentation

### Scripts
- `scripts/pre-deploy.sh` - Pre-deployment checks
- `scripts/migrate-production.sh` - Production migrations
- `scripts/verify-schema.sh` - Schema verification
- `scripts/validate-env.ts` - Environment validation
- `scripts/create-admin-user.ts` - Create admin

## Important URLs

### Development
- App: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login: http://localhost:3000/auth/signin

### Production
- App: https://your-domain.com
- Admin: https://your-domain.com/admin
- Login: https://your-domain.com/auth/signin

### Dashboards
- Cloudflare: https://dash.cloudflare.com
- Neon: https://console.neon.tech
- GitHub: https://github.com/your-repo

## Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` (32+ chars)
- [ ] Strong admin password
- [ ] Database uses SSL (`sslmode=require`)
- [ ] All API tokens have minimal permissions
- [ ] No `.env` files in Git
- [ ] HTTPS enforced (automatic with Cloudflare)
- [ ] Rate limiting enabled (Cloudflare WAF)
- [ ] Audit logging enabled

## Support

### Documentation
1. Check this quick reference
2. Review full documentation in project
3. Check Cloudflare/Neon docs

### Status Pages
- Cloudflare: https://www.cloudflarestatus.com/
- Neon: https://neonstatus.com/

### Logs
- Cloudflare Pages: Dashboard → Deployments → View logs
- Neon: Console → Monitoring
- Application: Admin → Audit Logs

## Version Info

- Node.js: 20+
- Next.js: 16.1.6
- Prisma: 7.3.0
- Database: PostgreSQL (Neon)
- Hosting: Cloudflare Pages
