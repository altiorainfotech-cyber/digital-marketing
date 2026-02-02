const fetch = require('node-fetch');
const tough = require('tough-cookie');
const fetchCookie = require('fetch-cookie/node-fetch');

async function testLogin() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const email = process.env.TEST_EMAIL || process.argv[2];
  const password = process.env.TEST_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.log('\nUsage:');
    console.log('  node scripts/test-browser-login.js <email> <password>');
    console.log('\nOr set environment variables:');
    console.log('  TEST_EMAIL=admin@example.com TEST_PASSWORD=yourpassword node scripts/test-browser-login.js');
    process.exit(1);
  }

  const cookieJar = new tough.CookieJar();
  const fetchWithCookies = fetchCookie(fetch, cookieJar);
  
  try {
    // Step 1: Get CSRF token
    console.log('Step 1: Getting CSRF token...');
    const csrfResponse = await fetchWithCookies(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData.csrfToken?.substring(0, 20) + '...');
    console.log('Cookies after CSRF:', await cookieJar.getCookies(baseUrl));
    
    // Step 2: Attempt login with CSRF token
    console.log('\nStep 2: Attempting login...');
    const loginResponse = await fetchWithCookies(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
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
    console.log('Response headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    const responseText = await loginResponse.text();
    console.log('Response body:', responseText);
    
    if (loginResponse.status === 200) {
      console.log('\n✅ Login successful!');
      const data = JSON.parse(responseText);
      console.log('Response data:', data);
    } else if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('location');
      console.log('\n🔄 Redirect to:', location);
      
      if (location.includes('error')) {
        console.log('❌ Login failed - redirected to error page');
      } else if (location.includes('signin')) {
        console.log('❌ Login failed - redirected back to signin');
      } else {
        console.log('✅ Login successful - redirected to:', location);
      }
    } else {
      console.log('\n❌ Login failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
