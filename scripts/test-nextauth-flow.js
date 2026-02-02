require('dotenv').config();

async function testAuthEndpoint() {
  const email = process.env.TEST_EMAIL || process.argv[2];
  const password = process.env.TEST_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.log('\nUsage:');
    console.log('  node scripts/test-nextauth-flow.js <email> <password>');
    console.log('\nOr set environment variables:');
    console.log('  TEST_EMAIL=admin@example.com TEST_PASSWORD=yourpassword node scripts/test-nextauth-flow.js');
    process.exit(1);
  }

  const credentials = {
    email: email,
    password: password
  };
  
  console.log('Testing NextAuth credentials endpoint...');
  console.log('Email:', credentials.email);
  console.log('Password:', credentials.password);
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        callbackUrl: 'http://localhost:3000/',
        json: 'true'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      console.log('\n✅ Authentication successful!');
    } else {
      console.log('\n❌ Authentication failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuthEndpoint();
