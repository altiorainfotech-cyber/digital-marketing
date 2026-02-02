const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL || process.argv[2];
const PASSWORD = process.env.TEST_PASSWORD || process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error('❌ Error: Email and password are required');
  console.log('\nUsage:');
  console.log('  node scripts/test-login-flow.js <email> <password>');
  console.log('\nOr set environment variables:');
  console.log('  TEST_EMAIL=admin@example.com TEST_PASSWORD=yourpassword node scripts/test-login-flow.js');
  process.exit(1);
}

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
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

// Extract cookies from response
function extractCookies(cookieHeaders) {
  const cookies = {};
  if (Array.isArray(cookieHeaders)) {
    cookieHeaders.forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      cookies[name.trim()] = value;
    });
  }
  return cookies;
}

// Format cookies for request
function formatCookies(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function testLoginFlow() {
  console.log('🔐 Testing DASCMS Login Flow');
  console.log('================================\n');
  
  let cookies = {};
  
  try {
    // Step 1: Get CSRF token
    console.log('1️⃣  Getting CSRF token...');
    const csrfResponse = await makeRequest(`${BASE_URL}/api/auth/csrf`);
    
    if (csrfResponse.statusCode !== 200) {
      console.log(`❌ Failed to get CSRF token (HTTP ${csrfResponse.statusCode})`);
      return;
    }
    
    const csrfData = JSON.parse(csrfResponse.body);
    const csrfToken = csrfData.csrfToken;
    console.log(`✅ CSRF token received: ${csrfToken.substring(0, 20)}...`);
    
    // Extract cookies
    Object.assign(cookies, extractCookies(csrfResponse.cookies));
    console.log(`   Cookies: ${Object.keys(cookies).join(', ')}\n`);
    
    // Step 2: Attempt login
    console.log('2️⃣  Attempting login...');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
    
    const loginBody = new URLSearchParams({
      csrfToken: csrfToken,
      email: EMAIL,
      password: PASSWORD,
      callbackUrl: `${BASE_URL}/dashboard`,
      json: 'true'
    }).toString();
    
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginBody),
        'Cookie': formatCookies(cookies)
      },
      body: loginBody
    });
    
    console.log(`   Response: HTTP ${loginResponse.statusCode}`);
    
    // Update cookies
    Object.assign(cookies, extractCookies(loginResponse.cookies));
    
    // Check for session cookie
    const hasSessionCookie = Object.keys(cookies).some(key => 
      key.includes('next-auth.session-token') || key.includes('__Secure-next-auth.session-token')
    );
    
    if (hasSessionCookie) {
      console.log(`✅ Session cookie received!`);
      console.log(`   Cookies: ${Object.keys(cookies).join(', ')}\n`);
    } else {
      console.log(`❌ No session cookie received`);
      console.log(`   Available cookies: ${Object.keys(cookies).join(', ')}`);
      
      // Try to parse error from response
      if (loginResponse.body) {
        try {
          const errorData = JSON.parse(loginResponse.body);
          console.log(`   Error: ${JSON.stringify(errorData, null, 2)}`);
        } catch (e) {
          console.log(`   Response body: ${loginResponse.body.substring(0, 200)}`);
        }
      }
      console.log('');
    }
    
    // Step 3: Check session
    console.log('3️⃣  Checking session...');
    const sessionResponse = await makeRequest(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': formatCookies(cookies)
      }
    });
    
    console.log(`   Response: HTTP ${sessionResponse.statusCode}`);
    
    if (sessionResponse.body) {
      const sessionData = JSON.parse(sessionResponse.body);
      
      if (sessionData && sessionData.user) {
        console.log(`✅ Login successful!`);
        console.log(`   User: ${sessionData.user.name} (${sessionData.user.email})`);
        console.log(`   Role: ${sessionData.user.role}`);
        console.log(`   User ID: ${sessionData.user.id}\n`);
        
        // Step 4: Test protected endpoint
        console.log('4️⃣  Testing protected endpoint...');
        const usersResponse = await makeRequest(`${BASE_URL}/api/users`, {
          headers: {
            'Cookie': formatCookies(cookies)
          }
        });
        
        console.log(`   GET /api/users: HTTP ${usersResponse.statusCode}`);
        
        if (usersResponse.statusCode === 200) {
          console.log(`✅ Protected endpoint accessible\n`);
        } else {
          console.log(`❌ Protected endpoint returned ${usersResponse.statusCode}\n`);
        }
        
      } else {
        console.log(`❌ No user data in session`);
        console.log(`   Session: ${JSON.stringify(sessionData, null, 2)}\n`);
      }
    }
    
    console.log('================================');
    console.log('✅ Test Complete');
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error(error.stack);
  }
}

testLoginFlow();
