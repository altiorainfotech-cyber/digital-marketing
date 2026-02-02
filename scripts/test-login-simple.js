const fetch = require('node-fetch');

async function testLogin() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const email = process.env.TEST_EMAIL || process.argv[2];
  const password = process.env.TEST_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.log('\nUsage:');
    console.log('  node scripts/test-login-simple.js <email> <password>');
    console.log('\nOr set environment variables:');
    console.log('  TEST_EMAIL=admin@example.com TEST_PASSWORD=yourpassword node scripts/test-login-simple.js');
    process.exit(1);
  }

  let cookies = [];
  
  try {
    // Step 1: Get CSRF token
    console.log('Step 1: Getting CSRF token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    
    // Extract cookies
    const setCookieHeaders = csrfResponse.headers.raw()['set-cookie'];
    if (setCookieHeaders) {
      cookies = setCookieHeaders.map(c => c.split(';')[0]);
    }
    
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData.csrfToken?.substring(0, 20) + '...');
    console.log('Cookies:', cookies);
    
    // Step 2: Attempt login with CSRF token and cookies
    console.log('\nStep 2: Attempting login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.join('; ')
      },
      body: new URLSearchParams({
        email: email,
        password: password,
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${baseUrl}/`
      }),
      redirect: 'manual'
    });
    
    console.log('Response status:', loginResponse.status);
    const location = loginResponse.headers.get('location');
    console.log('Redirect location:', location);
    
    if (loginResponse.status === 302) {
      if (location && !location.includes('error') && !location.includes('signin')) {
        console.log('\n✅ Login successful! Redirected to:', location);
      } else {
        console.log('\n❌ Login failed. Redirect:', location);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
