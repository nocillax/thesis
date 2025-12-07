# Blockchain Flow Guide

## Overview

This project uses **Ethereum blockchain** via a local **Quorum network** to store user registrations and academic certificates **immutably**. Once data is written to the blockchain, it cannot be changed—only new versions can be added.

**Key Concepts:**
- **Smart Contract**: Code that runs on the blockchain (like a program that everyone can verify)
- **Transaction**: An operation that changes blockchain state (costs gas)
- **Event**: Blockchain logs emitted when something happens (for audit trails)
- **Wallet**: Your identity on the blockchain (address + private key)

---

## Architecture

```
Backend API
    ↓
ethers.js (blockchain client)
    ↓
Quorum Network (Ethereum)
    ↓
Smart Contracts (UserRegistry.sol, CertificateRegistry.sol)
```

**Your backend connects to blockchain via:**
- RPC URL: `http://localhost:8545`
- Admin Wallet: Signs all transactions
- Contract Addresses: Where your smart contracts live

---

## 1. User Registration Flow

### How It Works

When someone registers, the backend creates a **new blockchain wallet** for them and records their info in the `UserRegistry` smart contract.

### Step-by-Step

**1. Backend generates a wallet:**
```typescript
const newWallet = ethers.Wallet.createRandom();
// Returns: { address: "0xabc...", privateKey: "0x123..." }
```

**2. Backend calls smart contract:**
```typescript
const tx = await userRegistryContract.registerUser(
  walletAddress,    // 0xabc...
  username,         // "john_doe"
  email,           // "john@example.com"
  is_admin         // false
);
await tx.wait(); // Wait for blockchain to confirm
```

**3. Smart contract stores it:**
```solidity
// UserRegistry.sol
mapping(address => User) public users;

function registerUser(
    address wallet_address,
    string memory username,
    string memory email,
    bool is_admin
) public onlyAdmin {
    // Check if already exists
    require(bytes(users[wallet_address].username).length == 0, "User already registered");
    
    // Store user data
    users[wallet_address] = User({
        username: username,
        email: email,
        registration_date: block.timestamp,
        is_authorized: true,
        is_admin: is_admin
    });
    
    // Emit event for audit trail
    emit UserRegistered(wallet_address, username, email, block.number);
}
```

**Key Points:**
- `onlyAdmin` = Only admin wallet can register users
- `block.timestamp` = Current blockchain time
- `emit UserRegistered` = Creates audit log
- Data is **permanent** once confirmed

**4. User gets their private key:**
```json
{
  "wallet_address": "0xabc...",
  "private_key": "0x123...",
  "username": "john_doe"
}
```

⚠️ **Private key is shown ONCE** - user must save it for login!

---

## 2. Login Flow (Wallet Authentication)

### How It Works

Instead of username/password, users login by **signing a message** with their private key. This proves they own that wallet without exposing the key.

### Step-by-Step

**1. Backend generates a challenge:**
```typescript
const nonce = crypto.randomBytes(32).toString('hex');
const message = `Sign this message to authenticate: ${nonce}`;
```

**2. User signs with Rabby Wallet (frontend):**
```typescript
// User's wallet signs the message
const signature = await wallet.signMessage(message);
```

**3. Backend verifies signature:**
```typescript
const recoveredAddress = ethers.verifyMessage(message, signature);
// Returns: "0xabc..." if valid signature
```

**4. Backend checks blockchain:**
```typescript
const user = await userRegistryContract.getUser(recoveredAddress);

if (user.is_authorized) {
  // Generate JWT token
  return { token: "...", user: {...} };
}
```

**Why This Works:**
- Signing proves you own the private key
- Only the correct private key can create a valid signature
- Backend verifies without ever seeing the private key
- Blockchain confirms user is authorized

---

## 3. Certificate Issuance Flow

### How It Works

When issuing a certificate, the backend:
1. Computes a **unique hash** of the certificate data
2. Admin signs it (proof of authenticity)
3. Stores it on blockchain

### Step-by-Step

