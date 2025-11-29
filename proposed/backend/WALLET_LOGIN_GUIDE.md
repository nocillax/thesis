# How to Login with Your Wallet

Once you have a wallet (either imported to Rabby or generated via admin), follow these steps to login and get a JWT token.

---

## Option 1: Using the Test Script (Easiest)

1. **Get your private key** (from registration response or Rabby export)

2. **Run the login script:**

```bash
cd backend
node test-wallet-login.js
```

3. **Copy the JWT token** from the output

---

## Option 2: Manual Login via Postman/cURL

### Step 1: Sign a Message

**Using Node.js:**

```bash
node -e "
const ethers = require('ethers');
const privateKey = 'YOUR_PRIVATE_KEY_HERE';
const wallet = new ethers.Wallet(privateKey);
const message = \`Login to Certificate System at \${new Date().toISOString()}\`;
wallet.signMessage(message).then(sig => {
  console.log('Wallet Address:', wallet.address);
  console.log('Message:', message);
  console.log('Signature:', sig);
});
"
```

### Step 2: Send Login Request

**Postman:**

```
POST http://localhost:3001/api/auth/wallet-login
Content-Type: application/json

{
  "walletAddress": "0xABC123...",
  "message": "Login to Certificate System at 2025-11-29T...",
  "signature": "0xDEF456..."
}
```

**Response:**

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 3: Use the Token

Add to all authenticated requests:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Option 3: Using Rabby Wallet in Browser Console (Test Without Frontend)

**Best way to test actual wallet interaction!**

1. **Open any webpage** (or just a blank tab)
2. **Press F12** → Go to **Console** tab
3. **Make sure Rabby wallet is unlocked**
4. **Paste this code** and press Enter:

```javascript
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
const address = accounts[0];
const message = `Login to Certificate System at ${new Date().toISOString()}`;
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, address],
});

console.log('Address:', address);
console.log('Message:', message);
console.log('Signature:', signature);

// Send to backend
fetch('http://localhost:3001/api/auth/wallet-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: address, message, signature }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log('✅ Login successful!');
    console.log('JWT Token:', data.access_token);
  })
  .catch((err) => console.error('❌ Login failed:', err));
```

5. **Rabby popup will appear** → Click "Approve" to sign the message
6. **Your JWT token will appear in console!**

**What happens:**

- Rabby signs the message with your private key (key never leaves wallet)
- Signature is sent to backend
- Backend verifies signature and issues JWT
- Private key is NEVER exposed

---

## Option 4: Frontend Implementation (For Production)

When you build a frontend, use this code:

```javascript
// Frontend code
const message = `Login to Certificate System at ${new Date().toISOString()}`;
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [message, walletAddress],
});

// Send to your backend
const response = await fetch('http://localhost:3001/api/auth/wallet-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress, message, signature }),
});

const data = await response.json();
// Store data.access_token for authenticated requests
```

---

## Quick Test Command

Replace `YOUR_PRIVATE_KEY` with your actual private key:

```bash
node -e "const ethers=require('ethers');const axios=require('axios');(async()=>{const w=new ethers.Wallet('YOUR_PRIVATE_KEY');const m=\`Login to Certificate System at \${new Date().toISOString()}\`;const s=await w.signMessage(m);const r=await axios.post('http://localhost:3001/api/auth/wallet-login',{walletAddress:w.address,message:m,signature:s});console.log('Token:',r.data.access_token);})();"
```
