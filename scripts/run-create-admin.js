const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file
const envPath = path.join(__dirname, '../.env');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.error('Error loading .env:', envConfig.error);
  process.exit(1);
}

console.log('DATABASE_URL loaded:', envConfig.parsed.DATABASE_URL ? 'Yes' : 'No');

// Get credentials from environment or command line
const name = process.env.ADMIN_NAME || process.argv[2] || 'Admin';
const email = process.env.ADMIN_EMAIL || process.argv[3];
const password = process.env.ADMIN_PASSWORD || process.argv[4];

if (!email || !password) {
  console.error('❌ Error: Email and password are required');
  console.log('\nUsage:');
  console.log('  node scripts/run-create-admin.js [name] <email> <password>');
  console.log('\nOr set environment variables:');
  console.log('  ADMIN_NAME="Admin" ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword node scripts/run-create-admin.js');
  process.exit(1);
}

const child = spawn('npx', ['tsx', 'scripts/create-admin-user.ts'], {
  cwd: path.join(__dirname, '..'),
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, ...envConfig.parsed }
});

// Send inputs
setTimeout(() => child.stdin.write('yes\n'), 500);  // Confirm if admin exists
setTimeout(() => child.stdin.write(`${name}\n`), 1000);  // Name
setTimeout(() => child.stdin.write(`${email}\n`), 1500);  // Email
setTimeout(() => child.stdin.write(`${password}\n`), 2000);  // Password
setTimeout(() => child.stdin.write(`${password}\n`), 2500);  // Confirm password
setTimeout(() => child.stdin.end(), 3000);

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});
