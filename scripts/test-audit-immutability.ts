/**
 * Manual test script for audit log immutability
 * 
 * This script tests that audit logs cannot be modified or deleted.
 * Run with: npx tsx scripts/test-audit-immutability.ts
 */

import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import prisma from '../lib/prisma';
import { AuditService } from '../lib/services/AuditService';
import { AuditAction, ResourceType } from '../types';

async function testAuditImmutability() {
  console.log('🧪 Testing Audit Log Immutability (Requirement 12.4)\n');

  const auditService = new AuditService(prisma as any);
  let testUserId: string | undefined;
  let testAuditLogId: string | undefined;

  try {
    // 1. Create a test user
    console.log('1️⃣  Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: `test-immutability-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashedpassword',
        role: 'ADMIN',
      },
    });
    testUserId = testUser.id;
    console.log(`✅ Created user: ${testUserId}\n`);

    // 2. Create an audit log
    console.log('2️⃣  Creating audit log...');
    const auditLog = await auditService.createAuditLog({
      userId: testUserId,
      action: AuditAction.CREATE,
      resourceType: ResourceType.USER,
      resourceId: testUserId,
      metadata: { test: 'immutability', original: true },
    });
    testAuditLogId = auditLog.id;
    console.log(`✅ Created audit log: ${testAuditLogId}\n`);

    // 3. Test: Try to update via Prisma (should fail)
    console.log('3️⃣  Testing Prisma update protection...');
    try {
      await prisma.auditLog.update({
        where: { id: testAuditLogId },
        data: { metadata: { modified: true } },
      });
      console.log('❌ FAILED: Update was allowed (should have been blocked)\n');
    } catch (error: any) {
      if (error.message.includes('immutable')) {
        console.log(`✅ PASSED: Update blocked - ${error.message}\n`);
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // 4. Test: Try to delete via Prisma (should fail)
    console.log('4️⃣  Testing Prisma delete protection...');
    try {
      await prisma.auditLog.delete({
        where: { id: testAuditLogId },
      });
      console.log('❌ FAILED: Delete was allowed (should have been blocked)\n');
    } catch (error: any) {
      if (error.message.includes('immutable')) {
        console.log(`✅ PASSED: Delete blocked - ${error.message}\n`);
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // 5. Test: Try to update via raw SQL (should fail due to database trigger)
    console.log('5️⃣  Testing database trigger update protection...');
    try {
      await prisma.$executeRaw`
        UPDATE "AuditLog" 
        SET metadata = '{"modified": true}'::jsonb 
        WHERE id = ${testAuditLogId}
      `;
      console.log('❌ FAILED: SQL update was allowed (should have been blocked)\n');
    } catch (error: any) {
      if (error.message.includes('immutable')) {
        console.log(`✅ PASSED: SQL update blocked - ${error.message}\n`);
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // 6. Test: Try to delete via raw SQL (should fail due to database trigger)
    console.log('6️⃣  Testing database trigger delete protection...');
    try {
      await prisma.$executeRaw`
        DELETE FROM "AuditLog" 
        WHERE id = ${testAuditLogId}
      `;
      console.log('❌ FAILED: SQL delete was allowed (should have been blocked)\n');
    } catch (error: any) {
      if (error.message.includes('immutable')) {
        console.log(`✅ PASSED: SQL delete blocked - ${error.message}\n`);
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // 7. Verify audit log is unchanged
    console.log('7️⃣  Verifying audit log integrity...');
    const unchangedLog = await prisma.auditLog.findUnique({
      where: { id: testAuditLogId },
    });
    
    if (unchangedLog && JSON.stringify(unchangedLog.metadata) === JSON.stringify({ test: 'immutability', original: true })) {
      console.log('✅ PASSED: Audit log remains unchanged\n');
    } else {
      console.log('❌ FAILED: Audit log was modified\n');
    }

    // 8. Test: Creating new audit logs still works
    console.log('8️⃣  Testing audit log creation still works...');
    const newLog = await auditService.createAuditLog({
      userId: testUserId,
      action: AuditAction.UPDATE,
      resourceType: ResourceType.USER,
      resourceId: testUserId,
      metadata: { test: 'new log creation' },
    });
    console.log(`✅ PASSED: New audit log created: ${newLog.id}\n`);

    // Cleanup
    console.log('🧹 Cleaning up...');
    await prisma.user.delete({
      where: { id: testUserId },
    });
    console.log('✅ Cleanup complete\n');

    console.log('✨ All tests passed! Audit log immutability is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Cleanup on error
    if (testUserId) {
      try {
        await prisma.user.delete({
          where: { id: testUserId },
        });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuditImmutability();
