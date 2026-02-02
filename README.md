# DASCMS - Digital Asset & SEO Content Management System

A role-based web application for managing marketing assets (images, videos, links, documents) with strict role-based visibility, approval workflows, company-based organization, platform usage tracking, and private document storage.

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: Cloudflare R2 (documents), Stream (videos), Images (images)
- **Testing**: Vitest with fast-check for property-based testing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon PostgreSQL database
- Cloudflare account with R2, Stream, and Images enabled

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment variables template:

```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - Set up your Neon PostgreSQL `DATABASE_URL`
   - Generate a `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
   - Add your Cloudflare credentials for R2, Stream, and Images

4. Initialize the database:

```bash
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
dascms/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   └── (dashboard)/       # Dashboard pages
├── components/            # React components
├── lib/                   # Utility functions and services
│   ├── services/         # Business logic services
│   ├── repositories/     # Data access layer
│   └── utils/            # Helper functions
├── prisma/               # Prisma schema and migrations
├── tests/                # Test files
└── types/                # TypeScript type definitions
```

## User Roles

- **Admin**: Manages companies, users, and approves assets
- **Content_Creator**: Uploads content in SEO or private modes
- **SEO_Specialist**: Uploads and views approved SEO content

## Key Features

- Role-based access control with 7 visibility levels
- SEO asset approval workflow
- Private document storage
- Platform usage tracking (X, LinkedIn, Instagram, Meta Ads, YouTube)
- Download tracking with signed URLs
- Asset versioning
- Comprehensive audit logging
- In-app notifications

## Testing

The project uses a dual testing approach:

- **Unit Tests**: Verify specific examples and edge cases
- **Property-Based Tests**: Verify universal properties with fast-check (100+ iterations)

Run tests:

```bash
npm run test
```

View test coverage:

```bash
npm run test:coverage
```

## Environment Variables

See `.env.example` for all required environment variables.

### Required Services

1. **Neon PostgreSQL**: Serverless PostgreSQL database
2. **Cloudflare R2**: S3-compatible object storage for documents
3. **Cloudflare Stream**: Video streaming and storage
4. **Cloudflare Images**: Image optimization and delivery

## License

Private - All rights reserved
