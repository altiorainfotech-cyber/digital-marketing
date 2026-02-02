const bcrypt = require('bcryptjs');
const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function resetPassword() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const newPassword = process.env.ADMIN_PASSWORD || process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Error: Email and new password are required');
    console.log('\nUsage:');
    console.log('  node scripts/reset-admin-password.js <email> <new-password>');
    console.log('\nOr set environment variables:');
    console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=newpassword node scripts/reset-admin-password.js');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log(`Resetting password for: ${email}`);
    console.log(`New password: ${newPassword}\n`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully');
    
    // Update the user
    const result = await pool.query(
      'UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING email, name, role',
      [hashedPassword, email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('\n✅ Password reset successfully!');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`\nYou can now login with:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
    
    // Create audit log
    const userIdResult = await pool.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );
    
    if (userIdResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO "AuditLog" (id, "userId", action, "resourceType", "resourceId", metadata, "createdAt")
         VALUES (gen_random_uuid(), $1, 'UPDATE', 'USER', $1, $2, NOW())`,
        [
          userIdResult.rows[0].id,
          JSON.stringify({ action: 'password_reset', source: 'reset-admin-password script' })
        ]
      );
      console.log('\n✅ Audit log created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

console.log('Admin Password Reset Tool');
console.log('========================\n');

resetPassword();
