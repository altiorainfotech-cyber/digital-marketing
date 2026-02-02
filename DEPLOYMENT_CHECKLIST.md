# DASCMS Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment Checklist

### Code & Configuration

- [ ] All tests pass locally (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors (`npm run lint`)
- [ ] All environment variables documented in `.env.production.example`
- [ ] Git repository is clean (no uncommitted changes)
- [ ] Latest code pushed to main/production branch

### Database

- [ ] Neon production database created
- [ ] Database connection string obtained
- [ ] Connection string tested locally
- [ ] All migrations applied successfully
- [ ] Database schema verified with `npx prisma db pull`
- [ ] Backup strategy in place

### Cloudflare Services

#### R2 (Document Storage)
- [ ] Production R2 bucket created (`dascms-documents-prod`)
- [ ] R2 API token created with Read & Write permissions
- [ ] R2 credentials tested
- [ ] CORS configured if using custom domain
- [ ] Custom domain configured (optional)

#### Stream (Video Storage)
- [ ] Stream enabled on Cloudflare account
- [ ] Stream API token created
- [ ] Stream credentials tested

#### Images (Image Storage)
- [ ] Images enabled on Cloudflare account
- [ ] Images API token created
- [ ] Images account hash obtained
- [ ] Images credentials tested

### Security

- [ ] Strong `NEXTAUTH_SECRET` generated (`openssl rand -base64 32`)
- [ ] Production database uses strong password
- [ ] All API tokens have minimal required permissions
- [ ] No sensitive data in Git repository
- [ ] `.env` files added to `.gitignore`
- [ ] Admin user password is strong and secure

## Deployment Checklist

### Cloudflare Pages Setup

- [ ] Cloudflare Pages project created
- [ ] Git repository connected
- [ ] Build settings configured:
  - Framework: Next.js
  - Build command: `npm run build`
  - Build output: `.next`
  - Node version: 20.x
- [ ] Root directory set (if monorepo)

### Environment Variables

Set all environment variables in Cloudflare Pages:

**Database:**
- [ ] `DATABASE_URL` (production connection string)

**NextAuth.js:**
- [ ] `NEXTAUTH_URL` (production domain)
- [ ] `NEXTAUTH_SECRET` (strong random string)

**Cloudflare R2:**
- [ ] `R2_ACCOUNT_ID`
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_BUCKET_NAME`
- [ ] `R2_PUBLIC_URL`

**Cloudflare Stream:**
- [ ] `STREAM_ACCOUNT_ID`
- [ ] `STREAM_API_TOKEN`

**Cloudflare Images:**
- [ ] `IMAGES_ACCOUNT_ID`
- [ ] `IMAGES_API_TOKEN`
- [ ] `IMAGES_ACCOUNT_HASH`

**Application:**
- [ ] `NODE_ENV` = `production`

### Database Migration

- [ ] Set production `DATABASE_URL` locally
- [ ] Run `npm run db:generate`
- [ ] Run `npx prisma migrate deploy`
- [ ] Verify schema with `npx prisma db pull`
- [ ] Create initial admin user

### Initial Deployment

- [ ] Trigger deployment in Cloudflare Pages
- [ ] Monitor build logs for errors
- [ ] Build completes successfully
- [ ] Deployment URL accessible

### Custom Domain (Optional)

- [ ] Custom domain added in Cloudflare Pages
- [ ] DNS records configured
- [ ] SSL certificate provisioned
- [ ] `NEXTAUTH_URL` updated to custom domain
- [ ] Project redeployed with new URL

## Post-Deployment Verification

### Basic Functionality

- [ ] Homepage loads without errors
- [ ] Login page accessible
- [ ] API health check passes (`/api/auth/session`)
- [ ] No console errors in browser
- [ ] No 500 errors in Cloudflare logs

### Authentication

- [ ] Admin user can log in
- [ ] Session persists across page reloads
- [ ] Logout works correctly
- [ ] Protected routes require authentication
- [ ] Unauthorized access returns 401/403

### Database Operations

- [ ] Can create companies
- [ ] Can create users
- [ ] Can assign users to companies
- [ ] Can update user roles
- [ ] Audit logs are created

### Asset Management

#### SEO Asset Upload
- [ ] Can upload SEO image
- [ ] Can upload SEO video
- [ ] Can upload SEO document
- [ ] Company selection required
- [ ] Visibility defaults to ADMIN_ONLY (non-Admin users)
- [ ] Admin can choose visibility
- [ ] "Save Draft" sets status to DRAFT
- [ ] "Submit for Review" sets status to PENDING_REVIEW
- [ ] Admin receives notification on submission

#### Doc Asset Upload
- [ ] Can upload Doc asset
- [ ] Company selection not required
- [ ] Visibility defaults to UPLOADER_ONLY
- [ ] Status defaults to DRAFT
- [ ] No Admin notification

### Storage Services

- [ ] Images upload to Cloudflare Images
- [ ] Videos upload to Cloudflare Stream
- [ ] Documents upload to Cloudflare R2
- [ ] Presigned URLs work correctly
- [ ] Signed download URLs work
- [ ] URLs expire as expected

### Approval Workflow

- [ ] Admin can view pending assets
- [ ] Admin can approve assets
- [ ] Admin can reject assets with reason
- [ ] Uploader receives notification on approval
- [ ] Uploader receives notification on rejection
- [ ] Visibility can be changed during approval
- [ ] Approved assets visible per visibility rules

### Visibility Control

- [ ] UPLOADER_ONLY: Only uploader can view
- [ ] ADMIN_ONLY: Admin and uploader can view
- [ ] COMPANY: All company users can view
- [ ] TEAM: All team members can view (if implemented)
- [ ] ROLE: All users with role can view
- [ ] SELECTED_USERS: Only selected users can view
- [ ] PUBLIC: All authenticated users can view

### Asset Sharing

- [ ] Can share Doc assets with specific users
- [ ] Shared users can view shared assets
- [ ] Can revoke sharing
- [ ] Sharing notifications sent

### Platform Usage

- [ ] Can log platform usage
- [ ] Platform usage history displays
- [ ] Usage analytics work
- [ ] Audit logs created for usage

### Download Tracking

- [ ] Can download assets
- [ ] Download generates signed URL
- [ ] Download logged in history
- [ ] Download history displays
- [ ] Audit logs created for downloads

### Search & Filtering

- [ ] Can search by title
- [ ] Can search by description
- [ ] Can search by tags
- [ ] Can filter by company
- [ ] Can filter by asset type
- [ ] Can filter by status
- [ ] Can filter by visibility
- [ ] Can sort by date, title, size
- [ ] Search respects permissions

### Notifications

- [ ] Notification bell shows unread count
- [ ] Can view notifications
- [ ] Can mark as read
- [ ] Can mark all as read
- [ ] Can delete notifications
- [ ] Notifications link to related resources

### Audit Logs

- [ ] Admin can view audit logs
- [ ] Can filter by user
- [ ] Can filter by action
- [ ] Can filter by date range
- [ ] Sensitive operations include context
- [ ] Audit logs are immutable

## Performance Verification

- [ ] Homepage loads in < 2 seconds
- [ ] Asset list loads in < 2 seconds
- [ ] Search returns results in < 2 seconds
- [ ] Image thumbnails load quickly
- [ ] No memory leaks in browser
- [ ] Database queries are optimized

## Security Verification

- [ ] HTTPS enforced (automatic with Cloudflare)
- [ ] Authentication required for all protected routes
- [ ] Authorization checks work correctly
- [ ] CSRF protection enabled
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection enabled
- [ ] Rate limiting configured (Cloudflare WAF)
- [ ] Sensitive data not exposed in logs
- [ ] API tokens not exposed to client

## Monitoring Setup

- [ ] Cloudflare Analytics enabled
- [ ] Error tracking configured (optional: Sentry)
- [ ] Uptime monitoring configured (optional)
- [ ] Database monitoring enabled (Neon)
- [ ] Storage usage monitoring enabled
- [ ] Alert thresholds configured

## Documentation

- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Admin user credentials securely stored
- [ ] Rollback procedure documented
- [ ] Support contacts documented
- [ ] Runbook created for common issues

## Post-Launch Tasks

### Immediate (Day 1)

- [ ] Monitor error logs for first 24 hours
- [ ] Check database connection pool usage
- [ ] Verify storage uploads working
- [ ] Test all critical workflows
- [ ] Confirm notifications sending

### Short-term (Week 1)

- [ ] Review Cloudflare Analytics
- [ ] Check storage costs
- [ ] Review audit logs for issues
- [ ] Gather user feedback
- [ ] Address any reported bugs

### Medium-term (Month 1)

- [ ] Review performance metrics
- [ ] Optimize slow queries
- [ ] Review and rotate API tokens
- [ ] Update documentation based on learnings
- [ ] Plan feature enhancements

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback:**
   - [ ] Rollback deployment in Cloudflare Pages
   - [ ] Verify previous version working
   - [ ] Communicate status to users

2. **Database Rollback (if needed):**
   - [ ] Identify problematic migration
   - [ ] Run rollback script
   - [ ] Verify data integrity

3. **Post-Rollback:**
   - [ ] Document issue
   - [ ] Fix in development
   - [ ] Test thoroughly
   - [ ] Redeploy when ready

## Sign-off

**Deployed by:** ___________________  
**Date:** ___________________  
**Deployment URL:** ___________________  
**Database:** ___________________  
**Version/Commit:** ___________________  

**Verified by:** ___________________  
**Date:** ___________________  

**Notes:**
___________________
___________________
___________________
