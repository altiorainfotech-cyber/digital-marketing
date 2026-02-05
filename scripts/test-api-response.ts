// Quick test to see what the search API returns
// Run this in browser console on the assets page:

/*
fetch('/api/assets/search?limit=1')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    if (data.assets && data.assets[0]) {
      console.log('First asset:', data.assets[0]);
      console.log('Has company?', data.assets[0].company);
      console.log('Has Company?', data.assets[0].Company);
      console.log('Company ID?', data.assets[0].companyId);
    }
  });
*/

// Or test from command line:
async function testApiResponse() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log('Testing API response format...\n');
  console.log('Note: This needs authentication. Run in browser console instead:\n');
  console.log(`
fetch('/api/assets/search?limit=1')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    if (data.assets && data.assets[0]) {
      console.log('First asset:', data.assets[0]);
      console.log('Has company?', data.assets[0].company);
      console.log('Has Company?', data.assets[0].Company);
      console.log('Company ID?', data.assets[0].companyId);
    }
  });
  `);
}

testApiResponse();