**1. Backend computes certificate hash:**
```typescript
computeHash(
  student_id,      // "S12345"
  student_name,    // "John Doe"
  degree_program,  // "BSc - Computer Science"
  cgpa,           // 3.85
  version,        // 1
  issuance_date   // 1733587200
): string {
  const data = student_id + student_name + degree_program + 
               cgpa.toString() + version.toString() + issuance_date.toString();
  return ethers.keccak256(ethers.toUtf8Bytes(data));
  // Returns: "0x5a15dc..."
}
```

**2. Admin wallet signs the hash:**
```typescript
const signature = await adminWallet.signMessage(ethers.getBytes(cert_hash));
// Returns: "0x8c3d..." (cryptographic proof)
```

**3. Backend calls smart contract:**
```typescript
const tx = await certificateContract.issueCertificate(
  cert_hash,           // "0x5a15dc..."
  student_id,          // "S12345"
  student_name,        // "John Doe"
  degree,             // "BSc"
  program,            // "Computer Science"
  cgpa_scaled,        // 385 (3.85 * 100)
  issuing_authority,  // "MIT"
  signature,          // "0x8c3d..."
  walletAddress       // "0xabc..." (who issued it)
);
await tx.wait();
```

**4. Smart contract validates and stores:**
```solidity
// CertificateRegistry.sol
function issueCertificate(
    bytes32 cert_hash,
    string memory student_id,
    // ... other params
) public onlyAuthorized {
    // Check if cert already exists
    require(!certificates[cert_hash].exists, "Certificate already issued");
    
    // Store certificate
    certificates[cert_hash] = Certificate({
        student_id: student_id,
        student_name: student_name,
        degree: degree,
        program: program,
        cgpa: cgpa,
        issuing_authority: issuing_authority,
        issuer: msg.sender,
        is_revoked: false,
        signature: signature,
        issuance_date: block.timestamp,
        version: student_to_latest_version[student_id] + 1,
        exists: true
    });
    
    // Track latest version
    student_to_latest_version[student_id]++;
    student_certificates[student_id].push(cert_hash);
    
    // Emit event
    emit CertificateIssued(cert_hash, student_id, version, msg.sender, block.number);
}
```

**Key Points:**
- `cert_hash` = Unique identifier (like fingerprint)
- `signature` = Proof admin approved it
- `version` = Allows multiple certificates per student
- `block.timestamp` = When it was issued (permanent)

---

## 4. Certificate Verification Flow

### How It Works

Anyone with the certificate hash can verify it's authentic by checking:
1. Does it exist on blockchain?
2. Is it revoked?
3. Does the signature match?

### Step-by-Step

**1. User provides certificate hash:**
```
GET /api/blockchain/certificates/verify/0x5a15dc...
```

**2. Backend queries smart contract:**
```typescript
const result = await certificateContract.verifyCertificate(cert_hash);
```

**3. Smart contract returns data:**
```solidity
function verifyCertificate(bytes32 cert_hash) 
    public view returns (Certificate memory) {
    require(certificates[cert_hash].exists, "Certificate does not exist");
    return certificates[cert_hash];
}
```

**4. Backend verifies signature (optional):**
```typescript
const recoveredAddress = ethers.verifyMessage(
  ethers.getBytes(cert_hash),
  certificate.signature
);
// Should match the issuer's wallet address
```

**5. Response includes:**
```json
{
  "cert_hash": "0x5a15dc...",
  "student_name": "John Doe",
  "degree": "BSc",
  "program": "Computer Science",
  "cgpa": 3.85,
  "is_revoked": false,
  "issuer": "0xdef...",
  "issuer_name": "Dr. Smith",
  "issuance_date": "2024-12-07T12:00:00Z",
  "signature": "0x8c3d..."
}
```

**Why It's Trustworthy:**
- Data comes from blockchain (immutable)
- Signature proves admin issued it
- Anyone can verify independently
- No central authority needed

---

## 5. Certificate Revocation/Reactivation

### How It Works

You **cannot delete** blockchain data. Instead, you mark it as revoked by setting a flag.

### Revoke

**1. Backend calls contract:**
```typescript
const tx = await certificateContract.revokeCertificate(
  cert_hash,
  actor_address  // Who is revoking
);
```

