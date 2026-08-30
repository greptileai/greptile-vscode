const fetch = require('node-fetch');
require('dotenv').config();

// Retrieve the GitHub token from the environment variables
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_ACCESS_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is not set.');
  process.exit(1);
}

async function testMembership() {
  const response = await fetch('https://api.greptile.com/v1/membership', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GITHUB_ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    console.error(`Error: ${response.status} ${response.statusText}`);
    const errorData = await response.json();
    console.error('Error details:', errorData);
    return;
  }

  const data = await response.json();
  console.log('Membership data:', data);
}

testMembership().catch((error) => {
  console.error('An error occurred:', error);
});