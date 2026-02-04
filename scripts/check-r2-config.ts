/**
 * Check R2 Configuration Script
 * 
 * Verifies that R2 is properly configured for asset previews
 * 
 * Usage: npx tsx scripts/check-r2-config.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

interface ConfigCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

function checkConfig(): ConfigCheck[] {
  const checks: ConfigCheck[] = [];

  // Check R2_PUBLIC_URL
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  checks.push({
    name: 'R2_PUBLIC_URL',
    value: r2PublicUrl,
    required: true,
    status: r2PublicUrl ? 'ok' : 'error',
    message: r2PublicUrl 
      ? `✓ Set to: ${r2PublicUrl}`
      : '✗ Not set - asset previews will not work',
  });

  // Check R2_BUCKET_NAME
  const r2BucketName = process.env.R2_BUCKET_NAME;
  checks.push({
    name: 'R2_BUCKET_NAME',
    value: r2BucketName,
    required: true,
    status: r2BucketName ? 'ok' : 'error',
    message: r2BucketName 
      ? `✓ Set to: ${r2BucketName}`
      : '✗ Not set - uploads will fail',
  });

  // Check R2_ACCOUNT_ID
  const r2AccountId = process.env.R2_ACCOUNT_ID;
  checks.push({
    name: 'R2_ACCOUNT_ID',
    value: r2AccountId,
    required: true,
    status: r2AccountId ? 'ok' : 'error',
    message: r2AccountId 
      ? `✓ Set to: ${r2AccountId}`
      : '✗ Not set - uploads will fail',
  });

  // Check R2_ACCESS_KEY_ID
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
  checks.push({
    name: 'R2_ACCESS_KEY_ID',
    value: r2AccessKeyId ? '***' : undefined,
    required: true,
    status: r2AccessKeyId ? 'ok' : 'error',
    message: r2AccessKeyId 
      ? '✓ Set (hidden for security)'
      : '✗ Not set - uploads will fail',
  });

  // Check R2_SECRET_ACCESS_KEY
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  checks.push({
    name: 'R2_SECRET_ACCESS_KEY',
    value: r2SecretAccessKey ? '***' : undefined,
    required: true,
    status: r2SecretAccessKey ? 'ok' : 'error',
    message: r2SecretAccessKey 
      ? '✓ Set (hidden for security)'
      : '✗ Not set - uploads will fail',
  });

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  checks.push({
    name: 'DATABASE_URL',
    value: databaseUrl ? '***' : undefined,
    required: true,
    status: databaseUrl ? 'ok' : 'error',
    message: databaseUrl 
      ? '✓ Set (hidden for security)'
      : '✗ Not set - database operations will fail',
  });

  // Check NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  checks.push({
    name: 'NEXTAUTH_URL',
    value: nextAuthUrl,
    required: true,
    status: nextAuthUrl ? 'ok' : 'error',
    message: nextAuthUrl 
      ? `✓ Set to: ${nextAuthUrl}`
      : '✗ Not set - authentication will fail',
  });

  // Check NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  checks.push({
    name: 'NEXTAUTH_SECRET',
    value: nextAuthSecret ? '***' : undefined,
    required: true,
    status: nextAuthSecret ? 'ok' : 'error',
    message: nextAuthSecret 
      ? '✓ Set (hidden for security)'
      : '✗ Not set - authentication will fail',
  });

  return checks;
}

function printResults(checks: ConfigCheck[]) {
  console.log('\n=== R2 Configuration Check ===\n');

  const errors = checks.filter(c => c.status === 'error');
  const warnings = checks.filter(c => c.status === 'warning');
  const ok = checks.filter(c => c.status === 'ok');

  checks.forEach(check => {
    const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠' : '✗';
    const color = check.status === 'ok' ? '\x1b[32m' : check.status === 'warning' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${icon} ${check.name}${reset}`);
    console.log(`  ${check.message}\n`);
  });

  console.log('=== Summary ===\n');
  console.log(`✓ OK: ${ok.length}`);
  console.log(`⚠ Warnings: ${warnings.length}`);
  console.log(`✗ Errors: ${errors.length}\n`);

  if (errors.length > 0) {
    console.log('\x1b[31m❌ Configuration has errors - please fix before deploying\x1b[0m\n');
    
    console.log('To fix:');
    errors.forEach(error => {
      console.log(`  - Set ${error.name} in your .env file`);
    });
    console.log('');
    
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\x1b[33m⚠️  Configuration has warnings - review before deploying\x1b[0m\n');
  } else {
    console.log('\x1b[32m✅ All configuration checks passed!\x1b[0m\n');
  }

  // Additional R2 setup instructions
  if (process.env.R2_PUBLIC_URL) {
    console.log('=== Next Steps ===\n');
    console.log('1. Verify R2 bucket has public access enabled:');
    console.log('   - Go to Cloudflare Dashboard → R2 → digitalmarketing');
    console.log('   - Check Settings → Public Access\n');
    
    console.log('2. Apply CORS configuration:');
    console.log('   npx wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json\n');
    
    console.log('3. Test public URL access:');
    console.log(`   curl -I ${process.env.R2_PUBLIC_URL}\n`);
    
    console.log('4. For Vercel deployment:');
    console.log('   - Add all environment variables to Vercel Dashboard');
    console.log('   - Redeploy after adding variables\n');
  }
}

// Run checks
const checks = checkConfig();
printResults(checks);
