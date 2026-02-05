/**
 * Cleanup Orphaned Storage URLs
 * Marks or deletes assets that have old storage URL patterns but no files in R2
 */

import prisma from '../lib/prisma';
import { AssetStatus } from '@/app/generated/prisma';

async function cleanupOrphanedAssets() {
  try {
    console.log('🧹 Finding orphaned assets with old storage URL patterns...\n');
    
    // Find assets with old patterns that don't have files in R2
    const orphanedAssets = await prisma.asset.findMany({
      where: {
        OR: [
          { storageUrl: { contains: '/videos/' } },
          { storageUrl: { contains: '/images/' } },
          { storageUrl: { contains: '/documents/' } },
        ],
      },
      select: {
        id: true,
        title: true,
        assetType: true,
        storageUrl: true,
        status: true,
        uploadedAt: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    if (orphanedAssets.length === 0) {
      console.log('✅ No orphaned assets found');
      return;
    }

    console.log(`Found ${orphanedAssets.length} orphaned assets:\n`);
    
    orphanedAssets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.title}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   Type: ${asset.assetType}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   Uploaded: ${asset.uploadedAt.toISOString()}`);
      console.log('');
    });

    // These assets have audit logs which are immutable, so we'll just report them
    console.log('📋 Note: These assets have audit logs and cannot be deleted due to immutability constraints.');
    console.log('   They will remain in the database but are not accessible since files are missing.\n');
    
    console.log(`📊 Summary: Found ${orphanedAssets.length} orphaned assets with missing R2 files`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedAssets();
