import { PrismaClient } from '@/app/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables BEFORE anything else
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  // Verify DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Use pg adapter which works reliably with Prisma 7
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  
  const baseClient = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Add extension to enforce audit log immutability (Requirement 12.4)
  // Prevent any update or delete operations on AuditLog model
  const client = baseClient.$extends({
    query: {
      auditLog: {
        async update({ args, query }) {
          throw new Error('Audit logs are immutable and cannot be updated');
        },
        async updateMany({ args, query }) {
          throw new Error('Audit logs are immutable and cannot be updated');
        },
        async delete({ args, query }) {
          throw new Error('Audit logs are immutable and cannot be deleted');
        },
        async deleteMany({ args, query }) {
          throw new Error('Audit logs are immutable and cannot be deleted');
        },
        async upsert({ args, query }) {
          // For upsert, we need to check if the record exists
          // If it exists, it's an update attempt and should be blocked
          const existing = await baseClient.auditLog.findUnique({
            where: args.where,
          });
          
          if (existing) {
            throw new Error('Audit logs are immutable and cannot be updated');
          }
          
          // If it doesn't exist, allow the create operation
          return query(args);
        },
      },
    },
  });
  
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
