import { PrismaClient } from '@/app/generated/prisma';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create adapter with connection string (not pool instance)
const adapter = new PrismaNeon({ connectionString: DATABASE_URL });

// Create Prisma client with adapter
export const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