**2. Smart contract updates flag:**
```solidity
function revokeCertificate(bytes32 cert_hash, address actor) 
    public onlyAuthorized {
    require(certificates[cert_hash].exists, "Certificate does not exist");
    require(!certificates[cert_hash].is_revoked, "Already revoked");
    
    certificates[cert_hash].is_revoked = true;
    
    emit CertificateRevoked(cert_hash, actor, block.number);
}
```

**3. Audit log created:**
- Event `CertificateRevoked` is permanent
- Shows who revoked it and when
- Can be queried later

### Reactivate

Same process but sets `is_revoked = false`:
```solidity
function reactivateCertificate(bytes32 cert_hash, address actor) 
    public onlyAuthorized {
    certificates[cert_hash].is_revoked = false;
    emit CertificateReactivated(cert_hash, actor, block.number);
}
```

---

## 6. Certificate Versions

### Why Versions?

A student can have multiple certificates (e.g., Bachelor's, Master's). Each is a separate blockchain entry with incremented version.

### How It Works

**1. Smart contract tracks versions:**
```solidity
mapping(string => uint256) public student_to_latest_version;
mapping(string => bytes32[]) public student_certificates;
```

**2. When issuing new certificate:**
```solidity
uint256 version = student_to_latest_version[student_id] + 1;
student_certificates[student_id].push(cert_hash);
student_to_latest_version[student_id] = version;
```

**3. Getting all versions:**
```typescript
const hashes = await certificateContract.getAllVersions(student_id);
// Returns: ["0x5a15dc...", "0x63516a...", "0x9794d6..."]

// Then fetch each certificate
const certificates = await Promise.all(
  hashes.map(hash => certificateContract.verifyCertificate(hash))
);
```

**4. Getting latest active:**
```solidity
function getActiveCertificate(string memory student_id) 
    public view returns (Certificate memory) {
    bytes32[] memory hashes = student_certificates[student_id];
    
    // Search backwards for latest non-revoked
    for (uint i = hashes.length; i > 0; i--) {
        Certificate memory cert = certificates[hashes[i-1]];
        if (!cert.is_revoked) {
            return cert;
        }
    }
    
    revert("No active certificate");
}
```

---

## 7. Audit Logs (Events)

### How It Works

Every blockchain action emits an **event**. Events are permanent logs you can query later.

### Event Examples

**UserRegistered:**
```solidity
event UserRegistered(
    address indexed wallet_address,
    string username,
    string email,
    uint256 block_number
);
```

**CertificateIssued:**
```solidity
event CertificateIssued(
    bytes32 indexed cert_hash,
    string indexed student_id,
    uint256 indexed version,
    address issuer,
    uint256 block_number
);
```

**CertificateRevoked:**
```solidity
event CertificateRevoked(
    bytes32 indexed cert_hash,
    address indexed revoked_by,
    uint256 block_number
);
```

### Querying Events

**1. Backend filters events:**
```typescript
const issuedFilter = certificateContract.filters.CertificateIssued();
const events = await certificateContract.queryFilter(issuedFilter);
```

**2. Process event data:**
```typescript
for (const event of events) {
  const block = await provider.getBlock(event.blockNumber);
  
  const auditLog = {
    action: 'ISSUED',
    cert_hash: event.args.cert_hash,
    issuer: event.args.issuer,
    block_number: event.blockNumber,
    transaction_hash: event.transactionHash,
    timestamp: new Date(block.timestamp * 1000).toISOString()
  };
}
```

**Why Events Matter:**
- Complete audit trail
- Cannot be altered
- Timestamp from blockchain
- Who did what and when

---

## 8. Gas and Transactions

### What is Gas?

**Gas** = The cost to execute blockchain operations. Every write operation costs gas (paid in ETH).

### Transaction Lifecycle

**1. Create transaction:**
```typescript
const tx = await contract.registerUser(...);
// Returns transaction object (not confirmed yet)
```

**2. Wait for confirmation:**
```typescript
const receipt = await tx.wait();
// Waits for blockchain miners to include it in a block
```

