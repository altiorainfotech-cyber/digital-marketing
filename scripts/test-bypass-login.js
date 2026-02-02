const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL || process.argv[2];
const PASSWORD = process.env.TEST_PASSWORD || process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error('❌ Error: Email and password are required');
  console.log('\nUsage:');
  console.log('  node scripts/test-bypass-login.js <email> <password>');
  console.log('\nOr set environment variables:');
  console.log('  TEST_EMAIL=admin@example.com TEST_PASSWORD=yourpassword node scripts/test-bypass-login.js');
  process.exit(1);
}

console.log('🚨 Testing Bypass Login Endpoint');
console.log('================================\n');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testBypassLogin() {
  try {
    console.log('1️⃣  Testing bypass login endpoint...');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}\n`);
    
    const loginBody = JSON.stringify({ email: EMAIL, password: PASSWORD });
    
    const response = await makeRequest(`${BASE_URL}/api/auth/bypass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginBody),
      },
      body: loginBody
    });
    
    console.log(`   Response: HTTP ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('✅ Bypass login successful!');
      console.log(`   User: ${data.user.name} (${data.user.email})`);
      console.log(`   Role: ${data.user.role}`);
      
      // Check for session cookie
      const sessionCookie = response.cookies.find(c => c.includes('next-auth.session-token'));
      if (sessionCookie) {
        console.log('✅ Session cookie set!');
        console.log(`   Cookie: ${sessionCookie.substring(0, 50)}...`);
      } else {
        console.log('❌ No session cookie found');
      }
      
      console.log('\n🎉 SUCCESS! You can now access the application at:');
      console.log(`   ${BASE_URL}/auth/bypass`);
      console.log('\n⚠️  Remember to remove this bypass after fixing the database connection!');
      
    } else {
      console.log('❌ Bypass login failed');
      console.log(`   Response: ${response.body}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
  }
}

testBypassLogin();
