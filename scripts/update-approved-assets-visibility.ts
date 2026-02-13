import { PrismaClient } from '../app/generated/prisma';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function updateApprovedAssetsVisibility() {
  try {
    console.log('🔍 Finding all approved assets...');
    
    // Find all approved assets
    const approvedAssets = await prisma.asset.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        title: true,
        visibility: true,
        status: true
      }
    });

    console.log(`📊 Found ${approvedAssets.length} approved assets`);
    
    if (approvedAssets.length === 0) {
      console.log('✅ No approved assets found to update');
      return;
    }

    // Show current visibility status
    console.log('\n📋 Current visibility status:');
    const visibilityCounts = approvedAssets.reduce((acc, asset) => {
      acc[asset.visibility] = (acc[asset.visibility] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(visibilityCounts).forEach(([visibility, count]) => {
      console.log(`   ${visibility}: ${count} assets`);
    });

    // Update all approved assets to PUBLIC visibility
    console.log('\n🔄 Updating visibility to PUBLIC...');
    
    const result = await prisma.asset.updateMany({
      where: {
        status: 'APPROVED'
      },
      data: {
        visibility: 'PUBLIC'
      }
    });

    console.log(`✅ Successfully updated ${result.count} assets to PUBLIC visibility`);
    
    // Verify the update
    const updatedAssets = await prisma.asset.findMany({
      where: {
        status: 'APPROVED',
        visibility: 'PUBLIC'
      }
    });

    console.log(`\n✓ Verification: ${updatedAssets.length} approved assets now have PUBLIC visibility`);

  } catch (error) {
    console.error('❌ Error updating assets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateApprovedAssetsVisibility()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
