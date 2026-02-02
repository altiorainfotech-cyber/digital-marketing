# DASCMS Scripts

This directory contains utility scripts for deployment, database management, and maintenance.

## Available Scripts

### Deployment Scripts

#### `pre-deploy.sh`
Pre-deployment verification script that runs all checks before deploying to production.

**Usage:**
```bash
npm run pre-deploy
# or
bash scripts/pre-deploy.sh
```

**What it does:**
- Checks Node.js version
- Validates environment variables
- Installs dependencies
- Generates Prisma client
- Runs linter
- Runs tests
- Builds application
- Verifies build output

**When to use:**
- Before deploying to production
- Before creating a release
- As part of CI/CD pipeline

---

#### `validate-env.ts`
Validates environment variables for development or production.

**Usage:**
```bash
# Validate development environment
npm run validate:env

# Validate production environment
npm run validate:env:prod
```

**What it checks:**
- All required variables are set
- No placeholder values remain
- Correct URL formats
- Strong secrets
- Production-specific requirements

**When to use:**
- Before deployment
- After updating environment variables
- When troubleshooting configuration issues

---

### Database Scripts

#### `migrate-production.sh`
Safely applies Prisma migrations to production database.

**Usage:**
```bash
export DATABASE_URL='postgresql://...'
npm run db:migrate:production
# or
bash scripts/migrate-production.sh
```

**What it does:**
- Checks migration status
- Prompts for confirmation
- Reminds to create backup
- Applies migrations
- Generates Prisma client
- Verifies schema
- Tests connection

**When to use:**
- After creating new migrations
- When deploying schema changes
- During production deployments

**Important:**
- Always create a database backup first
- Test migrations in staging first
- Run during low-traffic periods

---

#### `verify-schema.sh`
Verifies database schema matches expectations.

**Usage:**
```bash
export DATABASE_URL='postgresql://...'
npm run db:verify
# or
bash scripts/verify-schema.sh
```

**What it does:**
- Checks migration status
- Pulls current schema
- Checks for schema drift
- Verifies all tables exist

**When to use:**
- After running migrations
- When troubleshooting database issues
- During deployment verification

---

#### `create-admin-user.ts`
Interactive script to create initial admin user.

**Usage:**
```bash
export DATABASE_URL='postgresql://...'
npm run db:create-admin
# or
npx tsx scripts/create-admin-user.ts
```

**What it does:**
- Checks for existing admin users
- Prompts for user details
- Validates input
- Hashes password
- Creates user in database
- Creates audit log entry

**When to use:**
- After initial deployment
- When creating additional admin users
- When admin access is needed

**Security:**
- Use strong passwords (min 8 characters)
- Store credentials securely
- Change default passwords immediately

---

#### `test-audit-immutability.ts`
Tests audit log immutability constraints.

**Usage:**
```bash
export DATABASE_URL='postgresql://...'
npx tsx scripts/test-audit-immutability.ts
```

**What it does:**
- Creates test audit log entry
- Attempts to update (should fail)
- Attempts to delete (should fail)
- Verifies immutability

**When to use:**
- After database migrations
- When verifying audit log setup
- During security audits

---

## Common Workflows

### Initial Production Setup

```bash
# 1. Set production database URL
export DATABASE_URL='postgresql://...'

# 2. Run migrations
npm run db:migrate:production

# 3. Verify schema
npm run db:verify

# 4. Create admin user
npm run db:create-admin

# 5. Test audit immutability
npx tsx scripts/test-audit-immutability.ts
```

### Pre-Deployment Checklist

```bash
# 1. Validate environment
npm run validate:env:prod

# 2. Run all checks
npm run pre-deploy

# 3. If all pass, deploy
# (Cloudflare Pages will handle the rest)
```

### Database Migration Workflow

```bash
# Development: Create migration
npm run db:migrate

# Staging: Test migration
export DATABASE_URL='staging-url'
npm run db:migrate:deploy
npm run db:verify

# Production: Apply migration
export DATABASE_URL='production-url'
npm run db:migrate:production
npm run db:verify
```

### Troubleshooting Database Issues

```bash
# 1. Check migration status
export DATABASE_URL='production-url'
npx prisma migrate status

# 2. Verify schema
npm run db:verify

# 3. Check for drift
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma

# 4. If needed, pull current schema
npx prisma db pull
```

## Environment Variables

All scripts that interact with the database require `DATABASE_URL`:

```bash
# Set for current session
export DATABASE_URL='postgresql://username:password@host.neon.tech/database?sslmode=require'

# Or use .env file
cp .env.production.example .env.production
# Edit .env.production with your values
```

## Script Dependencies

### Required Tools

- **Node.js 20+**: All scripts require Node.js
- **npm**: Package manager
- **Prisma CLI**: Database management
- **tsx**: TypeScript execution (installed as dev dependency)
- **bash**: Shell scripts (macOS/Linux)

### Installing Dependencies

```bash
# Install all dependencies
npm install

# Install Prisma CLI globally (optional)
npm install -g prisma
```

## Security Considerations

### Sensitive Data

- Never commit `.env` files to Git
- Never log passwords or secrets
- Use strong passwords for admin users
- Rotate API tokens regularly

### Database Access

- Use read-only credentials when possible
- Limit connection pool size
- Use SSL/TLS for connections
- Monitor for suspicious activity

### Script Execution

- Review scripts before running
- Run with minimal required permissions
- Test in staging before production
- Keep audit logs of script executions

## Troubleshooting

### "Permission denied" Error

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### "DATABASE_URL not set" Error

```bash
# Set environment variable
export DATABASE_URL='postgresql://...'

# Or use .env file
cp .env.production.example .env.production
# Edit .env.production
```

### "Cannot find module" Error

```bash
# Install dependencies
npm install

# Regenerate Prisma client
npm run db:generate
```

### "Connection refused" Error

```bash
# Check database URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify Neon database is running
# Check https://console.neon.tech
```

## Contributing

When adding new scripts:

1. Add documentation to this README
2. Add npm script to `package.json`
3. Make shell scripts executable: `chmod +x script.sh`
4. Add error handling and validation
5. Include usage examples
6. Test in development first

## Additional Resources

- [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [Neon Documentation](https://neon.tech/docs)
- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
- [TypeScript Node Execution (tsx)](https://github.com/esbuild-kit/tsx)
