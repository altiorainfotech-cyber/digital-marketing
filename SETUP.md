# DASCMS Setup Guide

This guide will help you set up the DASCMS project from scratch.

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ and npm installed
- A Neon PostgreSQL database account
- A Cloudflare account with access to:
  - R2 (Object Storage)
  - Stream (Video Streaming)
  - Images (Image Optimization)

## Step 1: Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update the `.env` file with your actual credentials:

### Database Configuration

Sign up for a Neon PostgreSQL database at https://neon.tech and get your connection string:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dascms?sslmode=require"
```

### NextAuth.js Configuration

Generate a secure secret:

```bash
openssl rand -base64 32
```

Update your `.env`:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
```

### Cloudflare R2 Configuration

1. Go to Cloudflare Dashboard > R2
2. Create a new bucket named `dascms-documents`
3. Generate API tokens with R2 permissions
4. Update your `.env`:

```env
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="dascms-documents"
R2_PUBLIC_URL="https://your-r2-public-url.com"
```

### Cloudflare Stream Configuration

1. Go to Cloudflare Dashboard > Stream
2. Generate an API token with Stream permissions
3. Update your `.env`:

```env
STREAM_ACCOUNT_ID="your-account-id"
STREAM_API_TOKEN="your-stream-api-token"
```

### Cloudflare Images Configuration

1. Go to Cloudflare Dashboard > Images
2. Generate an API token with Images permissions
3. Get your account hash from the Images dashboard
4. Update your `.env`:

```env
IMAGES_ACCOUNT_ID="your-account-id"
IMAGES_API_TOKEN="your-images-api-token"
IMAGES_ACCOUNT_HASH="your-account-hash"
```

## Step 3: Set Up the Database

The Prisma schema has been created and migration files have been generated. Follow the detailed database setup guide:

📖 **See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for complete database setup instructions**

Quick start:

```bash
# Option 1: Use the helper script (recommended)
./scripts/apply-migrations.sh

# Option 2: Manual migration
npx prisma migrate deploy
npx prisma generate
```

**Important**: Before running migrations, make sure you've updated the `DATABASE_URL` in your `.env` file with your actual Neon database connection string.

## Step 4: Run Tests

Verify your setup by running the tests:

```bash
npm run test
```

All tests should pass.

## Step 5: Start Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
dascms/
├── app/                    # Next.js app directory (routes and pages)
├── components/            # React components
├── lib/                   # Core application code
│   ├── config.ts         # Configuration and environment variables
│   ├── prisma.ts         # Prisma client singleton
│   ├── services/         # Business logic services
│   ├── repositories/     # Data access layer
│   └── utils/            # Helper functions
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema definition
├── tests/                # Test files
│   ├── setup.ts          # Test configuration
│   └── *.test.ts         # Test files
├── types/                # TypeScript type definitions
│   └── index.ts          # Core type definitions
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── vitest.config.ts      # Vitest configuration
└── package.json          # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run all tests with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Generate test coverage report
- `npm run db:generate` - Generate Prisma client from schema
- `npm run db:push` - Push schema changes to database (dev)
- `npm run db:migrate` - Create and run migrations (prod)
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Next Steps

1. **Task 2**: Create the Prisma schema with all models
2. **Task 3**: Set up authentication with NextAuth.js
3. **Task 4**: Implement audit logging service
4. Continue with remaining tasks...

## Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. Verify your `DATABASE_URL` is correct
2. Ensure your IP is whitelisted in Neon (if applicable)
3. Check that SSL mode is set to `require` for Neon

### Cloudflare API Issues

If Cloudflare services aren't working:

1. Verify all API tokens have the correct permissions
2. Check that your account IDs are correct
3. Ensure your Cloudflare account has the required services enabled

### Test Failures

If tests fail:

1. Ensure all dependencies are installed: `npm install`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check that TypeScript is compiling: `npx tsc --noEmit`

## Support

For issues or questions, refer to:

- Next.js documentation: https://nextjs.org/docs
- Prisma documentation: https://www.prisma.io/docs
- Vitest documentation: https://vitest.dev
- fast-check documentation: https://fast-check.dev
