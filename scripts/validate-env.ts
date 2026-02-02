/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are set
 * and have valid values before deployment.
 * 
 * Usage:
 *   npx tsx scripts/validate-env.ts
 *   npx tsx scripts/validate-env.ts --production
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const isProduction = process.argv.includes('--production');
const envFile = isProduction ? '.env.production' : '.env';
config({ path: resolve(process.cwd(), envFile) });

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const result: ValidationResult = {
  valid: true,
  errors: [],
  warnings: [],
};

// Required environment variables
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'STREAM_ACCOUNT_ID',
  'STREAM_API_TOKEN',
  'IMAGES_ACCOUNT_ID',
  'IMAGES_API_TOKEN',
  'IMAGES_ACCOUNT_HASH',
  'NODE_ENV',
];

console.log(`\n🔍 Validating environment variables (${envFile})...\n`);

// Check if all required variables are set
for (const varName of requiredVars) {
  const value = process.env[varName];
  
  if (!value || value.trim() === '') {
    result.valid = false;
    result.errors.push(`❌ ${varName} is not set or empty`);
  } else if (value.includes('your-') || value.includes('REPLACE_')) {
    result.valid = false;
    result.errors.push(`❌ ${varName} contains placeholder value: "${value}"`);
  } else {
    console.log(`✅ ${varName} is set`);
  }
}

// Validate specific formats
console.log('\n🔍 Validating formats...\n');

// DATABASE_URL format
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  if (!dbUrl.startsWith('postgresql://')) {
    result.errors.push('❌ DATABASE_URL must start with "postgresql://"');
  } else if (!dbUrl.includes('sslmode=require')) {
    result.warnings.push('⚠️  DATABASE_URL should include "sslmode=require" for production');
  } else {
    console.log('✅ DATABASE_URL format is valid');
  }
}

// NEXTAUTH_URL format
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  if (isProduction && !nextAuthUrl.startsWith('https://')) {
    result.errors.push('❌ NEXTAUTH_URL must use HTTPS in production');
  } else if (!isProduction && !nextAuthUrl.startsWith('http://localhost')) {
    result.warnings.push('⚠️  NEXTAUTH_URL should be http://localhost for development');
  } else {
    console.log('✅ NEXTAUTH_URL format is valid');
  }
}

// NEXTAUTH_SECRET strength
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (nextAuthSecret) {
  if (nextAuthSecret.length < 32) {
    result.warnings.push('⚠️  NEXTAUTH_SECRET should be at least 32 characters long');
  } else if (nextAuthSecret === 'your-secret-key-here' || nextAuthSecret === 'your-secret-key-here-change-in-production') {
    result.errors.push('❌ NEXTAUTH_SECRET is using default/example value');
  } else {
    console.log('✅ NEXTAUTH_SECRET is strong');
  }
}

// NODE_ENV value
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv) {
  if (isProduction && nodeEnv !== 'production') {
    result.errors.push('❌ NODE_ENV must be "production" for production deployment');
  } else if (!isProduction && nodeEnv !== 'development') {
    result.warnings.push('⚠️  NODE_ENV should be "development" for local development');
  } else {
    console.log('✅ NODE_ENV is correct');
  }
}

// R2_PUBLIC_URL format
const r2PublicUrl = process.env.R2_PUBLIC_URL;
if (r2PublicUrl) {
  if (!r2PublicUrl.startsWith('https://')) {
    result.errors.push('❌ R2_PUBLIC_URL must start with "https://"');
  } else {
    console.log('✅ R2_PUBLIC_URL format is valid');
  }
}

// Production-specific checks
if (isProduction) {
  console.log('\n🔍 Running production-specific checks...\n');
  
  // Check for localhost URLs
  if (nextAuthUrl?.includes('localhost')) {
    result.errors.push('❌ NEXTAUTH_URL cannot contain "localhost" in production');
  }
  
  if (dbUrl?.includes('localhost')) {
    result.errors.push('❌ DATABASE_URL cannot contain "localhost" in production');
  }
  
  // Check for development values
  if (nodeEnv === 'development') {
    result.errors.push('❌ NODE_ENV cannot be "development" in production');
  }
  
  // Check bucket name
  const bucketName = process.env.R2_BUCKET_NAME;
  if (bucketName && !bucketName.includes('prod')) {
    result.warnings.push('⚠️  R2_BUCKET_NAME should include "prod" for production (e.g., "dascms-documents-prod")');
  }
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('VALIDATION RESULTS');
console.log('='.repeat(60) + '\n');

if (result.errors.length > 0) {
  console.log('❌ ERRORS:\n');
  result.errors.forEach(error => console.log(`  ${error}`));
  console.log('');
}

if (result.warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  result.warnings.forEach(warning => console.log(`  ${warning}`));
  console.log('');
}

if (result.valid && result.warnings.length === 0) {
  console.log('✅ All environment variables are valid!\n');
} else if (result.valid) {
  console.log('✅ All required variables are set, but there are warnings.\n');
} else {
  console.log('❌ Validation failed. Please fix the errors above.\n');
}

// Exit with appropriate code
process.exit(result.valid ? 0 : 1);
