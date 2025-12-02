# Blockchain Fundamentals: Certificate System Guide

**Purpose:** Understand blockchain concepts using your actual implementation as examples.

**Your System:** 100% blockchain-based certificate issuance with Quorum private network, no database.

---

## Table of Contents

1. [What is a Blockchain?](#what-is-a-blockchain)
2. [Key Concepts](#key-concepts)
3. [How Data is Stored](#how-data-is-stored)
4. [Immutability and Security](#immutability-and-security)
5. [Smart Contracts](#smart-contracts)
6. [Consensus Mechanisms](#consensus-mechanisms)
7. [Public vs Permissioned Blockchains](#public-vs-permissioned-blockchains)
8. [Why Blockchain for Certificates?](#why-blockchain-for-certificates)

---

## What is a Blockchain?

A **blockchain** is a distributed, immutable ledger where:

- Data is stored in linked blocks across multiple nodes
- Once written, data **CANNOT be modified or deleted**
- All nodes maintain identical copies
- Cryptographic hashing ensures tampering is detectable
- Only authorized parties can write data

**In Your Certificate System:**

- 4 validator nodes keep identical copies of all certificates
- Certificates issued once and stored permanently
- Anyone can verify a certificate's authenticity
- UserRegistry and CertificateRegistry contracts manage all data
- No database—everything lives on blockchain

---

## Key Concepts

### 1. **Block**

A **block** contains:

- Timestamp
- Previous block's hash (creates the "chain")
- Multiple transactions (e.g., certificate issuance, revocations)
- Current block's hash

**In your system:**

- Each certificate operation creates a transaction
- Transactions are grouped into blocks
- Blocks are added after all 4 validators reach consensus (IBFT)
- Average block time: 1-2 seconds

### 2. **Chain**

Blocks are cryptographically linked: `Block #1 → Block #2 → Block #3 → ...`

Each block stores the previous block's hash. Modifying any past block changes its hash, breaking the link to the next block—making tampering immediately detectable across all 4 nodes.

**In your system:** Certificate transactions are permanently locked in the chain. Altering any certificate would break the chain and be rejected by consensus.

### 3. **Node**

A **node** is a computer running the blockchain software. Think of it as a **validator** or **record keeper**.

**In your system, you have 4 nodes:**

```
Node 1 (validator1) ─┐
                     │
Node 2 (validator2) ─┤──── All share the same blockchain
                     │
Node 3 (validator3) ─┤
                     │
Node 4 (validator4) ─┘
```

**Each node:**

- Stores a complete copy of the blockchain
- Validates new transactions
- Participates in consensus (agreement) on new blocks
- Runs inside a Docker container on your computer

**Why 4 nodes?**

- To demonstrate **decentralization** (no single point of failure)
- For your thesis experiments (you can stop 1-2 nodes and see the network continue)
- IBFT consensus requires at least `2/3 + 1` nodes working (more on this later)

### 4. **Transaction**

A **transaction** is any action recorded on the blockchain.

**Examples in your system:**

- Issuing a certificate: `issueCertificate(hash, student_name, ...)`
- Revoking a certificate: `revokeCertificate(cert_hash)`
- Reactivating a certificate: `reactivateCertificate(cert_hash)`

**Transaction Structure:**

```javascript
{
  from: "0x08Bd40C733bC5fA1eDD5ae391d2FAC32A42910E2",  // User's wallet (e.g., admin)
  to: "0x4261D524bc701dA4AC49339e5F8b299977045eA5",    // Your smart contract
  data: "0x8a4f2c9d...",                                // Encoded function call
  gas: 4700000,                                          // Max computation allowed
  gasPrice: 0,                                           // Cost per computation (0 for Quorum)
  nonce: 15                                              // Transaction number from this wallet
}
```

**Step-by-step what happens:**

1. **Your backend creates a transaction:** "Issue certificate for Student ID ABC123"
2. **Signs it** with your private key (proving you authorized it)
3. **Sends it** to Node 1 via RPC (http://localhost:8545)
4. **Node 1 validates** the transaction (signature correct? gas sufficient?)
5. **Node 1 proposes** this transaction to other nodes
6. **All 4 nodes agree** via IBFT consensus
7. **Transaction is included** in the next block
8. **Block is added** to the chain
9. **Your backend receives confirmation:** Transaction hash, block number

### 5. **Hash**

A **hash** is a unique fingerprint of data. Think of it like a **digital thumbprint**.

**Properties:**

- Same input → Always same output
- Tiny change in input → Completely different output
- One-way (can't reverse it)
- Fixed length (always 64 characters in hex)

**Example with your project:**

```javascript
// Input data
const data = "ABC123John Doe Computer Science 385 CERT-2024-00001 1705334400";

// Hash it
const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
// Output: "0x7f8a3c2b1e9d6f4a8c3b2e1d9f7a6c5b4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8"

// Change ONE character (John → Joan)
const data2 = "ABC123Joan Doe Computer Science 385 CERT-2024-00001 1705334400";
const hash2 = ethers.keccak256(ethers.toUtf8Bytes(data2));
// Output: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
```

**Notice:** Completely different hashes! This is how we detect tampering.

**In your system:**

- You compute a hash from certificate data
- Store that hash on blockchain
- Later, to verify, recompute hash from claimed data
- If hashes match → Data is authentic and unmodified

---

## How Data is Stored

### Traditional Database vs Blockchain

**Traditional Database (your control system):**

```
certificates table
├── id: 1
├── student_name: "John Doe"
├── degree_program: "Computer Science"
├── cgpa: 3.85
└── certificate_number: "CERT-2024-00001"
```

**Problem:** Administrator can run:

```sql
UPDATE certificates SET cgpa = 4.00 WHERE id = 1;
DELETE FROM certificates WHERE id = 1;
```

**Blockchain (your proposed system):**

```
UserRegistry Storage
mapping(wallet_address => User)

0xFE3B557E... → User:
  ├── wallet_address: 0xFE3B557E...
  ├── username: "admin"
  ├── email: "admin@university.edu"
  ├── registration_date: 1700000000
  ├── is_authorized: true
  └── is_admin: true

CertificateRegistry Storage
mapping(cert_hash => Certificate)

cert_hash: 0x7f8a3c2b...
  ├── cert_hash: 0x7f8a3c2b...
  ├── student_id: "22-46734-1"  (PRIMARY KEY)
  ├── version: 1                 (v1, v2, v3...)
  ├── student_name: "John Doe"
  ├── degree_program: "Computer Science"
  ├── cgpa: 385                  (stored as uint16, actually 3.85)
  ├── issuing_authority: "BRAC University"
  ├── issuer: 0x08Bd40C733...    (user's wallet)
  ├── is_revoked: false
  ├── signature: 0xabc123...     (signed by user's wallet)
  └── issuance_date: 1705334400
```

**Key difference:**

- Once stored, **CANNOT be changed**
- No UPDATE or DELETE
- Can only mark `is_revoked = true` (but original data stays)
- Stored across 4 nodes, so all must be hacked to tamper

### Storage in Solidity (Your Smart Contract Language)

**Your smart contract has this storage:**

```solidity
// This is like a dictionary/map
mapping(bytes32 => Certificate) private certificates;
```

**What this means:**

- `bytes32`: The certificate hash (32 bytes = 64 hex characters)
- `Certificate`: Your custom data structure
- `mapping`: Key-value storage (like Python dict or JavaScript object)
- `private`: Only the contract can directly access it (but still visible on blockchain)

**Example:**

```
Key (cert_hash)                                      → Value (Certificate struct)
0x7f8a3c2b1e9d6f4a8c3b2e1d9f7a6c5b4e3d2c1b0a... → {student_name: "John", cgpa: 385, ...}
```

**How to store:**

```solidity
certificates[cert_hash] = Certificate({
    cert_hash: cert_hash,
    student_name: "John Doe",
    // ... other fields
});
```

**How to retrieve:**

```solidity
Certificate memory cert = certificates[cert_hash];
```

---

## Immutability and Security

### What is Immutability?

**Immutability** = Cannot be changed once written.

**Why is blockchain immutable?**

1. **Cryptographic Hashing:** Each block's hash depends on all its contents
2. **Chain Linking:** Each block references the previous block's hash
3. **Consensus:** All nodes must agree on the blockchain state
4. **Distributed Copies:** 4 nodes all have the same copy

**Attack Scenario:**

To change a certificate, an attacker would need to:

1. Modify the block containing the certificate
2. Recalculate hashes for all subsequent blocks (breaks the chain)
3. Compromise 3 out of 4 validator nodes simultaneously (IBFT requirement)
4. Do this faster than new blocks are being added

**Conclusion:** Computationally infeasible with distributed consensus.

---

## Smart Contracts

### What is a Smart Contract?

A **smart contract** is a **program that runs on the blockchain**.

**Key characteristics:**

- Written in code (Solidity for Ethereum/Quorum)
- Deployed to the blockchain (gets an address)
- Executes automatically when called
- Code and data are immutable
- No single person controls it

**Your Smart Contracts:**

1. **UserRegistry** at `0xECB550dE5c73e6690AB4521C03EC9D476617167E`

   - Stores user data (username, email, is_admin, is_authorized)
   - Replaces traditional database
   - Manages authorization and admin privileges

2. **CertificateRegistry** at `0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD`
   - Stores certificates with versioning per student_id
   - References UserRegistry for authorization checks
   - Tracks issuer wallet address and name

**Think of them as:**

```
UserRegistry (User database on blockchain):
├── Registers users with wallet addresses
├── Tracks authorization status (is_authorized)
├── Tracks admin privileges (is_admin)
└── No passwords - Web3 wallet authentication

CertificateRegistry (Certificate storage):
├── Stores certificate records permanently
├── Versions certificates by student_id (v1, v2, v3...)
├── Allows anyone to verify certificates
├── Records individual issuer per certificate
└── Keeps audit log via events
```

**Certificate Versioning System:**

Your system uses `student_id` as the primary key with automatic versioning:

- Each student can have multiple certificate versions: v1, v2, v3...
- **Only ONE active certificate** per student at a time
- To issue a new version, must first revoke the active certificate
- `student_to_latest_version[student_id]` tracks version counter
- `student_to_active_cert_hash[student_id]` points to current active certificate

**Example scenario:**

```
Student "22-46734-1" issued cert v1 (CGPA: 3.50) → Active
↓
Revoke v1 → No active certificate
↓
Issue v2 (CGPA: 3.75) → Active
↓
Revoke v2 → No active certificate
↓
Issue v3 (CGPA: 3.85) → Active (current)
```

**All versions remain on blockchain** (immutable history), but only latest is marked active.

**Example: Issuing a Certificate**

```solidity
function issueCertificate(
    bytes32 cert_hash,
    string memory student_id,           // PRIMARY KEY for versioning
    string memory student_name,
    string memory degree_program,
    uint16 cgpa,                        // Stored as uint16: 385 = 3.85
    string memory issuing_authority,
    bytes memory signature,
    address issuer_address              // Meta-transaction: actual issuer
) external {
    // Check authorization from UserRegistry
    require(userRegistry.isAuthorized(issuer_address), "Not authorized");

    // Check if certificate already exists
    require(!certificate_exists[cert_hash], "Certificate already exists");
    require(cgpa <= 400, "Invalid CGPA");

    // Check versioning: only one active certificate per student
    bytes32 active_hash = student_to_active_cert_hash[student_id];
    require(active_hash == bytes32(0), "Must revoke active certificate first");

    uint256 new_version = student_to_latest_version[student_id] + 1;

    // Store the certificate
    certificates[cert_hash] = Certificate({
        cert_hash: cert_hash,
        student_id: student_id,
        version: new_version,              // Auto-incremented version
        student_name: student_name,
        degree_program: degree_program,
        cgpa: cgpa,
        issuing_authority: issuing_authority,
        issuer: issuer_address,            // ACTUAL issuer (not msg.sender)
        is_revoked: false,
        signature: signature,
        issuance_date: block.timestamp
    });

    certificate_exists[cert_hash] = true;
    student_to_latest_version[student_id] = new_version;
    student_to_active_cert_hash[student_id] = cert_hash;

    // Emit event
    emit CertificateIssued(cert_hash, student_id, new_version, issuer_address, block.number);
}
```

**Breaking it down:**

1. **Function signature:** Defines what data it needs
2. **`external`:** Can be called from outside the contract (by backend)
3. **`require`:** Validation checks (fails if certificate exists or CGPA invalid)
4. **Store in mapping:** `certificates[cert_hash] = ...`
5. **Mark as existing:** `certificate_exists[cert_hash] = true`
6. **Emit event:** Creates a log that can be queried later

**Authorization Model:**

- **Backend:** JWT + Guards check permissions (is_admin for user management)
- **Smart Contract:** Queries UserRegistry for is_authorized flag
- **Hybrid approach:** Flexible backend policies + blockchain-enforced authorization

**CGPA Storage Format:**

CGPA is stored as `uint16` (no decimals in Solidity):

- Multiply by 100: `3.85 → 385`, `4.00 → 400`
- Contract validates: `require(cgpa <= 400, "Invalid CGPA")`
- Frontend divides by 100 when displaying: `385 / 100 = 3.85`

**Meta-Transaction Pattern (Critical Concept):**

Your backend calls this function using a **meta-transaction** approach:

```javascript
// 1. Decrypt user's private key from backend storage
const userWallet = await getUserWallet(username, walletAddress);

// 2. User's wallet signs the certificate hash (proves authorship)
const signature = await userWallet.signMessage(ethers.getBytes(cert_hash));

// 3. Admin wallet submits transaction (pays gas)
const contractWithAdminSigner = contract.connect(adminWallet);
const tx = await contractWithAdminSigner.issueCertificate(
  cert_hash,
  "22-46734-1",
  "John Doe",
  "Computer Science",
  385, // 3.85 * 100
  "BRAC University",
  signature, // User's signature
  userWallet.address // User's wallet recorded as issuer (NOT adminWallet)
);
```

**Why meta-transactions?**

- Users don't need ETH/gas funds
- Admin (0xFE3B557E...) pays all gas costs
- Individual accountability: Each certificate shows actual issuer's wallet
- Backend securely manages encrypted user wallets

### Why Smart Contracts?

**Key advantages over traditional backend logic:**

1. **Immutable business rules:** Contract code cannot be changed after deployment
2. **On-chain authorization:** UserRegistry enforces `is_authorized` check
3. **Transparent execution:** All operations recorded via events
4. **No database dependency:** User data + certificates stored on blockchain
5. **Individual accountability:** Each issuer has unique wallet address tracked on-chain

**Encrypted Wallet Management:**

Your backend securely stores user private keys:

```javascript
// Registration: Admin generates wallet for new user
const newWallet = ethers.Wallet.createRandom();
const encryptedKey = encryptPrivateKey(newWallet.privateKey);

// Store encrypted in backend config (wallets.json)
// Give user their private key to import into Rabby wallet

// Later: Decrypt when needed for meta-transactions
const userWallet = new ethers.Wallet(decryptPrivateKey(encryptedKey), provider);
```

**Security model:** Backend holds encrypted keys (for meta-transactions), user also has copy (for Rabby wallet login). Even if backend database is compromised, encrypted keys require decryption password.

---

## Consensus Mechanisms

### What is Consensus?

**Consensus** = Agreement among multiple parties.

**The problem:**

- You have 4 validator nodes
- They need to agree on what the blockchain looks like
- What if nodes disagree? Which one is correct?

**Consensus mechanism** = The rules for how nodes agree.

### IBFT (Istanbul Byzantine Fault Tolerance)

**Your system uses IBFT consensus.**

**How IBFT works:**

```
Round-based voting system:

Round #1234
├── Node 1 (Proposer): "I propose Block #500 with these transactions: [Tx1, Tx2, Tx3]"
│
├── Node 2 (Validator): "I reviewed it. I vote YES ✓"
├── Node 3 (Validator): "I reviewed it. I vote YES ✓"
├── Node 4 (Validator): "I reviewed it. I vote YES ✓"
│
└── Result: 4/4 votes = 100% agreement
    → Block #500 is accepted and added to chain
```

**Requirements:**

- Need **2/3 + 1** votes to accept a block
- With 4 nodes: Need at least 3 votes (3/4 = 75%)
- This means **1 node can fail** and network continues

**Byzantine Fault Tolerance:**

IBFT tolerates up to `(n-1)/3` faulty/malicious nodes:

- With 4 nodes: Can tolerate 1 faulty node
- Remaining 3 nodes reach consensus despite the faulty one

**In your thesis experiments:**

```
Experiment 1: Stop Node 4
├── Nodes 1, 2, 3 still reach consensus (3/4 = 75% > 66% required)
└── Network continues issuing certificates

Experiment 2: Stop Nodes 3 and 4
├── Only Nodes 1 and 2 running (2/4 = 50% < 66% required)
└── Network HALTS (cannot reach consensus)
```

**Why IBFT for your system?**

- **Fast finality:** Once a block is added, it's final (no forks)
- **Permissioned:** Only your 4 validator nodes participate
- **Low latency:** Consensus in seconds, not minutes
- **Energy efficient:** No mining (unlike Bitcoin)

---

## Public vs Permissioned Blockchains

### Public vs Permissioned Blockchains

**Public (Ethereum, Bitcoin):** Anyone can join, slower consensus, expensive gas fees, fully decentralized.

**Permissioned (Quorum, Hyperledger):** Controlled nodes, faster consensus, no gas costs, enterprise-focused.

### Your System: Quorum (Permissioned)

**Characteristics:**

- Only authorized nodes can validate
- Controlled by organization/consortium
- Faster consensus (1-2 seconds)
- Better privacy
- More centralized control

**Your System: Quorum (Permissioned)**

```
├── Only 4 validator nodes (you control all)
├── Only authorized issuers can issue certificates
├── Uses IBFT consensus
├── Gas price = 0 (no transaction costs)
└── Suitable for enterprise/government use
```

**Why Quorum for your thesis?**

1. **Control:** You manage all nodes, easier to experiment
2. **Speed:** Fast consensus for certificate issuance
3. **Privacy:** Can add private transactions if needed (not used yet)
4. **No costs:** Gas price is 0 (no cryptocurrency needed)
5. **Enterprise-ready:** Used by real organizations (JPMorgan created it)

**Key Differences:**

| Feature    | Public (Ethereum) | Your System (Quorum) |
| ---------- | ----------------- | -------------------- |
| Nodes      | Thousands         | 4 validators         |
| Block time | 12+ seconds       | 1-2 seconds          |
| Gas fees   | High (ETH)        | Zero (gasPrice: 0)   |
| Access     | Anyone            | Authorized only      |

---

## Why Blockchain for Certificates?

### Traditional System Problems

1. **Single point of failure:** Database can be hacked/modified
2. **Insider threats:** Admins can alter records
3. **No immutable audit trail**
4. **Trust dependency:** Must trust the institution

### Blockchain Solution Benefits

1. **Immutability:** Data cannot be changed once written
2. **Decentralization:** 4 nodes must agree (no single point of failure)
3. **Transparency:** Permanent event logs for all operations
4. **Cryptographic verification:** Anyone can verify authenticity instantly
5. **Versioning:** Complete history of all certificate versions per student

**Verification Scenario:**

```
Employer verifies John's degree:

1. Student provides certificate hash
2. Employer queries blockchain (instant)
3. Returns certificate data + issuer wallet + signature
4. Cross-check with UserRegistry to confirm issuer identity
5. 100% certain certificate is authentic
```

### 100% Blockchain Architecture (No Database)

**Your system stores ALL data on blockchain:**

```
UserRegistry Contract (Blockchain):
User: admin
├── wallet_address: "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73"
├── username: "admin"
├── email: "admin@university.edu"
├── is_admin: true
├── is_authorized: true
└── registration_date: 1732579200

CertificateRegistry Contract (Blockchain):
Student "22-46734-1":
├── Latest version: 3
├── Active certificate: v3 (cert_hash: 0x7f8a3c2b...)
├── Historical versions: v1 (revoked), v2 (revoked), v3 (active)
└── Only v3 can be used for verification

Note: Private keys stored encrypted in backend config (for meta-transactions)
```

**Active Certificate Logic:**

```javascript
// Check if student already has an active certificate
const activeCertHash = await contract.getActiveCertificate("22-46734-1");

if (activeCertHash !== ethers.ZeroHash) {
  throw new Error("Student already has an active certificate. Revoke it first.");
}

// Now safe to issue new version
await contract.issueCertificate(...);
```

This prevents accidentally issuing duplicate certificates and enforces versioning discipline.

**How it works:**

1. **User Registration (Admin-only):**

   - Backend generates random wallet using ethers.js
   - Calls `UserRegistry.registerUser(wallet, username, email, is_admin)`
   - Returns private key to admin (user imports to Rabby wallet)
   - User data permanently stored on blockchain

2. **Authentication (Web3):**

   - User signs message with their wallet (no password!)
   - Backend verifies signature matches wallet address
   - Backend queries UserRegistry for user details
   - Issues JWT with wallet address + username + isAdmin

3. **Certificate Issuance (Meta-transaction):**

   - Backend decrypts user's private key
   - User's wallet signs certificate hash
   - Admin wallet calls contract and pays gas
   - Contract records user's wallet as issuer

4. **Accountability:**
   - Each certificate shows issuer's wallet address
   - Cross-check with UserRegistry to verify identity
   - Blockchain prevents tampering with user records

**Why this matters:**

- **No database = No single point of failure**
- **Immutable user records:** Cannot change username/email after registration
- **Web3 authentication:** No passwords to steal
- **Individual accountability:** Every certificate traceable to specific wallet
- **Cross-verification:** UserRegistry + CertificateRegistry ensure data integrity
- **Admin management:** Grant/revoke admin privileges on-chain

### Your Thesis Comparison Points

**Latency:**

- Control: ~50ms (database query)
- Blockchain: ~2000ms (transaction + consensus)
- **Trade-off:** Speed vs immutability

**Scalability:**

- Control: Thousands of certificates per second
- Blockchain: ~50-100 transactions per second (IBFT limit)
- **Trade-off:** Throughput vs decentralization

**Security:**

- Control: Single point of failure, admin has full control
- Blockchain: Distributed, immutable, tamper-evident
- **Winner:** Blockchain

**Cost:**

- Control: Database server costs
- Blockchain: 4 validator nodes + higher infrastructure
- **Trade-off:** Simplicity vs security

**Auditability:**

- Control: Audit logs can be deleted/modified
- Blockchain: Permanent, immutable event logs
- **Winner:** Blockchain

---

## Summary: Key Takeaways

1. **Blockchain = Distributed, immutable ledger**
   - 4 validator nodes with IBFT consensus
   - Once written, data cannot be changed
2. **100% blockchain architecture**
   - UserRegistry stores all user data (no database)
   - CertificateRegistry stores all certificates
   - Encrypted wallets managed by backend
3. **Certificate versioning by student_id**
   - Each student can have v1, v2, v3... certificates
   - Only ONE active certificate per student at a time
   - All versions preserved on blockchain
4. **Meta-transactions**
   - User's wallet signs (proves authorship)
   - Admin wallet pays gas (users don't need ETH)
   - Individual accountability maintained
5. **Authorization model**
   - Backend: JWT + Guards for access control
   - Smart contract: UserRegistry.isAuthorized() check
   - Hybrid approach ensures security at both layers
6. **Immutability = Core value**
   - Certificates cannot be forged or altered
   - Complete audit trail via blockchain events
   - Instant cryptographic verification

---

## Next Steps

Now that you understand the fundamentals, the next documents will cover:

1. **DOCKER_NETWORK_ARCHITECTURE.md:** How Docker hosts 4 nodes, port mappings, RPC communication
2. **SMART_CONTRACT_EXPLAINED.md:** Line-by-line breakdown of your Solidity code
3. **CRYPTOGRAPHY_EXPLAINED.md:** Deep dive into keccak256 and ECDSA signatures
4. **ETHERS_INTEGRATION.md:** How your backend communicates with the blockchain
5. **TRANSACTION_LIFECYCLE.md:** Complete flow from API call to blockchain confirmation
6. **DESIGN_DECISIONS.md:** Why we made specific architectural choices

These documents will reference concepts from this fundamental guide, so make sure you understand everything here first!

---

**For your thesis defense:**

When explaining to your supervisor, structure it as:

1. Start with the notebook analogy
2. Explain the problem with traditional databases
3. Introduce blockchain as the solution
4. Walk through a certificate issuance example
5. Show how consensus prevents tampering
6. Discuss trade-offs (speed vs security)

You now have the foundation to explain blockchain technology confidently!
