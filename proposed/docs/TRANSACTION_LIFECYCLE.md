# Transaction Lifecycle: From API Call to Blockchain Confirmation

## Introduction

This document traces the **complete journey** of a certificate issuance transaction from the moment a user clicks "Issue Certificate" in the frontend to the moment it's permanently recorded on the blockchain. You'll understand every single step, every component involved, and the exact timing of each phase.

---

## Table of Contents

1. [Overview: The Complete Journey](#1-overview-the-complete-journey)
2. [Phase 1: HTTP Request (Frontend → Backend)](#2-phase-1-http-request-frontend--backend)
3. [Phase 2: Backend Processing (NestJS)](#3-phase-2-backend-processing-nestjs)
4. [Phase 3: Transaction Creation (Ethers.js)](#4-phase-3-transaction-creation-ethersjs)
5. [Phase 4: RPC Communication (Backend → Quorum Node)](#5-phase-4-rpc-communication-backend--quorum-node)
6. [Phase 5: Mempool (Transaction Pool)](#6-phase-5-mempool-transaction-pool)
7. [Phase 6: Block Proposal (IBFT Round)](#7-phase-6-block-proposal-ibft-round)
8. [Phase 7: Consensus (IBFT Voting)](#8-phase-7-consensus-ibft-voting)
9. [Phase 8: Block Finalization](#9-phase-8-block-finalization)
10. [Phase 9: Receipt Generation](#10-phase-9-receipt-generation)
11. [Phase 10: Response to Backend](#11-phase-10-response-to-backend)
12. [Phase 11: Database Storage](#12-phase-11-database-storage)
13. [Phase 12: HTTP Response (Backend → Frontend)](#13-phase-12-http-response-backend--frontend)
14. [Timeline Summary](#14-timeline-summary)
15. [Error Scenarios](#15-error-scenarios)

---

## 1. Overview: The Complete Journey

### Participants

**1. Frontend** (React/Angular/etc.)

- User interface
- Sends HTTP POST request

**2. Backend** (NestJS on port 3001)

- Receives HTTP request
- Validates data
- Communicates with blockchain
- Stores in PostgreSQL

**3. Quorum Node 1** (port 8545)

- Receives RPC calls from backend
- Entry point to blockchain network

**4. Validator Nodes** (4 nodes total)

- Node 1: ports 8545, 30303
- Node 2: ports 8546, 30304
- Node 3: ports 8547, 30305
- Node 4: ports 8548, 30306

**5. Smart Contract** (deployed at 0x4261D524bc701dA4AC49339e5F8b299977045eA5)

- Solidity code executing on EVM
- Stores certificate data

**6. PostgreSQL Database**

- Backup storage
- Query optimization

### The Flow (Simplified)

```
User clicks "Issue"
    ↓
Frontend sends HTTP POST
    ↓
Backend receives request
    ↓
Backend validates data
    ↓
Backend creates transaction with ethers.js
    ↓
Backend signs transaction with private key
    ↓
Backend sends transaction via RPC to Node 1
    ↓
Node 1 adds transaction to mempool
    ↓
Node 1 broadcasts to other validators
    ↓
Proposer (e.g., Node 2) creates block
    ↓
All validators vote (IBFT consensus)
    ↓
Block finalized and added to chain
    ↓
Node 1 returns receipt to backend
    ↓
Backend saves to PostgreSQL
    ↓
Backend returns HTTP response to frontend
    ↓
Frontend displays success message
```

**Total time**: ~1-2 seconds

---

## 2. Phase 1: HTTP Request (Frontend → Backend)

### What Happens

User fills form in browser:

- Student ID: "20101001"
- Student Name: "Alice Johnson"
- CGPA: 3.85
- Degree: "BSc Computer Science"
- Issue Date: 2024-11-25

User clicks **"Issue Certificate"** button.

**Note:** No certificate number needed - system auto-generates version numbers (1, 2, 3...) for each student.

### Frontend Code

```typescript
const response = await fetch("http://localhost:3001/certificates", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer <JWT_TOKEN>",
  },
  body: JSON.stringify({
    studentId: "20101001",
    studentName: "Alice Johnson",
    cgpa: 3.85,
    degree: "BSc Computer Science",
    issueDate: "2024-11-25",
  }),
});
```

### Network Details

**Protocol**: HTTP/1.1
**Method**: POST
**Endpoint**: `http://localhost:3001/certificates`
**Headers**:

```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Length: 123
```

**Body**:

```json
{
  "studentId": "20101001",
  "studentName": "Alice Johnson",
  "cgpa": 3.85,
  "degree": "BSc Computer Science",
  "issueDate": "2024-11-25"
}
```

### Timing

**Duration**: ~5-10 ms (local network)

If backend on cloud server:

- Local network: 5-10 ms
- Same datacenter: 10-30 ms
- Cross-region: 50-200 ms

---

## 3. Phase 2: Backend Processing (NestJS)

### Step 2.1: Request Reaches Controller

Request arrives at `CertificatesController`:

```typescript
@Controller("certificates")
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "issuer")
  async issueCertificate(@Body() dto: CreateCertificateDto, @Request() req) {
    return this.certificatesService.issueCertificate(dto, req.user);
  }
}
```

**NestJS processes**:

1. Route matching: POST `/certificates` → `issueCertificate()` method
2. Guard execution: `JwtAuthGuard` validates JWT token
3. Role check: `RolesGuard` verifies user has 'admin' or 'issuer' role
4. DTO validation: `CreateCertificateDto` validates request body
5. User info extracted: `req.user` contains username and wallet address

### Step 2.2: DTO Validation

```typescript
export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  studentName: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  cgpa: number;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsString()
  @IsNotEmpty()
  issueDate: string;
}
```

NestJS automatically validates:

- ✅ `studentId` is non-empty string
- ✅ `studentName` is non-empty string, max 100 chars
- ✅ `cgpa` is number between 0-4
- ✅ `degree` is non-empty string
- ✅ `issueDate` is non-empty string

If validation fails, returns `400 Bad Request` immediately. If passes, continues.

### Step 2.3: Service Layer

Controller calls `CertificatesService`:

```typescript
@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificatesRepository: Repository<Certificate>,
    private blockchainService: BlockchainService
  ) {}

  async issueCertificate(dto: CreateCertificateDto, user: any) {
    // Scale CGPA by 100
    const scaledCgpa = Math.floor(dto.cgpa * 100); // 3.85 → 385

    // Convert date to Unix timestamp
    const timestamp = new Date(dto.issueDate).getTime() / 1000; // 1732579200

    // Call blockchain service with user info
    // Note: No certificate number - version auto-generated on blockchain
    const txReceipt = await this.blockchainService.issueCertificate(
      dto.studentId,
      dto.studentName,
      dto.degree,
      scaledCgpa,
      "BRAC University",
      user.username,
      user.walletAddress
    );

    // Save to database
    const certificate = this.certificatesRepository.create({
      studentName: dto.studentName,
      cgpa: dto.cgpa,
      degree: dto.degree,
      issueDate: dto.issueDate,
      transactionHash: txReceipt.hash,
      blockNumber: txReceipt.blockNumber,
    });

    await this.certificatesRepository.save(certificate);

    return {
      message: "Certificate issued successfully",
      transactionHash: txReceipt.hash,
      certificate,
    };
  }
}
```

**Key operations**:

1. Scale CGPA: `3.85 * 100 = 385`
2. Convert date: `"2024-11-25"` → Unix timestamp `1732579200`
3. Call blockchain service (next phase)

### Timing

**Duration**: ~1-2 ms (excluding blockchain call)

---

## 4. Phase 3: Transaction Creation (Ethers.js)

### Step 3.1: Blockchain Service

```typescript
@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  async onModuleInit() {
    // Connect to Quorum node
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL // http://localhost:8545
    );

    // Load admin wallet from private key
    this.adminWallet = new ethers.Wallet(
      process.env.PRIVATE_KEY, // 0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73
      this.provider
    );

    // Create contract instances
    this.certificateContract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS, // 0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD
      CONTRACT_ABI,
      this.adminWallet // Admin wallet signs all transactions
    );

    this.userRegistryContract = new ethers.Contract(
      process.env.USER_REGISTRY_ADDRESS, // 0xECB550dE5c73e6690AB4521C03EC9D476617167E
      USER_REGISTRY_ABI,
      this.adminWallet
    );
  }

  // Compute hash with version instead of certificate_number
  computeHash(
    student_id: string,
    student_name: string,
    degree_program: string,
    cgpa: number,
    version: number,
    issuance_date: number
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

  async issueCertificate(
    studentId: string,
    studentName: string,
    degree: string,
    cgpa: number,
    issuingAuthority: string,
    username: string,
    walletAddress: string
  ): Promise<ethers.TransactionReceipt> {
    // Check current version for this student
    const latestVersion =
      await this.certificateContract.student_to_latest_version(studentId);
    const version = Number(latestVersion) + 1; // Auto-increment version

    const issuance_date = Math.floor(Date.now() / 1000);

    // Compute hash with version
    const cert_hash = this.computeHash(
      studentId,
      studentName,
      degree,
      cgpa,
      version,
      issuance_date
    );

    // ADMIN wallet signs (meta-transaction pattern)
    const signature = await this.adminWallet.signMessage(
      ethers.getBytes(cert_hash)
    );

    const cgpa_scaled = Math.round(cgpa * 100);

    // Admin wallet signs transaction, but walletAddress is recorded as issuer
    const tx = await this.certificateContract.issueCertificate(
      cert_hash,
      studentId,
      studentName,
      degree,
      cgpa_scaled,
      issuingAuthority,
      signature,
      walletAddress // Actual user's address (from JWT)
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    return receipt;
  }
}
```

### Step 3.2: Ethers.js Encodes Function Call

When you call `contract.issueCertificate(...)`, ethers.js:

**1. Computes Function Selector**

```
Function signature: "issueCertificate(bytes32,string,string,string,uint16,string,bytes,address)"
Keccak256 hash: 0x...
First 4 bytes: Function selector
```

**2. Encodes Parameters (ABI Encoding)**

```
cert_hash: 0x4a3f9e2d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d
  → 32 bytes (bytes32)

studentId: "20101001"
  → Offset, Length, Data (string)

studentName: "Alice Johnson"
  → Offset, Length, Data (string)

degree: "BSc Computer Science"
  → Offset, Length, Data (string)

cgpa: 385
  → 0x0181 (uint16, padded to 32 bytes)

issuingAuthority: "BRAC University"
  → Offset, Length, Data (string)

signature: 0x7c8d9e0f...
  → Offset, Length, Data (bytes, admin's signature)

issuer_address: 0x08Bd40C733f6184ed6DEc6c9F67ab05308b5Ed5E
  → 20 bytes (address, actual user's wallet)
```

**3. Combines Into Call Data**

```
0x7f4a7b2c (function selector)
0x0000000000000000000000000000000000000000000000000000000000000080 (studentName offset)
0x0000000000000000000000000000000000000000000000000000000000000181 (cgpa)
0x00000000000000000000000000000000000000000000000000000000000000C0 (degree offset)
0x000000000000000000000000000000000000000000000000000000006741E7C0 (issueDate)
0x000000000000000000000000000000000000000000000000000000000000000D (studentName length)
0x416C696365204A6F686E736F6E000000000000000000000000000000000000000 (studentName data)
0x0000000000000000000000000000000000000000000000000000000000000014 (degree length)
0x42536320436F6D707574657220536369656E6365000000000000000000000000 (degree data)
```

This is the **transaction data** field.

### Step 3.3: Create Transaction Object

```typescript
const transaction = {
  to: "0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD", // Contract address
  data: "0x...", // Encoded function call
  gasLimit: 500000, // Estimated gas
  gasPrice: 0, // Quorum: free gas
  nonce: 42, // Transaction count from ADMIN wallet (not user's wallet)
  chainId: 1337, // Quorum network ID
  value: 0, // Not sending ETH
};
```

**Key change:** Nonce is from **admin wallet**, not user's wallet. Admin signs all transactions.

### Step 3.4: Sign Transaction (ECDSA)

Ethers.js calls `adminWallet.signTransaction(transaction)`:

**1. Hash Transaction**

```
RLP-encoded transaction → Keccak256 hash → txHash
```

**2. Sign with Admin's Private Key**

```
Admin's Private Key (from .env): 0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73
ECDSA algorithm produces signature components:
  r: 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b
  s: 0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e
  v: 27 (recovery ID)
```

**Meta-transaction pattern:**

- Transaction signed by admin wallet (pays gas)
- But `issuer_address` parameter records actual user
- Enables user accountability without user managing private keys

**3. Attach Signature to Transaction**

```typescript
const signedTransaction = {
  ...transaction,
  r: "0x1a2b3c...",
  s: "0x9f8e7d...",
  v: 27,
};
```

### Step 3.5: Serialize Transaction

Convert to RLP (Recursive Length Prefix) encoding:

```
Raw transaction bytes:
0xf8ab8229a094a50a51c09a5c451c52bb714527e1974b686d8e7780b8447f4a7b2c...
```

This byte string is sent to blockchain node.

### Timing

**Duration**: ~5-10 ms (local computation)

- ABI encoding: 2-3 ms
- ECDSA signing: 2-5 ms
- Serialization: 1-2 ms

---

## 5. Phase 4: RPC Communication (Backend → Quorum Node)

### Step 4.1: Backend Sends RPC Request

Ethers.js sends JSON-RPC request to `http://localhost:8545`:

```json
{
  "jsonrpc": "2.0",
  "method": "eth_sendRawTransaction",
  "params": [
    "0xf8ab8229a094a50a51c09a5c451c52bb714527e1974b686d8e7780b8447f4a7b2c..."
  ],
  "id": 1
}
```

**Protocol**: HTTP POST
**Endpoint**: `http://localhost:8545` (Node 1's RPC port)

### Step 4.2: Node 1 Receives Transaction

Quorum Node 1 (validator-1):

1. Receives HTTP request
2. Parses JSON-RPC
3. Deserializes RLP transaction
4. Verifies signature (ECDSA)
5. Checks nonce (prevents replay attacks)
6. Validates gas limit
7. Adds to mempool

### Step 4.3: Signature Verification

Node extracts public key from signature:

```
Given: txHash, r, s, v
Recover: publicKey (ECDSA recovery algorithm)
Derive: address = keccak256(publicKey)[last 20 bytes]
```

If recovered address matches `from` field → signature valid ✅

If not → reject transaction ❌

### Step 4.4: RPC Response

Node immediately responds:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a"
}
```

**`result`** is the **transaction hash**.

This response means:

- ✅ Transaction accepted into mempool
- ⚠️ NOT yet mined (not on blockchain yet)

Backend receives transaction hash but keeps waiting (because of `await tx.wait()` in code).

### Timing

**Duration**: ~10-20 ms

- HTTP request: 1-2 ms (local)
- Signature verification: 5-10 ms
- Mempool insertion: 2-5 ms
- HTTP response: 1-2 ms

---

## 6. Phase 5: Mempool (Transaction Pool)

### What is Mempool?

**Mempool** = Memory Pool = waiting area for pending transactions.

Each validator maintains its own mempool:

```
Validator 1 Mempool: [tx1, tx2, tx3, ...]
Validator 2 Mempool: [tx1, tx2, tx5, ...]
Validator 3 Mempool: [tx1, tx3, ...]
Validator 4 Mempool: [tx1, tx2, ...]
```

### Step 5.1: Node 1 Broadcasts Transaction

Node 1 sends transaction to peers via **P2P network** (ports 30303-30306):

```
Node 1 → Node 2: "New transaction: 0x3f2a1b..."
Node 1 → Node 3: "New transaction: 0x3f2a1b..."
Node 1 → Node 4: "New transaction: 0x3f2a1b..."
```

**Protocol**: DevP2P (Ethereum P2P protocol)
**Message type**: `NewPooledTransactionHashes`

### Step 5.2: Other Nodes Add to Mempool

Each validator:

1. Receives transaction broadcast
2. Verifies signature (again, redundantly for security)
3. Adds to its own mempool

After ~50-100ms, all 4 validators have the transaction in their mempools.

### Step 5.3: Transaction Ordering

Mempool orders transactions by:

1. **Gas Price** (higher first) - but in Quorum with gasPrice=0, this doesn't matter
2. **Nonce** (sequential per account)
3. **Arrival time** (FIFO)

Since all transactions have gasPrice=0 in your Quorum network, they're processed in **arrival order**.

### Timing

**Duration**: ~50-100 ms

- P2P broadcast to 3 nodes: ~10-20 ms each
- Parallel verification: ~20-50 ms
- Mempool insertion: ~10-20 ms

---

## 7. Phase 6: Block Proposal (IBFT Round)

### Step 6.1: Proposer Selection

IBFT uses **round-robin** proposer selection:

```
Block 100: Validator 1 is proposer
Block 101: Validator 2 is proposer
Block 102: Validator 3 is proposer
Block 103: Validator 4 is proposer
Block 104: Validator 1 is proposer (repeats)
...
```

Assume current block is 150, and **Validator 2** is the proposer for block 151.

### Step 6.2: Proposer Creates Block

Validator 2 (proposer):

**1. Select Transactions from Mempool**

```
Available in mempool: [tx1, tx2, tx3, tx4, tx5]
Block gas limit: 8,000,000
```

Proposer picks transactions until gas limit reached:

```
tx1: 50,000 gas
tx2: 200,000 gas (your issueCertificate with more fields)
tx3: 60,000 gas
tx4: 120,000 gas
...
Total: 430,000 gas (well under limit)

Selected: [tx1, tx2, tx3, tx4]
```

Your transaction is **tx2** in this block.

**2. Execute Transactions (EVM)**

Proposer runs each transaction through EVM:

For `tx2` (issueCertificate):

```solidity
function issueCertificate(
    bytes32 cert_hash,                    // 0x4a3f9e2d...
    string memory studentId,              // "20101001"
    string memory studentName,            // "Alice Johnson"
    string memory degree,                 // "BSc Computer Science"
    uint16 cgpa,                          // 385
    string memory issuingAuthority,       // "BRAC University"
    bytes memory signature,               // 0x7c8d9e0f... (admin's signature)
    address issuer_address                // 0x08Bd40C733... (actual user's wallet)
) external {
    // Check issuer is authorized (queries UserRegistry contract)
    require(userRegistry.isAuthorized(issuer_address), "Provided issuer is not authorized");
    // Checks passes ✅

    // Check caller is admin or the issuer
    require(msg.sender == admin || msg.sender == issuer_address, "Only admin or the issuer can issue certificates");
    // msg.sender == admin ✅ (admin wallet signed transaction)

    // Check not duplicate
    require(!certificate_exists[cert_hash], "Certificate already exists");
    // Check passes ✅

    // Check CGPA valid
    require(cgpa <= 400, "Invalid CGPA");
    // 385 <= 400 ✅

    // Get latest version for this student
    uint256 latest_version = student_to_latest_version[studentId];

    // Check if student has active certificate
    if (latest_version > 0) {
        bytes32 active_hash = student_to_active_cert_hash[studentId];
        require(active_hash == bytes32(0),
                "Student has an active certificate. Revoke it before creating a new version.");
    }

    uint256 new_version = latest_version + 1; // Version 1 for first cert

    // Store certificate
    certificates[cert_hash] = Certificate({
        cert_hash: cert_hash,
        student_id: "20101001",
        version: 1,  // Auto-incremented
        student_name: "Alice Johnson",
        degree_program: "BSc Computer Science",
        cgpa: 385,
        issuing_authority: "BRAC University",
        issuer: issuer_address,  // Actual user's wallet (not admin!)
        is_revoked: false,
        signature: signature,  // Admin's signature
        issuance_date: block.timestamp
    });

    certificate_exists[cert_hash] = true;
    student_to_latest_version[studentId] = new_version;
    student_version_to_hash[studentId][new_version] = cert_hash;
    student_to_active_cert_hash[studentId] = cert_hash;

    // Emit event with version info
    emit CertificateIssued(cert_hash, studentId, new_version, issuer_address, block.number);
}
```

**Storage changes**:

```
Storage slot: certificates[cert_hash]
Before: empty
After:  Certificate with 11 fields (cert_hash, student_id, version, student_name, etc.)

Storage slot: certificate_exists[cert_hash]
Before: false
After:  true

Storage slot: student_to_latest_version[studentId]
Before: 0
After:  1

Storage slot: student_version_to_hash[studentId][1]
Before: bytes32(0)
After:  cert_hash

Storage slot: student_to_active_cert_hash[studentId]
Before: bytes32(0)
After:  cert_hash
```

**Gas used**: ~225,000 gas (more mappings for versioning)

**Event emitted**:

```
Event: CertificateIssued
  cert_hash: 0x4a3f9e2d... (indexed)
  student_id: "20101001" (indexed)
  version: 1
  issuer: 0x08Bd40C733... (indexed, actual user's wallet)
  block_number: 151
```

**3. Compute State Root**

After executing all transactions:

```
State before block:  Root = 0xdef456...
State after block:   Root = 0x789abc... (new root)
```

State root is Merkle root of entire world state (all account balances, contract storage, etc.).

**4. Create Block Header**

```javascript
{
    parentHash: "0x...", // Previous block hash
    stateRoot: "0x789abc...", // New state root
    transactionsRoot: "0x...", // Merkle root of transactions
    receiptsRoot: "0x...", // Merkle root of receipts
    number: 151,
    timestamp: 1732579201,
    gasUsed: 305000,
    gasLimit: 8000000,
    extraData: "0x..." // IBFT consensus data
}
```

**5. Sign Block (Proposer Signature)**

Proposer signs block with its private key (ECDSA).

### Step 6.3: Broadcast Proposal

Validator 2 broadcasts **PRE-PREPARE** message to all validators:

```
Message: PRE-PREPARE
From: Validator 2
Block: <full block data>
Signature: <proposer's signature>

→ Sent to Validators 1, 3, 4
```

### Timing

**Duration**: ~100-200 ms

- Transaction selection: 10-20 ms
- EVM execution (4 txs): 50-100 ms
- State root computation: 20-50 ms
- Block creation: 10-20 ms
- Broadcast: 10-20 ms

---

## 8. Phase 7: Consensus (IBFT Voting)

IBFT has 3 phases: **PRE-PREPARE**, **PREPARE**, **COMMIT**.

### Step 7.1: PRE-PREPARE Phase

**Validator 2** (proposer) sends PRE-PREPARE (already happened above).

**Validators 1, 3, 4** receive PRE-PREPARE and:

1. Verify proposer signature
2. Verify block format valid
3. Verify parentHash links to previous block
4. **Re-execute all transactions** in block (redundantly)
5. Verify state root matches

If everything valid → proceed to PREPARE phase.

### Step 7.2: PREPARE Phase

Each validator (1, 3, 4) broadcasts **PREPARE** message:

**Validator 1** broadcasts:

```
Message: PREPARE
From: Validator 1
Block hash: 0x789abc...
Signature: <Validator 1's signature>

→ Sent to Validators 2, 3, 4
```

**Validator 3** broadcasts:

```
Message: PREPARE
From: Validator 3
Block hash: 0x789abc...
Signature: <Validator 3's signature>

→ Sent to Validators 1, 2, 4
```

**Validator 4** broadcasts:

```
Message: PREPARE
From: Validator 4
Block hash: 0x789abc...
Signature: <Validator 4's signature>

→ Sent to Validators 1, 2, 3
```

**Proposer (Validator 2)** also sends PREPARE:

```
Message: PREPARE
From: Validator 2
Block hash: 0x789abc...
Signature: <Validator 2's signature>

→ Sent to Validators 1, 3, 4
```

### Step 7.3: PREPARE Quorum

Each validator collects PREPARE messages.

**Quorum requirement**: `2f + 1 = 2(1) + 1 = 3` PREPARE messages.

**Validator 1** receives:

- PREPARE from Validator 2 ✅
- PREPARE from Validator 3 ✅
- PREPARE from Validator 4 ✅
- **Total: 3** (plus its own = 4)

**Quorum reached** ✅ → Proceed to COMMIT phase.

### Step 7.4: COMMIT Phase

Each validator broadcasts **COMMIT** message:

**Validator 1**:

```
Message: COMMIT
From: Validator 1
Block hash: 0x789abc...
Signature: <Validator 1's signature>
```

**Validator 2, 3, 4** do the same.

### Step 7.5: COMMIT Quorum

Each validator collects COMMIT messages.

**Quorum requirement**: `2f + 1 = 3` COMMIT messages.

**Validator 1** receives:

- COMMIT from Validator 2 ✅
- COMMIT from Validator 3 ✅
- COMMIT from Validator 4 ✅
- **Total: 3** (plus its own = 4)

**Quorum reached** ✅ → **Block is FINAL**.

### Step 7.6: Block Finalization

All validators:

1. Add block to their local blockchain copy
2. Update chain head: Block 150 → Block 151
3. Remove transactions from mempool (tx1, tx2, tx3, tx4)
4. Persist block to disk

**Blockchain now contains**:

```
... → Block 149 → Block 150 → Block 151 (contains your certificate)
```

**Certificate is now immutable** ✅

### Timing

**Duration**: ~300-500 ms (configured 1-second block time includes buffer)

- PRE-PREPARE verification: 50-100 ms per validator
- PREPARE broadcast + collection: 100-150 ms
- COMMIT broadcast + collection: 100-150 ms
- Block insertion: 50-100 ms

Total time from mempool to finalized: ~500-800 ms.

---

## 9. Phase 8: Block Finalization

### Step 8.1: Persistent Storage

Each validator writes block to disk:

**LevelDB** (Quorum's database):

```
Key: block_151
Value: <RLP-encoded block data>

Key: tx_0x3f2a1b9c8d7e6f5a...
Value: <RLP-encoded transaction>

Key: receipt_0x3f2a1b9c8d7e6f5a...
Value: <RLP-encoded receipt>

Key: state_0x789abc...
Value: <Merkle Patricia Trie nodes>
```

### Step 8.2: Update Chain State

**Canonical chain pointer**:

```
Before: HEAD → Block 150
After:  HEAD → Block 151
```

**Account state updated**:

```
Contract 0xa50a51c09a5c451C52BB714527E1974b686D8e77:
  Storage:
    certificates[0xabc123...] = Certificate(...) ✅
```

**Wallet nonce incremented**:

```
Your wallet: 0x...
  nonce: 42 → 43
```

Next transaction from this wallet must use nonce 43.

### Timing

**Duration**: ~50-100 ms per validator

- LevelDB write: 20-50 ms
- State trie update: 20-50 ms
- Index update: 10-20 ms

---

## 10. Phase 9: Receipt Generation

### Step 9.1: Transaction Receipt

Node creates receipt for each transaction:

```javascript
{
    transactionHash: "0x3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a",
    transactionIndex: 1, // Second transaction in block
    blockHash: "0x789abc...",
    blockNumber: 151,
    from: "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73", // ADMIN wallet address (signer)
    to: "0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD", // Contract address
    gasUsed: 225000,
    cumulativeGasUsed: 275000, // Gas used by tx1 + tx2
    contractAddress: null, // Not a contract deployment
    logs: [
        {
            address: "0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD",
            topics: [
                "0x...", // Event signature: CertificateIssued(bytes32,string,uint256,address,uint256)
                "0x4a3f9e2d...", // cert_hash (indexed)
                "0x...", // student_id (indexed)
                "0x000000000000000000000000008Bd40C733..." // issuer address (indexed, ACTUAL USER)
            ],
            data: "0x...", // Encoded: version, block_number
            blockNumber: 151,
            transactionHash: "0x3f2a1b9c...",
            logIndex: 0
        }
    ],
    status: 1, // 1 = success, 0 = reverted
    effectiveGasPrice: 0
}
```

**Key observation:** `from` is admin wallet (transaction signer), but event logs record actual user's address as `issuer`.

```

**Key fields**:

- `status: 1` → Transaction succeeded ✅
- `logs: [...]` → Events emitted
- `gasUsed: 75000` → Actual gas consumed

### Step 9.2: Receipt Root

All receipts in block are hashed into **Merkle tree**:

```

receiptsRoot = MerkleRoot([receipt_tx1, receipt_tx2, receipt_tx3, receipt_tx4])

````

This root is stored in block header, enabling **receipt proofs** (prove transaction was in block without downloading entire block).

### Timing

**Duration**: ~10-20 ms

- Receipt generation: 5-10 ms
- Merkle tree computation: 5-10 ms

---

## 11. Phase 10: Response to Backend

### Step 10.1: Backend Waiting

Remember, backend is still waiting at:

```typescript
const tx = await this.contract.issueCertificate(...);
const receipt = await tx.wait(); // ← Waiting here
````

`tx.wait()` internally polls Node 1 (RPC):

```
Every 100ms:
  → eth_getTransactionReceipt("0x3f2a1b9c...")
  ← null (if not mined yet)

After block 151 mined:
  → eth_getTransactionReceipt("0x3f2a1b9c...")
  ← <receipt object> ✅
```

### Step 10.2: Receipt Returned

Node 1 sends receipt via JSON-RPC:

```json
{
    "jsonrpc": "2.0",
    "id": 2,
    "result": {
        "transactionHash": "0x3f2a1b9c...",
        "blockNumber": "0x97",
        "gasUsed": "0x124f8",
        "status": "0x1",
        "logs": [...]
    }
}
```

Ethers.js parses this and returns `TransactionReceipt` object to your code.

### Step 10.3: Backend Continues

```typescript
const receipt = await tx.wait(); // ← Now returns

// receipt is now available:
console.log(receipt.hash); // "0x3f2a1b9c..."
console.log(receipt.blockNumber); // 151
console.log(receipt.status); // 1 (success)
```

Backend proceeds to database storage (next phase).

### Timing

**Duration**: ~100-500 ms (polling interval + network latency)

- Backend polls every 100ms
- Once block mined, next poll gets receipt
- Average wait: 1-2 polling cycles = 100-200 ms

---

## 12. Phase 11: Database Storage

### Step 11.1: Save to PostgreSQL

Backend saves to database:

```typescript
const certificate = this.certificatesRepository.create({
  studentId: "20101001",
  version: 1, // From blockchain
  studentName: "Alice Johnson",
  cgpa: 3.85,
  degree: "BSc Computer Science",
  issueDate: "2024-11-25",
  transactionHash: "0x3f2a1b9c...",
  blockNumber: 151,
  issuedBy: "alice_doe",
});

await this.certificatesRepository.save(certificate);
```

**SQL executed** (by TypeORM):

```sql
INSERT INTO certificates (
    student_id,
    version,
    student_name,
    cgpa,
    degree,
    issue_date,
    transaction_hash,
    block_number,
    issued_by,
    created_at,
    updated_at
) VALUES (
    '20101001',
    1,
    'Alice Johnson',
    3.85,
    'BSc Computer Science',
    '2024-11-25',
    '0x3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a',
    151,
    'alice_doe',
    NOW(),
    NOW()
);
```

### Step 11.2: Why Database AND Blockchain?

**Blockchain**: Source of truth (immutable, decentralized)
**Database**: Query optimization (fast lookups, joins, filters)

Example queries:

```sql
-- Find all certificates for a student (fast with database index)
SELECT * FROM certificates WHERE student_name = 'Alice Johnson';

-- Find all certificates issued in 2024 (blockchain requires scanning all blocks)
SELECT * FROM certificates WHERE issue_date BETWEEN '2024-01-01' AND '2024-12-31';

-- Average CGPA (database aggregation is instant)
SELECT AVG(cgpa) FROM certificates;
```

**Verification flow**:

1. User queries database (fast)
2. Gets transaction hash
3. Verifies on blockchain using transaction hash
4. Compares data (ensures database not tampered)

If database compromised, blockchain reveals truth.

### Timing

**Duration**: ~20-50 ms

- SQL insert: 10-30 ms
- Index update: 5-10 ms
- Database commit: 5-10 ms

---

## 13. Phase 12: HTTP Response (Backend → Frontend)

### Step 12.1: Backend Constructs Response

```typescript
return {
  message: "Certificate issued successfully",
  transactionHash: "0x3f2a1b9c...",
  blockNumber: 151,
  certificate: {
    id: 42,
    studentId: "20101001",
    version: 1,
    studentName: "Alice Johnson",
    cgpa: 3.85,
    degree: "BSc Computer Science",
    issueDate: "2024-11-25",
    issuedBy: "alice_doe",
    createdAt: "2024-11-25T10:30:15.000Z",
  },
};
```

### Step 12.2: HTTP Response Sent

```
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 234

{
    "message": "Certificate issued successfully",
    "transactionHash": "0x3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a",
    "blockNumber": 151,
    "version": 1,
    "certificate": { ... }
}
```

### Step 12.3: Frontend Receives Response

```typescript
const response = await fetch('http://localhost:3001/certificates', { ... });
const data = await response.json();

if (response.ok) {
    alert(`Certificate issued! TX: ${data.transactionHash}`);
    // Display success message
    // Update UI
}
```

User sees:

```
✅ Certificate Issued Successfully!
Version: 1
Transaction Hash: 0x3f2a1b9c...
Block Number: 151
```

### Timing

**Duration**: ~5-10 ms

- JSON serialization: 2-3 ms
- HTTP response: 2-5 ms
- Frontend parsing: 1-2 ms

---

## 14. Timeline Summary

### Phase-by-Phase Breakdown

| Phase                   | Component                    | Duration   | Cumulative |
| ----------------------- | ---------------------------- | ---------- | ---------- |
| 1. HTTP Request         | Frontend → Backend           | 5-10 ms    | 10 ms      |
| 2. NestJS Processing    | Backend validation           | 1-2 ms     | 12 ms      |
| 3. Transaction Creation | Ethers.js encoding + signing | 5-10 ms    | 22 ms      |
| 4. RPC Call             | Backend → Node 1             | 10-20 ms   | 42 ms      |
| 5. Mempool              | Node 1 → All validators      | 50-100 ms  | 142 ms     |
| 6. Block Proposal       | Proposer creates block       | 100-200 ms | 342 ms     |
| 7. IBFT Consensus       | PRE-PREPARE, PREPARE, COMMIT | 300-500 ms | 842 ms     |
| 8. Block Finalization   | Validators write to disk     | 50-100 ms  | 942 ms     |
| 9. Receipt Generation   | Create transaction receipt   | 10-20 ms   | 962 ms     |
| 10. Backend Polling     | Wait for receipt             | 100-200 ms | 1162 ms    |
| 11. Database Storage    | PostgreSQL insert            | 20-50 ms   | 1212 ms    |
| 12. HTTP Response       | Backend → Frontend           | 5-10 ms    | 1222 ms    |

**Total Time**: ~1.2 seconds (1220 ms)

**Key architectural note:** All transactions signed by admin wallet (meta-transactions), but actual user's address recorded on blockchain via `issuer_address` parameter. This enables:

- Users don't need to manage private keys for transactions
- Admin wallet pays all gas fees
- Individual accountability maintained (user's address in event logs)
- UserRegistry contract validates authorization

### Visualization

```
0ms      [User clicks button]
10ms     [Backend receives HTTP]
22ms     [Transaction signed]
42ms     [RPC sent to Node 1]
142ms    [All validators have tx in mempool]
342ms    [Proposer creates block]
842ms    [IBFT consensus complete]
942ms    [Block finalized on all nodes]
962ms    [Receipt generated]
1162ms   [Backend receives receipt]
1212ms   [Database updated]
1222ms   [Frontend displays success] ✅
```

**Blockchain Confirmation**: ~940ms (from RPC to finalized block)
**Total E2E**: ~1220ms (from user click to success message)

---

## 15. Error Scenarios

### Error 1: Invalid Signature

**Where**: Phase 4 (RPC)
**Cause**: Wrong private key or corrupted transaction
**Detection**: Node 1 verifies ECDSA signature, fails
**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "invalid signature"
  }
}
```

**Backend**: Throws error, returns 500 to frontend
**User sees**: "Transaction failed: Invalid signature"

---

### Error 2: Duplicate Certificate

**Where**: Phase 6 (EVM execution)
**Cause**: Certificate with same hash already exists
**Detection**: `require(!certificate_exists[cert_hash])` fails
**Response**: Transaction reverts during EVM execution
**Receipt**:

```javascript
{
    status: 0, // ❌ Failed
    gasUsed: 21000 // Gas consumed before revert
}
```

**Backend**: Receives failed receipt, throws error
**User sees**: "Certificate already exists"

---

### Error 3: Insufficient Gas

**Where**: Phase 6 (EVM execution)
**Cause**: gasLimit too low (e.g., set to 50,000 but needs 75,000)
**Detection**: EVM runs out of gas mid-execution
**Response**: Transaction reverts, all state changes rolled back
**Receipt**:

```javascript
{
    status: 0,
    gasUsed: 50000 // All gas consumed
}
```

**Backend**: Receives failed receipt
**User sees**: "Transaction failed: Out of gas"

---

### Error 4: Network Partition

**Where**: Phase 5-7 (P2P communication)
**Cause**: Validator 3 loses network connection
**Detection**: Other validators timeout waiting for messages
**IBFT Behavior**:

- 3 validators (1, 2, 4) still form quorum (need 3 out of 4)
- Block still finalizes ✅
- Validator 3 syncs when reconnected

If 2+ validators lost → network halts (no quorum)

---

### Error 5: Malicious Proposer

**Where**: Phase 6-7 (Block proposal)
**Cause**: Compromised validator proposes invalid block
**Detection**: Other validators re-execute transactions, state root mismatch
**IBFT Behavior**:

- Validators reject PRE-PREPARE
- Don't send PREPARE messages
- No quorum reached
- Block rejected ❌
- Next validator becomes proposer (timeout + round change)

---

### Error 6: Database Failure

**Where**: Phase 11 (PostgreSQL insert)
**Cause**: Database connection lost or disk full
**Detection**: SQL query throws error
**Backend**: Catches error, but transaction **already on blockchain** ✅
**Response**:

```javascript
{
    message: "Certificate issued on blockchain but database sync failed",
    transactionHash: "0x3f2a1b9c...",
    warning: "Database will be synced automatically"
}
```

Later, a background job can:

1. Query blockchain for all transactions
2. Sync missing records to database

**Key point**: Blockchain is source of truth. Database is backup.

---

### Error 7: RPC Node Offline

**Where**: Phase 4 (RPC call)
**Cause**: Node 1 (port 8545) crashed
**Detection**: HTTP request timeout or connection refused
**Backend**: Ethers.js throws error
**Solution**: Configure multiple RPC endpoints:

```typescript
const provider = new ethers.FallbackProvider([
  new ethers.JsonRpcProvider("http://localhost:8545"), // Node 1
  new ethers.JsonRpcProvider("http://localhost:8546"), // Node 2
  new ethers.JsonRpcProvider("http://localhost:8547"), // Node 3
]);
```

Automatically failover to Node 2 or Node 3 ✅

---

## Conclusion

You now understand the **complete journey** of a blockchain transaction in your certificate system:

1. **User action** → HTTP request (10ms)
2. **Backend validation** → DTO checks (2ms)
3. **Transaction creation** → ABI encoding + ECDSA signing (10ms)
4. **RPC communication** → Backend to Node 1 (20ms)
5. **Mempool propagation** → P2P broadcast to all validators (100ms)
6. **Block proposal** → EVM execution, state changes (200ms)
7. **IBFT consensus** → 3-phase voting (500ms)
8. **Block finalization** → Persistent storage (100ms)
9. **Receipt generation** → Transaction confirmation (20ms)
10. **Backend polling** → Wait for receipt (200ms)
11. **Database storage** → PostgreSQL backup (50ms)
12. **HTTP response** → Success message to user (10ms)

**Total**: ~1.2 seconds from click to confirmation.

Every step involves cryptography (ECDSA, Keccak256), consensus (IBFT), and distributed systems (P2P, replication). The certificate becomes **immutable** after IBFT consensus, replicated across 4 validators, and verifiable by anyone with the transaction hash.

You can now explain to your supervisor:

- What happens at every millisecond
- Which component is responsible for each step
- How consensus ensures security
- How errors are handled
- Why blockchain + database is optimal

Perfect for thesis defense! 🎓
