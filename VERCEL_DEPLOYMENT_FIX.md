# Vercel Deployment - Login Fix Guide

## Why Login Fails on Vercel

Common issues:
1. Missing or incorrect `NEXTAUTH_URL` environment variable
2. Missing `NEXTAUTH_SECRET` environment variable
3. Database connection string not configured
4. Prisma client not generated during build
5. Middleware blocking authentication routes

## Fix Steps

### 1. Configure Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables:

```bash
# Critical for NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-command-below>

# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require&channel_binding=require

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-url.com

# Cloudflare Stream
STREAM_ACCOUNT_ID=your-account-id
STREAM_API_TOKEN=your-token

# Cloudflare Images
IMAGES_ACCOUNT_ID=your-account-id
IMAGES_API_TOKEN=your-token
IMAGES_ACCOUNT_HASH=your-hash

# Environment
NODE_ENV=production
```

### 2. Generate NEXTAUTH_SECRET

Run this command locally:
```bash
openssl rand -base64 32
```

Copy the output and use it as `NEXTAUTH_SECRET` in Vercel.

### 3. Set NEXTAUTH_URL Correctly

**CRITICAL:** `NEXTAUTH_URL` must be your exact production domain:

- ✅ Correct: `https://dascms.vercel.app`
- ✅ Correct: `https://your-custom-domain.com`
- ❌ Wrong: `http://localhost:3000`
- ❌ Wrong: `https://dascms.vercel.app/`
- ❌ Wrong: Missing `https://`

### 4. Verify Database Connection

Your Neon database URL should:
- Include `?sslmode=require`
- Include `&channel_binding=require` for production
- Be accessible from Vercel's IP ranges (Neon allows all by default)

Test connection:
```bash
npm run db:verify
```

### 5. Run Database Migrations

After deploying, run migrations:
```bash
npm run db:migrate:deploy
```

Or use Vercel's build command:
```bash
prisma migrate deploy && next build
```

### 6. Create Admin User

After deployment, create an admin user:
```bash
npm run db:create-admin
```

Or use the bypass login feature:
```
https://your-app.vercel.app/auth/bypass
```

## Debugging on Vercel

### Check Build Logs
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Check "Build Logs" for errors

### Check Function Logs
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Check "Functions" tab for runtime errors

### Common Error Messages

**"NEXTAUTH_URL not set"**
- Add `NEXTAUTH_URL` to environment variables
- Redeploy

**"Invalid credentials"**
- Check database connection
- Verify user exists and is activated
- Check password hash

**"Session callback error"**
- Check `NEXTAUTH_SECRET` is set
- Verify it's the same across all deployments

**"Prisma Client not found"**
- Verify `postinstall` script runs
- Check build logs for Prisma generation

## Testing After Deployment

1. Visit: `https://your-app.vercel.app/auth/signin`
2. Try logging in with admin credentials
3. Check browser console for errors
4. Check Vercel function logs for server errors

## Quick Test Commands

```bash
# Test environment variables
npm run validate:env:prod

# Test database connection
npm run db:verify

# Run pre-deployment checks
npm run deploy:check
```

## Vercel-Specific Configuration

The `vercel.json` file has been added with:
- Custom build command to ensure Prisma generation
- Cache headers for API routes
- Environment variable configuration

## Still Not Working?

1. Check Vercel function logs for specific errors
2. Verify all environment variables are set
3. Test database connection from Vercel
4. Check if middleware is blocking requests
5. Verify NextAuth callbacks are working

## Support Resources

- [NextAuth.js Deployment Docs](https://next-auth.js.org/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
