const { ethers } = require('ethers');
const axios = require('axios');

async function testWalletLogin() {
  // Private key from hardhat.config.js - matches the admin registered in seed-admin.js
  const privateKey =
    '0xadaac4957edb2b7a6b07da5d67b115927aae026b795530d8beb4880c1a555df4';
  const wallet = new ethers.Wallet(privateKey);

  console.log('🔐 Testing Wallet Login...');
  console.log(`Wallet Address: ${wallet.address}\n`);

  // Create message to sign
  const message = `Login to Certificate System at ${new Date().toISOString()}`;
  console.log(`Message: ${message}\n`);

  // Sign the message
  const signature = await wallet.signMessage(message);
  console.log(`Signature: ${signature}\n`);

  // Send login request
  try {
    const response = await axios.post(
      'http://localhost:3001/api/auth/wallet-login',
      {
        walletAddress: wallet.address,
        message: message,
        signature: signature,
      },
    );

    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📋 Copy this token for authenticated requests:');
    console.log(response.data.access_token);
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testWalletLogin();