**3. Receipt contains:**
```typescript
{
  hash: "0x1234...",           // Transaction ID
  blockNumber: 42,             // Which block it's in
  gasUsed: 85000,              // How much gas consumed
  status: 1                    // 1 = success, 0 = failed
}
```

**Operations & Cost:**
- Read (view functions): **FREE** (no gas)
- Write (state changes): **Costs gas**
- Example: `registerUser` ≈ 100,000 gas

---

## 9. Access Control

### Modifiers

Smart contracts use **modifiers** to restrict who can call functions:

```solidity
modifier onlyAdmin() {
    require(users[msg.sender].is_admin, "Only admin allowed");
    _;
}

modifier onlyAuthorized() {
    require(users[msg.sender].is_authorized, "Not authorized");
    _;
}
```

**Usage:**
```solidity
function registerUser(...) public onlyAdmin {
    // Only admins can register users
}

function issueCertificate(...) public onlyAuthorized {
    // Only authorized users can issue certificates
}
```

**How It Works:**
- `msg.sender` = Wallet address that called the function
- Contract checks if that address has the required permission
- Reverts if not authorized

---

## 10. Data Flow Summary

### Registration
```
User submits form
    ↓
Backend generates wallet (address + private key)
    ↓
Backend signs transaction with admin wallet
    ↓
Smart contract validates (onlyAdmin)
    ↓
Smart contract stores user in mapping
    ↓
Event emitted (UserRegistered)
    ↓
User gets private key (save it!)
```

### Login
```
User provides private key
    ↓
Backend generates challenge message
    ↓
User's wallet signs message
    ↓
Backend verifies signature
    ↓
Backend checks blockchain (is_authorized?)
    ↓
JWT token issued
```

### Certificate Issuance
```
Admin submits certificate data
    ↓
Backend computes hash (unique ID)
    ↓
Admin wallet signs hash
    ↓
Backend calls smart contract
    ↓
Contract validates and stores
    ↓
Version incremented
    ↓
Event emitted (CertificateIssued)
    ↓
Certificate hash returned
```

### Verification
```
Anyone provides certificate hash
    ↓
Backend queries smart contract (free)
    ↓
Contract returns certificate data
    ↓
Backend verifies signature (optional)
    ↓
Response with all details
```

---

## Key Takeaways

✅ **Immutable**: Once written, data cannot be changed  
✅ **Transparent**: Anyone can verify certificates  
✅ **Decentralized**: No single point of failure  
✅ **Auditable**: Every action is logged permanently  
✅ **Cryptographic**: Signatures prove authenticity  
✅ **Versioned**: Students can have multiple certificates  
✅ **Access Controlled**: Only authorized users can write  

---

## Common Questions

**Q: Can we delete a certificate?**  
A: No. You can only mark it as revoked. The data remains on blockchain forever.

**Q: What if someone loses their private key?**  
A: Admin can register a new wallet for them. Old wallet becomes unusable.

**Q: How is data encrypted?**  
A: It's not. Blockchain data is public. Don't store sensitive info like SSN or grades directly. Store hashes or references.

**Q: Can we edit a certificate?**  
A: No. Issue a new version with updated data. Old versions remain visible.

**Q: What if blockchain goes down?**  
A: It's distributed across multiple nodes. If one fails, others continue. Your local Quorum network needs at least one node running.

**Q: Why use blockchain instead of a database?**  
A: **Trust**. Anyone can verify certificates without trusting your server. Data cannot be tampered with retroactively.

---

## Files to Explore

**Smart Contracts:**
- `contracts/UserRegistry.sol` - User registration logic
- `contracts/CertificateRegistry.sol` - Certificate management logic

**Backend Integration:**
- `services/blockchain-client.service.ts` - Connects to blockchain
- `services/user-blockchain.service.ts` - User operations
- `services/certificate-blockchain.service.ts` - Certificate operations
- `services/audit-blockchain.service.ts` - Event querying

**Deployment:**
- `scripts/deploy-dev.js` - Deploys both contracts
- `scripts/seed-admin.js` - Creates first admin user
