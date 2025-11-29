const axios = require('axios');

const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';
const API_URL = 'http://localhost:3001/api/blockchain';

async function testUserRegistration() {
  console.log('🧪 Testing User Registration\n');

  try {
    console.log('1️⃣  Registering new user...');
    const response = await axios.post(
      `${API_URL}/users/register`,
      {
        username: 'john_doe',
        email: 'john@university.edu',
        is_admin: false,
      },
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('✅ User registered!');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n⚠️  Import private_key to Rabby wallet!\n');

    console.log('2️⃣  Fetching all users...');
    const allUsers = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    console.log('✅ All users:');
    console.log(JSON.stringify(allUsers.data, null, 2));
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUserRegistration();
