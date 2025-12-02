# Ethers.js Integration: Backend-to-Blockchain Communication

**Prerequisites:** Read `BLOCKCHAIN_FUNDAMENTALS.md`, `DOCKER_NETWORK_ARCHITECTURE.md`, and `SMART_CONTRACT_EXPLAINED.md` first.

**Goal:** Understand how your NestJS backend communicates with the blockchain using ethers.js library.

---

## Table of Contents

1. [What is Ethers.js?](#what-is-ethersjs)
2. [Core Concepts](#core-concepts)
3. [Provider: Reading the Blockchain](#provider-reading-the-blockchain)
4. [Wallet: Signing Transactions](#wallet-signing-transactions)
5. [Contract: Interacting with Smart Contracts](#contract-interacting-with-smart-contracts)
6. [Your Blockchain Service Breakdown](#your-blockchain-service-breakdown)
7. [Transaction Flow](#transaction-flow)
8. [Event Querying](#event-querying)
9. [Error Handling](#error-handling)
10. [Gas Management](#gas-management)

---

## What is Ethers.js?

### The JavaScript Bridge to Blockchain

**Ethers.js** is a JavaScript library that allows your backend to interact with Ethereum-compatible blockchains (like Quorum).

**Without ethers.js:**

```
You would need to:
├─ Manually create HTTP requests
├─ Encode function calls in bytecode
├─ Sign transactions with raw ECDSA
├─ Parse binary responses
└─ Handle nonce management, gas estimation, etc.
```

**With ethers.js:**

```javascript
// Simple function call
const result = await contract.verifyCertificate(cert_hash);
// That's it! Ethers.js handles everything.
```

### Ethers.js vs Web3.js

| Feature       | Ethers.js         | Web3.js          |
| ------------- | ----------------- | ---------------- |
| Bundle size   | Smaller (~116 KB) | Larger (~540 KB) |
| TypeScript    | Native support    | Added later      |
| API design    | Cleaner, modern   | Older, verbose   |
| Documentation | Excellent         | Good             |
| Maintenance   | Active            | Active           |
| Usage         | Newer projects    | Older projects   |

**Why you're using ethers.js:**

- Better TypeScript support (NestJS is TypeScript)
- Cleaner API
- Smaller bundle size
- Industry standard for new projects

---

## Core Concepts

Ethers.js has three fundamental classes:

### 1. Provider

**Purpose:** Read-only connection to the blockchain.

```typescript
const provider = new ethers.JsonRpcProvider("http://localhost:8545");
```

**What it does:**

- Connects to your Quorum node (Validator1)
- Reads blockchain data
- No private key needed
- Free operations (no transactions)

**Example operations:**

```typescript
// Get latest block number
const blockNumber = await provider.getBlockNumber();

// Get block details
const block = await provider.getBlock(blockNumber);

// Get account balance
const balance = await provider.getBalance("0xFE3B557E...");
```

### 2. Wallet

**Purpose:** Sign transactions with a private key.

```typescript
const wallet = new ethers.Wallet(privateKey, provider);
```

**What it does:**

- Holds your private key
- Signs transactions
- Connected to provider (can send signed transactions)

**Example operations:**

```typescript
// Sign a message
const signature = await wallet.signMessage("Hello");

// Get wallet address
const address = wallet.address;

// Send ETH (not used in your system)
const tx = await wallet.sendTransaction({
  to: "0x...",
  value: ethers.parseEther("1.0"),
});
```

### 3. Contract

**Purpose:** Interface to a deployed smart contract.

```typescript
const contract = new ethers.Contract(contractAddress, abi, wallet);
```

**What it does:**

- CertificateRegistry: 0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD
- UserRegistry: 0xECB550dE5c73e6690AB4521C03EC9D476617167E
- Translates function calls to transactions
- Parses return values
- Handles events

**Example operations:**

```typescript
// Call contract function (creates transaction)
const tx = await contract.issueCertificate(...args);

// Read contract data (no transaction, free)
const cert = await contract.verifyCertificate(cert_hash);

// Query events
const events = await contract.queryFilter(contract.filters.CertificateIssued());
```

### Relationship Between Components

```
┌──────────────────────────────────────────────────────────┐
│ Your NestJS Backend                                      │
│                                                          │
│  ┌────────────┐                                         │
│  │Admin Wallet│ (signs all transactions)               │
│  │0xFE3B557E..│ (pays gas via meta-transactions)       │
│  └─────┬──────┘                                         │
│        │ signs transactions                              │
│        ↓                                                 │
│  ┌────────────────────────────────────┐                │
│  │   CertificateRegistry Contract      │                │
│  │  Address: 0xa1dc9167B1a8F201...    │                │
│  │  ABI: [function definitions]        │                │
│  └────────────┬───────────────────────┘                │
│               │                                          │
│  ┌────────────────────────────────────┐                │
│  │   UserRegistry Contract             │                │
│  │  Address: 0xECB550dE5c73e669...    │                │
│  │  ABI: [function definitions]        │                │
│  └────────────┬───────────────────────┘                │
│               │ both use                                 │
│               ↓                                          │
│  ┌────────────────────────────────────┐                │
│  │          Provider                   │                │
│  │  RPC: http://localhost:8545         │                │
│  └────────────┬───────────────────────┘                │
└───────────────┼──────────────────────────────────────────┘
                │ HTTP JSON-RPC
                ↓
┌───────────────────────────────────────────────────────┐
│ Quorum RPC Node                                        │
│ Port 8545 (RPC endpoint)                              │
└───────────────────────────────────────────────────────┘
```

---

## Provider: Reading the Blockchain

### Creating a Provider

**Your code:**

```typescript
const rpcUrl =
  this.configService.get<string>("RPC_URL") || "http://localhost:8545";
this.provider = new ethers.JsonRpcProvider(rpcUrl);
```

### What is JsonRpcProvider?

**JSON-RPC** = Remote Procedure Call protocol using JSON format.

**How it works:**

```
Your Backend                          Validator1 Node
     │                                       │
     │  HTTP POST request                   │
     │  {                                    │
     │    "method": "eth_blockNumber",      │
     │    "params": []                       │
     │  }                                    │
     ├──────────────────────────────────────→│
     │                                       │ Process request
     │                                       │ Read blockchain
     │                                       │
     │  HTTP Response                        │
     │  {                                    │
     │    "result": "0x1f4"  (block 500)    │
     │  }                                    │
     │←──────────────────────────────────────┤
     │                                       │
```

### Provider Methods Used in Your System

**1. getBlockNumber()**

```typescript
const blockNumber = await provider.getBlockNumber();
```

**What it does:**

- Queries latest block on blockchain
- Returns: Integer (e.g., 500)

**RPC call under the hood:**

```json
Request:  {"method": "eth_blockNumber", "params": []}
Response: {"result": "0x1f4"}  // 500 in hex
```

**2. getBlock()**

```typescript
const block = await provider.getBlock(500);
```

**Returns:**

```javascript
{
  number: 500,
  hash: "0xabc123...",
  parentHash: "0xdef456...",
  timestamp: 1700000000,
  transactions: ["0x111...", "0x222..."],
  gasLimit: BigInt("3758096384"),
  gasUsed: BigInt("500000"),
  // ... more fields
}
```

**3. getBalance()**

```typescript
const balance = await provider.getBalance("0xFE3B557E...");
```

**Returns:**

- Balance in wei (smallest unit)
- Example: BigInt("1000000000000000000") = 1 ETH

**In your Quorum system:**

- Accounts have balance (from genesis.json)
- But gasPrice = 0, so balance doesn't decrease
- Used for account validation

### Provider Connection Management

**Connection test:**

```typescript
onModuleInit() {
  this.provider = new ethers.JsonRpcProvider(rpcUrl);

  // Test connection
  this.provider.getBlockNumber()
    .then(blockNumber => {
      console.log('✅ Connected to blockchain, block:', blockNumber);
    })
    .catch(error => {
      console.error('❌ Failed to connect:', error.message);
    });
}
```

**What if Validator1 is down?**

```typescript
// Error example
try {
  const blockNumber = await provider.getBlockNumber();
} catch (error) {
  // Error: could not detect network (event="noNetwork", code=NETWORK_ERROR)
}
```

**Solution: Multiple providers (not implemented yet)**

```typescript
const providers = [
  new ethers.JsonRpcProvider("http://localhost:8545"), // Validator1
  new ethers.JsonRpcProvider("http://localhost:8547"), // Validator2
  new ethers.JsonRpcProvider("http://localhost:8548"), // Validator3
];

const fallbackProvider = new ethers.FallbackProvider(providers);
```

---

## Wallet: Signing Transactions

### Creating a Wallet

**Your code:**

```typescript
const privateKey = this.configService.get<string>("PRIVATE_KEY") || "";
this.wallet = new ethers.Wallet(privateKey, this.provider);
```

### What Happens Behind the Scenes?

**Step 1: Parse private key**

```typescript
privateKey =
  "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
```

**Step 2: Derive public key**

```
Private Key (256 bits)
    ↓ [Elliptic Curve Math: G × private_key]
Public Key (512 bits: x and y coordinates)
    ↓ [Keccak256 hash]
Hash (256 bits)
    ↓ [Take last 20 bytes]
Address: 0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73
```

**Step 3: Connect to provider**

```typescript
wallet.connect(provider);
```

Now wallet can:

- Read from blockchain (via provider)
- Sign transactions (with private key)
- Send signed transactions (via provider)

### Wallet Properties

```typescript
// Admin wallet (pre-funded in genesis.json)
console.log(this.adminWallet.address);
// "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73"

console.log(await this.adminWallet.getBalance());
// BigInt("1000000000000000000000000000") // From genesis allocation

console.log(await this.adminWallet.getNonce());
// 347 (number of transactions sent by admin wallet)

// User wallets (generated during registration, imported to Rabby)
// Users don't sign transactions - admin wallet handles all blockchain interactions
// But issuer_address parameter records which user issued each certificate
```

### Signing Messages

**Your code (inline in issueCertificate):**

```typescript
// Backend signs with admin wallet (can be updated to accept user signatures in future)
const signature = await this.adminWallet.signMessage(
  ethers.getBytes(cert_hash)
);
```

**What `signMessage` does:**

```
1. Adds Ethereum prefix:
   prefix = "\x19Ethereum Signed Message:\n32"
   message = prefix + cert_hash_bytes

2. Hash the prefixed message:
   messageHash = keccak256(message)

3. Sign with ECDSA:
   signature = ECDSA_sign(messageHash, admin_private_key)

4. Format signature:
   r: 32 bytes
   s: 32 bytes
   v: 1 byte
   Return: "0x" + hex(r + s + v)
```

**Result:**

```
"0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e1b"
```

**Meta-transaction pattern:** Admin wallet signs and pays gas, but `issuer_address` parameter records the actual user who issued the certificate. This maintains accountability while simplifying gas management!

### Signing Transactions

**Happens automatically when you call contract functions:**

```typescript
const tx = await contract.issueCertificate(...args);
```

**Behind the scenes:**

```
1. Create transaction object:
   {
     to: "0x42699A7612A82f1d9C36148af9C77354759b210b",  // Contract address
     data: "0x8a4f2c9d...",  // Encoded function call
     nonce: 15,
     gasLimit: 5000000,
     gasPrice: 0,
     chainId: 1337
   }

2. Sign transaction:
   signedTx = wallet.signTransaction(tx)

3. Send to blockchain:
   txHash = provider.sendTransaction(signedTx)

4. Return transaction response:
   return {hash: txHash, wait: function() {...}}
```

---

## Contract: Interacting with Smart Contracts

### Creating a Contract Instance

**Your code:**

```typescript
this.contract = new ethers.Contract(
  contractAddress, // "0x42699A7612A82f1d9C36148af9C77354759b210b"
  CONTRACT_ABI, // Array of function signatures
  this.wallet // Signer (for transactions)
);
```

### What is ABI?

**ABI** = Application Binary Interface

**Purpose:** Tells ethers.js how to interact with your contract.

**Your ABI:**

```typescript
const CONTRACT_ABI = [
  "function issueCertificate(bytes32 cert_hash, string student_id, string student_name, string degree_program, uint16 cgpa, string issuing_authority, bytes signature, address issuer_address) external",
  "function verifyCertificate(bytes32 cert_hash) external view returns (string student_id, uint256 version, string student_name, string degree_program, uint16 cgpa, string issuing_authority, address issuer, bool is_revoked, bytes signature, uint256 issuance_date)",
  "function revokeCertificate(bytes32 cert_hash) external",
  "function reactivateCertificate(bytes32 cert_hash) external",
  "function getActiveCertificate(string student_id) external view returns (tuple(...))",
  "function getAllVersions(string student_id) external view returns (bytes32[])",
  "function student_to_latest_version(string student_id) external view returns (uint256)",
  "function student_to_active_cert_hash(string student_id) external view returns (bytes32)",
  "event CertificateIssued(bytes32 indexed cert_hash, string indexed student_id, uint256 version, address indexed issuer, uint256 block_number)",
  "event CertificateRevoked(bytes32 indexed cert_hash, address indexed revoked_by, uint256 block_number)",
  "event CertificateReactivated(bytes32 indexed cert_hash, address indexed reactivated_by, uint256 block_number)",
];

const USER_REGISTRY_ABI = [
  "function registerUser(address wallet_address, string username, string email, bool is_admin) external",
  "function getUser(address wallet_address) external view returns (string username, string email, uint256 registration_date, bool is_authorized, bool is_admin)",
  "function getUserByEmail(string email) external view returns (address wallet_address, string username, uint256 registration_date, bool is_authorized, bool is_admin)",
  "function revokeUser(address wallet_address) external",
  "function reactivateUser(address wallet_address) external",
  "function grantAdmin(address wallet_address) external",
  "function revokeAdmin(address wallet_address) external",
  "function isAuthorized(address wallet_address) external view returns (bool)",
  "function userExists(address wallet_address) external view returns (bool)",
  "event UserRegistered(address indexed wallet_address, string username, string email, uint256 registration_date)",
  "event UserRevoked(address indexed wallet_address)",
  "event UserReactivated(address indexed wallet_address)",
];
```

**What ABI contains:**

- Function names
- Parameter types
- Return types
- Event definitions
- Function modifiers (view, external, etc.)

**Full ABI format (JSON):**

When you compile your contract with Hardhat, it generates a complete ABI:

```json
[
  {
    "type": "function",
    "name": "issueCertificate",
    "inputs": [
      { "name": "cert_hash", "type": "bytes32" },
      { "name": "student_id", "type": "string" },
      { "name": "student_name", "type": "string" },
      { "name": "degree_program", "type": "string" },
      { "name": "cgpa", "type": "uint16" },
      { "name": "issuing_authority", "type": "string" },
      { "name": "signature", "type": "bytes" },
      { "name": "issuer_address", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
  // ... more functions
]
```

**Why human-readable strings work:**

Ethers.js v6 supports **human-readable ABI** (simpler):

```typescript
"function issueCertificate(bytes32 cert_hash, ...) external";
```

Instead of full JSON. Much easier to write!

### Calling Contract Functions

**Two types of calls:**

**1. Read-only calls (`view` functions) - FREE**

```typescript
const result = await contract.verifyCertificate(cert_hash);
```

**What happens:**

```
1. Encode function call:
   data = encode("verifyCertificate", [cert_hash])

2. Send eth_call RPC request:
   {
     "method": "eth_call",
     "params": [{
       "to": "0x4261D524bc701dA4AC49339e5F8b299977045eA5",
       "data": "0x8a4f2c9d7f8a3c2b..."
     }, "latest"]
   }

3. Node executes function locally (no transaction, no gas)

4. Return decoded result:
   {
     student_name: "John Doe",
     degree_program: "Computer Science",
     cgpa: 385,
     ...
   }
```

**2. State-changing calls (transactions) - COSTS GAS**

```typescript
const tx = await contract.issueCertificate(...args);
const receipt = await tx.wait();
```

**What happens:**

```
1. Encode function call:
   data = encode("issueCertificate", [cert_hash, student_name, ...])

2. Create transaction:
   {
     to: contract_address,
     data: encoded_data,
     gasLimit: estimated,
     gasPrice: 0,
     nonce: auto_incremented
   }

3. Sign with wallet private key

4. Send eth_sendRawTransaction RPC request

5. Transaction enters mempool

6. Validator includes in block

7. Consensus reached, block added

8. Transaction receipt available:
   {
     transactionHash: "0xabc...",
     blockNumber: 500,
     status: 1  (success),
     gasUsed: 178703
   }
```

---

## Your Blockchain Service Breakdown

Let's analyze your entire `blockchain.service.ts` file function by function.

### registerNewUser Function

```typescript
async registerNewUser(
  username: string,
  email: string,
  is_admin: boolean = false,
) {
  if (!this.userRegistryContract) {
    throw new BadRequestException('UserRegistry not configured');
  }

  // Generate random wallet for new user
  const newWallet = ethers.Wallet.createRandom();
  const walletAddress = newWallet.address;
  const privateKey = newWallet.privateKey;

  try {
    // Register user on UserRegistry contract
    const tx = await this.userRegistryContract.registerUser(
      walletAddress,
      username,
      email,
      is_admin,
    );
    const receipt = await tx.wait();

    console.log(`✅ User registered: ${username} (${walletAddress})`);

    return {
      success: true,
      message: 'User registered successfully. Import private key to Rabby wallet.',
      wallet_address: walletAddress,
      private_key: privateKey,  // ⚠️ Returned ONCE for Rabby import
      username,
      email,
      is_admin,
      transaction_hash: receipt.hash,
      block_number: receipt.blockNumber,
    };
  } catch (error) {
    if (error.reason) {
      throw new BadRequestException(error.reason);
    }
    throw new BadRequestException(error.message || 'Failed to register user');
  }
}
```

**Key points:**

1. **Wallet generation:** `ethers.Wallet.createRandom()` creates a new random wallet
2. **Private key security:** Returned ONCE for user to import to Rabby wallet
3. **No storage:** Private key NOT stored in backend (user's responsibility)
4. **UserRegistry contract:** Stores username, email, is_admin, is_authorized on blockchain
5. **Admin signs:** Admin wallet calls `registerUser()` and pays gas

### Module Initialization

```typescript
async onModuleInit() {
  const rpcUrl = this.configService.get<string>('RPC_URL') || 'http://localhost:8545';
  const privateKey = this.configService.get<string>('PRIVATE_KEY') || '';
  const certificateAddress = this.configService.get<string>('CONTRACT_ADDRESS') || '';
  const userRegistryAddress = this.configService.get<string>('USER_REGISTRY_ADDRESS') || '';

  if (!privateKey || !certificateAddress) {
    throw new Error('Missing PRIVATE_KEY or CONTRACT_ADDRESS in environment');
  }

  this.provider = new ethers.JsonRpcProvider(rpcUrl);
  this.adminWallet = new ethers.Wallet(privateKey, this.provider);
  this.certificateContract = new ethers.Contract(
    certificateAddress,
    CONTRACT_ABI,
    this.adminWallet,
  );

  if (userRegistryAddress) {
    this.userRegistryContract = new ethers.Contract(
      userRegistryAddress,
      USER_REGISTRY_ABI,
      this.adminWallet,
    );
  }

  console.log('✅ Blockchain service initialized');
  console.log(`   RPC: ${rpcUrl}`);
  console.log(`   Certificate Contract: ${certificateAddress}`);
  console.log(`   User Registry Contract: ${userRegistryAddress}`);
}
```

**When this runs:**

- NestJS app startup
- Before any HTTP requests are handled
- Creates provider, wallet, contract once (singleton)

**Why singleton?**

- Reuse same connection for all requests
- No need to reconnect every time
- More efficient

**Error handling:**

```typescript
if (!privateKey || !contractAddress) {
  throw new Error("Missing PRIVATE_KEY or CONTRACT_ADDRESS in environment");
}
```

**Why this check?**

- Fail fast (at startup, not during request)
- Clear error message
- Prevents undefined behavior

### computeHash Function

```typescript
computeHash(
  student_id: string,
  student_name: string,
  degree_program: string,
  cgpa: number,
  version: number,
  issuance_date: number,
): string {
  const data =
    student_id +
    student_name +
    degree_program +
    cgpa.toString() +
    version.toString() +
    issuance_date.toString();
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}
```

**Step-by-step execution:**

**Example input:**

```typescript
student_id: "22-46734-1";
student_name: "Alice";
degree_program: "BSc CS";
cgpa: 3.85;
version: 1;
issuance_date: 1700000000;
```

**Step 1: Concatenate**

```javascript
const data = "22-46734-1" + "Alice" + "BSc CS" + "3.85" + "1" + "1700000000";
// Result: "22-46734-1AliceBSc CS3.8511700000000"
```

**Step 2: Convert to UTF-8 bytes**

```typescript
ethers.toUtf8Bytes(data);
// Returns: Uint8Array[69] = [50, 48, 49, 48, 49, 48, 48, 49, 65, 104, ...]
```

**Step 3: Hash with keccak256**

```typescript
ethers.keccak256(bytes);
// Returns: "0x4a3f9e2d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d"
```

**Why not hash in smart contract?**

You could do:

```solidity
// In smart contract
bytes32 cert_hash = keccak256(abi.encodePacked(student_id, student_name, ...));
```

**But you don't because:**

- Passing all fields separately costs more gas
- Pre-computing hash in backend saves gas
- Hash serves as unique identifier (like primary key)
- Consistency: Same hash used for signing

### issueCertificate Function

```typescript
async issueCertificate(
  student_id: string,
  student_name: string,
  degree_program: string,
  cgpa: number,
  issuing_authority: string,
  username: string,
  walletAddress: string,
) {
  try {
    // Check if student already has an active certificate
    const latestVersion = await this.certificateContract.student_to_latest_version(student_id);
    const version = Number(latestVersion) + 1;

    const issuance_date = Math.floor(Date.now() / 1000);
    const cert_hash = this.computeHash(
      student_id,
      student_name,
      degree_program,
      cgpa,
      version,
      issuance_date,
    );

    // Backend signs with admin wallet (can be updated to accept user signatures in future)
    const signature = await this.adminWallet.signMessage(
      ethers.getBytes(cert_hash),
    );
    const cgpa_scaled = Math.round(cgpa * 100);

    // Admin wallet pays gas, but actual issuer is recorded
    const tx = await this.certificateContract.issueCertificate(
      cert_hash,
      student_id,
      student_name,
      degree_program,
      cgpa_scaled,
      issuing_authority,
      signature,
      walletAddress,  // Actual issuer recorded (meta-transaction pattern)
    );

    const receipt = await tx.wait();

    return {
      success: true,
      student_id,
      version,
      cert_hash,
      transaction_hash: receipt.hash,
      block_number: receipt.blockNumber,
      signature,
    };
  } catch (error) {
    console.error('❌ Certificate issuance failed:', error);

    // Extract clean error message from smart contract revert
    if (error.reason) {
      throw new BadRequestException(error.reason);
    }

    // Handle CALL_EXCEPTION errors with revert data
    if (error.code === 'CALL_EXCEPTION' && error.revert?.args?.[0]) {
      throw new BadRequestException(error.revert.args[0]);
    }

    throw new BadRequestException(
      error.message || 'Failed to issue certificate',
    );
  }
}
```

**Step-by-step execution:**

**Step 1: Get current timestamp**

```typescript
const issuance_date = Math.floor(Date.now() / 1000);
```

**What this does:**

- `Date.now()`: Returns milliseconds since Unix epoch (1970)
- `/ 1000`: Convert to seconds
- `Math.floor()`: Remove decimal part
- Example: 1700000000

**Step 2: Compute certificate hash**

```typescript
const cert_hash = this.computeHash(...);
```

Creates unique identifier for this certificate.

**Step 3: Sign the hash**

```typescript
const signature = await this.signCertificate(cert_hash);
```

Creates cryptographic proof of authorization.

**Step 4: Scale CGPA**

```typescript
const cgpa_scaled = Math.round(cgpa * 100);
// 3.92 → 392
```

**Why scale?**

- Solidity has no decimals
- Store as integer: 3.92 × 100 = 392
- uint16 max value: 65535 (enough for 0-655.35)
- Supports 4.0 scale perfectly!

**Your contract:**

```solidity
uint16 cgpa;  // 0-65535 range
```

**Range validation:**

```solidity
require(cgpa <= 400, "Invalid CGPA");  // Max 4.00
```

**When reading back:**

```typescript
cgpa: Number(result.cgpa) / 100; // 392 → 3.92
```

**Step 5: Send transaction**

```typescript
const tx = await this.contract.issueCertificate(...);
```

**What `tx` contains:**

```javascript
{
  hash: "0xabc123...",           // Transaction hash
  to: "0x42699A7612A82f1d...",   // Contract address
  from: "0xFE3B557E8Fb62b...",   // Your wallet
  data: "0x8a4f2c9d...",         // Encoded function call
  nonce: 15,
  gasLimit: BigInt("5000000"),
  gasPrice: BigInt("0"),
  chainId: 1337,
  wait: async function() {...}   // Wait for confirmation
}
```

**At this point:**

- Transaction is sent to blockchain
- But NOT yet confirmed
- Waiting in mempool

**Step 6: Wait for confirmation**

```typescript
const receipt = await tx.wait();
```

**What this does:**

- Polls blockchain every 1 second
- Checks if transaction is in a block
- Returns when confirmed (or reverts if failed)

**Receipt object:**

```javascript
{
  transactionHash: "0xabc123...",
  blockNumber: 500,
  blockHash: "0xdef456...",
  from: "0xFE3B557E...",
  to: "0x42699A7612A82f1d...",
  status: 1,  // 1 = success, 0 = reverted
  gasUsed: BigInt("178703"),
  logs: [/* Event logs */],
  // ... more fields
}
```

**Step 7: Return result**

```typescript
return {
  success: true,
  certificate_number,
  cert_hash,
  transaction_hash: receipt.hash,
  block_number: receipt.blockNumber,
  signature,
};
```

### verifyCertificate Function

```typescript
async verifyCertificate(cert_hash: string) {
  const result = await this.contract.verifyCertificate(cert_hash);

  // Fetch issuer name from UserRegistry
  let issuerName = 'Unknown';
  try {
    if (this.userRegistryContract) {
      const userInfo = await this.userRegistryContract.getUser(result.issuer);
      issuerName = userInfo.username;
    }
  } catch (error) {
    console.warn(`⚠️  Could not fetch issuer name for ${result.issuer}`);
  }

  return {
    cert_hash,
    student_id: result.student_id,
    version: Number(result.version),
    student_name: result.student_name,
    degree_program: result.degree_program,
    cgpa: Number(result.cgpa) / 100,
    issuing_authority: result.issuing_authority,
    issuer: result.issuer,
    issuer_name: issuerName,
    is_revoked: result.is_revoked,
    signature: result.signature,
    issuance_date: new Date(Number(result.issuance_date) * 1000).toISOString(),
  };
}
```

**Step 1: Call contract view function**

```typescript
const result = await this.contract.verifyCertificate(cert_hash);
```

**What `result` contains:**

```javascript
{
  student_id: "22-46734-1",
  version: 1n,  // BigInt (uint256)
  student_name: "Alice",
  degree_program: "BSc CS",
  cgpa: 385n,  // BigInt (uint16)
  issuing_authority: "BRAC University",
  issuer: "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73",  // Admin wallet (meta-transaction)
  is_revoked: false,
  signature: "0x7c8d9e0f...",
  issuance_date: 1700000000n  // BigInt
}
```

**Note:** Backend then fetches issuer name from UserRegistry contract:

```typescript
let issuerName = "Unknown";
try {
  if (this.userRegistryContract) {
    const userInfo = await this.userRegistryContract.getUser(result.issuer);
    issuerName = userInfo.username;
  }
} catch (error) {
  console.warn(`⚠️  Could not fetch issuer name for ${result.issuer}`);
}
```

**Note:** Numbers are BigInt (indicated by `n`)

**Step 2: Transform and return**

**cgpa conversion:**

```typescript
cgpa: Number(result.cgpa) / 100;
// 392n → 392 → 3.92
```

**Why `Number()`?**

- Convert BigInt to regular number
- Safe for small numbers (cgpa < 1000)
- Makes it usable in frontend

**issuance_date conversion:**

```typescript
issuance_date: Number(result.issuance_date);
// 1700000000n → 1700000000
```

**Why this is safe:**

- Unix timestamps fit in JavaScript number (53-bit precision)
- Won't lose precision until year ~285,616

### revokeCertificate Function

```typescript
async revokeCertificate(cert_hash: string) {
  const tx = await this.contract.revokeCertificate(cert_hash);
  const receipt = await tx.wait();

  return {
    success: true,
    cert_hash,
    transaction_hash: receipt.hash,
    block_number: receipt.blockNumber,
  };
}
```

**Simple transaction flow:**

1. Call contract function → Returns transaction
2. Wait for confirmation → Returns receipt
3. Extract relevant fields → Return to caller

**No need for:**

- Computing hash (already have it)
- Signing message (transaction is automatically signed)
- Transforming data (no return values from contract)

### registerNewUser Function

```typescript
async registerNewUser(
  username: string,
  email: string,
  is_admin: boolean = false,
) {
  if (!this.userRegistryContract) {
    throw new BadRequestException('UserRegistry not configured');
  }

  // Generate random wallet for new user
  const newWallet = ethers.Wallet.createRandom();
  const walletAddress = newWallet.address;
  const privateKey = newWallet.privateKey;

  try {
    // Register user on UserRegistry contract
    const tx = await this.userRegistryContract.registerUser(
      walletAddress,
      username,
      email,
      is_admin,
    );
    const receipt = await tx.wait();

    console.log(`✅ User registered: ${username} (${walletAddress})`);

    return {
      success: true,
      message: 'User registered successfully. Import private key to Rabby wallet.',
      wallet_address: walletAddress,
      private_key: privateKey,  // ⚠️ Returned ONCE for Rabby import
      username,
      email,
      is_admin,
      transaction_hash: receipt.hash,
      block_number: receipt.blockNumber,
    };
  } catch (error) {
    if (error.reason) {
      throw new BadRequestException(error.reason);
    }
    throw new BadRequestException(error.message || 'Failed to register user');
  }
}
```

**Key points:**

1. **Wallet generation:** `ethers.Wallet.createRandom()` creates a new random wallet
2. **Private key security:** Returned ONCE for user to import to Rabby wallet
3. **No storage:** Private key NOT stored in backend (user's responsibility)
4. **UserRegistry contract:** Stores username, email, is_admin, is_authorized on blockchain
5. **Admin signs:** Admin wallet calls `registerUser()` and pays gas

### getAuditLogs Function

```typescript
async getAuditLogs(cert_hash: string) {
  const issuedFilter = this.contract.filters.CertificateIssued(cert_hash);
  const revokedFilter = this.contract.filters.CertificateRevoked(cert_hash);
  const reactivatedFilter = this.contract.filters.CertificateReactivated(cert_hash);

  const [issuedEvents, revokedEvents, reactivatedEvents] = await Promise.all([
    this.contract.queryFilter(issuedFilter),
    this.contract.queryFilter(revokedFilter),
    this.contract.queryFilter(reactivatedFilter),
  ]);

  const allEvents = [
    ...issuedEvents.map((e) => {
      if ('args' in e) {
        return {
          action: 'ISSUED',
          cert_hash: e.args.cert_hash,
          issuer: e.args.issuer,
          block_number: Number(e.args.block_number),
          transaction_hash: e.transactionHash,
        };
      }
    }).filter(Boolean),
    ...revokedEvents.map((e) => {
      if ('args' in e) {
        return {
          action: 'REVOKED',
          cert_hash: e.args.cert_hash,
          revoked_by: e.args.revoked_by,
          block_number: Number(e.args.block_number),
          transaction_hash: e.transactionHash,
        };
      }
    }).filter(Boolean),
    ...reactivatedEvents.map((e) => {
      if ('args' in e) {
        return {
          action: 'REACTIVATED',
          cert_hash: e.args.cert_hash,
          reactivated_by: e.args.reactivated_by,
          block_number: Number(e.args.block_number),
          transaction_hash: e.transactionHash,
        };
      }
    }).filter(Boolean),
  ];

  return allEvents
    .filter((e): e is NonNullable<typeof e> => e !== undefined)
    .sort((a, b) => a.block_number - b.block_number);
}
```

**Step 1: Create event filters**

```typescript
const issuedFilter = this.contract.filters.CertificateIssued(cert_hash);
```

**What is a filter?**

- Specifies which events to query
- Can filter by indexed parameters
- Example: Get all CertificateIssued events for specific cert_hash

**Filter structure:**

```javascript
{
  address: "0x42699A7612A82f1d9C36148af9C77354759b210b",
  topics: [
    "0x8e9f5d3a...",  // Event signature hash
    "0x4a3f9e2d..."   // cert_hash (indexed parameter)
  ]
}
```

**Step 2: Query events in parallel**

```typescript
const [issuedEvents, revokedEvents, reactivatedEvents] = await Promise.all([...]);
```

**Why `Promise.all`?**

- Runs all 3 queries simultaneously
- Faster than sequential (saves 2x round trips)
- Waits for all to complete

**Step 3: Map events to structured objects**

```typescript
issuedEvents.map((e) => {
  if ("args" in e) {
    return {
      action: "ISSUED",
      cert_hash: e.args.cert_hash,
      issuer: e.args.issuer,
      block_number: Number(e.args.block_number),
      transaction_hash: e.transactionHash,
    };
  }
});
```

**Why `if ('args' in e)`?**

- Type guard for TypeScript
- ethers.js returns `EventLog | Log`
- Only `EventLog` has `args` property
- Ensures type safety

**Step 4: Combine and sort**

```typescript
return allEvents
  .filter((e): e is NonNullable<typeof e> => e !== undefined)
  .sort((a, b) => a.block_number - b.block_number);
```

**Result:**

```javascript
[
  {
    action: "ISSUED",
    cert_hash: "0x4a3f9e2d...",
    issuer: "0xFE3B557E...",
    block_number: 500,
    transaction_hash: "0xabc123...",
  },
  {
    action: "REVOKED",
    cert_hash: "0x4a3f9e2d...",
    revoked_by: "0xFE3B557E...",
    block_number: 650,
    transaction_hash: "0xdef456...",
  },
  {
    action: "REACTIVATED",
    cert_hash: "0x4a3f9e2d...",
    reactivated_by: "0xFE3B557E...",
    block_number: 700,
    transaction_hash: "0x789abc...",
  },
];
```

**Complete timeline for a certificate!**

---

## Transaction Flow

### Detailed Transaction Lifecycle

**From function call to blockchain:**

```
Step 1: Backend calls contract function
├─ await contract.issueCertificate(...)
└─ Ethers.js begins processing

Step 2: Encode function call
├─ Function signature: "issueCertificate(bytes32,string,string,uint8,string,bytes)"
├─ Hash signature: keccak256("issueCertificate(...)") → 0x8a4f2c9d (first 4 bytes)
├─ Encode parameters: ABI encoding
└─ Result: "0x8a4f2c9d0000000000000000000000004a3f9e2d8c7b6a5f..."

Step 3: Create transaction object
├─ to: contract_address
├─ data: encoded_function_call
├─ from: wallet.address
├─ nonce: await wallet.getNonce() (auto-fetched)
├─ gasLimit: await estimateGas() (auto-estimated)
└─ gasPrice: 0 (from network)

Step 4: Sign transaction
├─ Serialize transaction (RLP encoding)
├─ Hash serialized transaction: keccak256(RLP(tx))
├─ Sign hash with ECDSA: (r, s, v)
└─ Append signature to transaction

Step 5: Send to blockchain
├─ RPC call: eth_sendRawTransaction
├─ Parameter: signed_transaction_hex
└─ Response: transaction_hash

Step 6: Transaction in mempool
├─ Validator1 receives transaction
├─ Validates signature, nonce, gas
├─ Adds to mempool (pending transactions)
└─ Waits for proposer to include in block

Step 7: Block proposal (IBFT)
├─ Proposer (e.g., Validator1) selects transactions
├─ Creates block #500 with this transaction
├─ Proposes to other validators
└─ Consensus process begins

Step 8: Block confirmation
├─ Validators vote (IBFT PREPARE/COMMIT)
├─ 3/4 validators agree
├─ Block #500 is finalized
└─ Transaction is now confirmed

Step 9: Receipt available
├─ Provider polls: eth_getTransactionReceipt(tx_hash)
├─ Receipt exists (transaction mined)
├─ tx.wait() resolves
└─ Receipt returned to backend
```

**Timeline:**

```
T+0ms:    Backend calls contract.issueCertificate()
T+50ms:   Transaction encoded and signed
T+100ms:  Sent to Validator1 RPC
T+150ms:  Transaction in mempool
T+1000ms: Block #500 proposed (1-second block time)
T+1500ms: Consensus reached, block finalized
T+1600ms: tx.wait() resolves with receipt
T+1650ms: Backend returns response to API caller
```

**Total: ~1.65 seconds**

---

## Event Querying

### How Events Work

**Events in smart contract:**

```solidity
event CertificateIssued(
    bytes32 indexed cert_hash,
    address indexed issuer,
    uint256 block_number
);

emit CertificateIssued(cert_hash, msg.sender, block.number);
```

**What happens when emitted:**

1. Event data is added to transaction receipt
2. Stored in blockchain (separate from contract storage)
3. Indexed parameters become searchable "topics"
4. Cheap to emit (375 gas per topic + 8 gas per byte)

**Storage locations:**

```
Contract Storage (expensive):
└─ certificates mapping
    └─ Full certificate data

Transaction Logs (cheap):
└─ Event logs
    └─ Only cert_hash, issuer, block_number
```

### Querying Events

**Create filter:**

```typescript
const filter = contract.filters.CertificateIssued(cert_hash);
```

**Query blockchain:**

```typescript
const events = await contract.queryFilter(filter);
```

**What queryFilter does:**

```
1. Convert filter to RPC parameters:
   {
     address: contract_address,
     topics: [event_signature_hash, cert_hash],
     fromBlock: 0,
     toBlock: 'latest'
   }

2. Send eth_getLogs RPC request

3. Blockchain searches all blocks for matching events

4. Return array of EventLog objects

5. Decode event data using ABI
```

**Event object structure:**

```javascript
{
  blockNumber: 500,
  blockHash: "0xabc123...",
  transactionIndex: 0,
  removed: false,
  address: "0x42699A7612A82f1d9C36148af9C77354759b210b",
  data: "0x00000000000000000000000000000000000000000000000000000000000001f4",
  topics: [
    "0x8e9f5d3a...",  // Event signature
    "0x4a3f9e2d...",  // cert_hash (indexed)
    "0x000000000000000000000000fe3b557e8fb62b89f4916b721be55ceb828dbd73"  // issuer (indexed)
  ],
  transactionHash: "0xdef456...",
  logIndex: 0,

  // Decoded args (added by ethers.js):
  args: {
    cert_hash: "0x4a3f9e2d...",
    issuer: "0xFE3B557E...",
    block_number: 500n
  }
}
```

### Event Filters Advanced

**Filter by specific cert_hash:**

```typescript
const filter1 = contract.filters.CertificateIssued(cert_hash);
// Only events for this certificate
```

**Filter by issuer:**

```typescript
const filter2 = contract.filters.CertificateIssued(null, issuer_address);
// All certificates issued by this address
```

**No filter (all events):**

```typescript
const filter3 = contract.filters.CertificateIssued();
// All CertificateIssued events
```

**Block range:**

```typescript
const events = await contract.queryFilter(filter, fromBlock, toBlock);
// Events between specific blocks
```

---

## Error Handling

### Common Errors and Solutions

**Error 1: RPC connection failed**

```typescript
Error: could not detect network (event="noNetwork", code=NETWORK_ERROR)
```

**Cause:**

- Quorum node not running
- Wrong RPC URL
- Network unreachable

**Solution:**

```typescript
try {
  const blockNumber = await provider.getBlockNumber();
} catch (error) {
  if (error.code === "NETWORK_ERROR") {
    throw new Error("Cannot connect to blockchain. Is Quorum running?");
  }
  throw error;
}
```

**Error 2: Transaction reverted**

```typescript
Error: execution reverted: "Not authorized"
```

**Cause:**

- Smart contract `require` failed
- Function modifier blocked execution
- Invalid parameters

**Your contract checks:**

```solidity
require(!certificate_exists[cert_hash], "Certificate already exists");
require(cgpa <= 400, "Invalid CGPA");
```

**Note:** Authorization is handled in the backend (JWT + RolesGuard), not on blockchain!

**Solution:**

```typescript
try {
  const tx = await contract.issueCertificate(...);
  await tx.wait();
} catch (error) {
  if (error.message.includes('Certificate already exists')) {
    throw new BadRequestException('This certificate hash already exists on blockchain');
  }
  if (error.message.includes('Invalid CGPA')) {
    throw new BadRequestException('CGPA must be between 0.00 and 4.00');
  }
  throw error;
}
```

**Error 3: Certificate does not exist**

```typescript
Error: execution reverted: "Certificate does not exist"
```

**Cause:**

- Calling verifyCertificate with non-existent hash
- Wrong hash provided

**Solution:**

```typescript
try {
  const cert = await contract.verifyCertificate(cert_hash);
  return cert;
} catch (error) {
  if (error.message.includes("does not exist")) {
    return { exists: false, error: "Certificate not found on blockchain" };
  }
  throw error;
}
```

**Error 4: Nonce too low**

```typescript
Error: nonce has already been used
```

**Cause:**

- Transaction with same nonce already mined
- Multiple transactions sent simultaneously

**Solution:**

- Ethers.js handles this automatically
- Uses `getNonce('pending')` to include pending transactions
- If issue persists, clear pending transactions

**Error 5: Gas estimation failed**

```typescript
Error: cannot estimate gas; transaction may fail or may require manual gas limit
```

**Cause:**

- Transaction would revert (eth_call simulation failed)
- Often means `require` will fail

**Solution:**

```typescript
try {
  const gasEstimate = await contract.issueCertificate.estimateGas(...);
  console.log('Estimated gas:', gasEstimate);
} catch (error) {
  console.error('Transaction would revert:', error.message);
  // Don't send transaction, will fail
}
```

---

## Gas Management

### Gas in Your Quorum Network

**Your configuration:**

```json
gasPrice: 0
gasLimit: 4700000
```

**What this means:**

- **gasPrice = 0:** No transaction fees (free)
- **gasLimit:** Maximum computational work allowed

**Gas used by your functions:**

```
issueCertificate:      ~178,000 gas
verifyCertificate:     0 gas (view function)
revokeCertificate:     ~13,000 gas
reactivateCertificate: ~13,000 gas
getAuditLogs:          0 gas (queries events off-chain)
```

### Automatic Gas Estimation

**Ethers.js automatically estimates gas:**

```typescript
// You write:
const tx = await contract.issueCertificate(...);

// Ethers.js does:
const gasEstimate = await contract.issueCertificate.estimateGas(...);
const tx = await contract.issueCertificate(..., {
  gasLimit: gasEstimate * 120n / 100n  // Add 20% buffer
});
```

**Why 20% buffer?**

- Blockchain state might change between estimation and execution
- Prevents "out of gas" errors
- Extra gas is not charged (gasPrice = 0 anyway)

### Manual Gas Limit

**If needed:**

```typescript
const tx = await contract.issueCertificate(..., {
  gasLimit: 500000  // Manual limit
});
```

**When to use:**

- Gas estimation fails
- Want to ensure transaction has enough gas
- Testing gas optimization

---

## Summary

**Ethers.js components in your system:**

**1. Provider:**

- Connects to http://localhost:8545 (Validator1)
- Reads blockchain data
- Free operations

**2. Wallet:**

- Admin wallet: 0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73 (signs all transactions)
- User wallets: Generated during registration (imported to Rabby wallet)
- Admin signs, but issuer_address parameter records actual user (meta-transaction pattern)

**3. Contract:**

- CertificateRegistry: 0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD
- UserRegistry: 0xECB550dE5c73e6690AB4521C03EC9D476617167E
- Translates JavaScript calls to blockchain transactions
- Handles encoding/decoding

**Your service flow:**

```
API Request (with JWT)
    ↓
Backend checks authorization (JWT auth + RolesGuard)
    ↓
Extract walletAddress from JWT (actual issuer)
    ↓
Check student_to_latest_version() → Determine next version
    ↓
computeHash() → Creates unique identifier (includes version)
    ↓
adminWallet.signMessage() → Sign with admin's wallet
    ↓
certificateContract.issueCertificate(..., issuer_address) → Send transaction
    ↓ (Admin wallet pays gas, issuer_address records actual user)
tx.wait() → Waits for confirmation
    ↓
Return receipt → API response
```

**Key concepts:**

- View functions (free, instant)
- Transactions (1-2 seconds, costs gas)
- Events (queryable logs)
- Error handling (reverts, network errors)
- Gas management (automatic estimation)

**For your thesis defense:**

When explaining to supervisor:

1. Show blockchain.service.ts structure
2. Explain provider-wallet-contract relationship
3. Walk through issueCertificate flow step-by-step
4. Demonstrate event querying for audit logs
5. Discuss error handling and gas costs
6. Compare to direct RPC calls (show how ethers.js simplifies)

**You now understand how your backend communicates with the blockchain!**

---

## Next Documents

Continue with:

1. **TRANSACTION_LIFECYCLE.md:** Complete end-to-end flow from API call to blockchain confirmation
2. **DESIGN_DECISIONS.md:** Why we made specific architectural choices

These will complete your comprehensive understanding of the entire system!
