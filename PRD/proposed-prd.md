# PRD – Blockchain Certificate Verification System (Experimental System)

## 1. Project Summary

Build a **100% decentralized** certificate issuance + verification system using Quorum (IBFT), smart contracts, and a NestJS backend. **Zero database dependencies** – all data lives on the blockchain.

Backend: NestJS + Ethers.js (no TypeORM, no PostgreSQL, no bcrypt)  
Chain: 4-node Quorum (private permissioned blockchain)  
Contracts: Solidity 0.8.19 (UserRegistry.sol + CertificateRegistry.sol)  
Frontend: Next.js + Tailwind + shadcn (TBD)  
Authentication: Web3 wallet signatures (Rabby wallet) + JWT tokens  
Gas Fee Strategy: Meta-transactions (admin pays, issuer recorded)

## 2. Core Features (Backend)

### 2.0 Authentication & User Management

**No database! All user data stored on blockchain.**

#### Web3 Wallet Authentication

- POST /api/auth/wallet-login
- No passwords – users sign messages with their Ethereum wallet
- Backend verifies signature using ethers.js
- Returns JWT token (7-day expiry) with `walletAddress`, `username`, `isAdmin`

#### User Registration (Admin Only)

- POST /api/blockchain/users/register
- Admin generates new wallet using ethers.js (`Wallet.createRandom()`)
- Stores user data on UserRegistry contract (username, email, is_admin, is_authorized)
- Returns private key for user to import into Rabby wallet

#### User Management

- GET /api/blockchain/users – List all users (admin only)
- GET /api/blockchain/users/me – Get own profile
- GET /api/blockchain/users/:address – Get user by wallet address
- PATCH /api/blockchain/users/:address/revoke – Revoke authorization (admin only)
- PATCH /api/blockchain/users/:address/reactivate – Restore authorization (admin only)
- PATCH /api/blockchain/users/:address/grant-admin – Grant admin privileges (admin only)
- PATCH /api/blockchain/users/:address/revoke-admin – Revoke admin privileges (admin only)

**Authorization Guards:**

- `RolesGuard` – Checks `is_admin` flag on blockchain
- `AuthorizedGuard` – Checks `is_authorized` flag on blockchain
- `AuthGuard('jwt')` – Validates JWT token

### 2.1 Certificate Issuance (on-chain)

- POST /api/blockchain/certificates
- Auth required (JWT + `is_authorized=true`)
- **Versioned by student_id** – no certificate_number needed
- Backend tasks:
  - Compute keccak256 hash of certificate data
  - Sign hash with admin wallet (gas payment)
  - Call `contract.issueCertificate(issuer_address)` with JWT user's wallet
  - **Meta-transaction pattern:** Admin pays gas, issuer's wallet recorded as issuer
  - Automatic versioning: v1, v2, v3...
  - Returns certHash + transactionHash + version number

**Important:** Must revoke active certificate before issuing new version for same student

### 2.2 Certificate Verification

- GET /api/blockchain/certificates/verify/:hash
- No auth (public)
- Reads smart contract state
- Returns:
  - certificate data (student_id, version, name, degree, cgpa)
  - issuer address + issuer name (from UserRegistry)
  - isRevoked flag
  - cryptographic signature
  - issuance date

### 2.3 Certificate Queries

- GET /api/blockchain/certificates – Get all certificates
- GET /api/blockchain/certificates/student/:student_id/active – Get active certificate by student ID
- GET /api/blockchain/certificates/student/:student_id/versions – Get all versions for student (audit trail)

### 2.4 Certificate Revocation

- PATCH /api/blockchain/certificates/:hash/revoke
- Auth required (JWT + `is_authorized=true`)
- Calls contract.revokeCertificate()
- Clears active certificate pointer on blockchain

### 2.5 Certificate Reactivation

- PATCH /api/blockchain/certificates/:hash/reactivate
- Auth required (JWT + `is_authorized=true`)
- Calls contract.reactivateCertificate()
- Toggles isRevoked flag back to false
- Sets as active certificate if no other version is active

### 2.6 Audit Logs API

- GET /api/blockchain/audit-logs?certHash=:hash
- Auth required (JWT)
- Queries blockchain events (CertificateIssued, CertificateRevoked, CertificateReactivated)
- Returns formatted event history with transaction details
- Ordered by block number (DESC)

### 2.7 Blockchain Service Layer

- ethers.js v6 provider configuration
- Contract wrappers for UserRegistry + CertificateRegistry
- Utility functions: signCertificate(), computeHash()
- Admin wallet for transaction signing (gas fees)
- Meta-transaction support (admin signs, user recorded)

---

## 3. Smart Contract Requirements

### 3.1 Contract: UserRegistry.sol

**Purpose:** Store user data on blockchain, manage authorization and admin privileges.

**Functions:**

- `registerUser(address, string username, string email, bool is_admin)` – Admin only
- `getUser(address)` – Returns username, email, registration_date, is_authorized, is_admin
- `getUserByEmail(string email)` – Reverse lookup
- `revokeUser(address)` – Admin only, sets is_authorized=false
- `reactivateUser(address)` – Admin only, sets is_authorized=true
- `grantAdmin(address)` – Admin only, sets is_admin=true
- `revokeAdmin(address)` – Admin only, sets is_admin=false (cannot revoke primary admin)
- `isAuthorized(address)` – Returns bool
- `userExists(address)` – Returns bool

**Storage:**

- `mapping(address => User)` private users
- `mapping(address => bool)` private user_exists
- `mapping(string => address)` private email_to_address (reverse lookup)

**User Struct:**

```solidity
struct User {
    address wallet_address;
    string username;
    string email;
    uint256 registration_date;
    bool is_authorized;
    bool is_admin;
}
```

**Events:**

- `UserRegistered(address, username, email, registration_date)`
- `UserRevoked(address)`
- `UserReactivated(address)`
- `AdminGranted(address)`
- `AdminRevoked(address)`

**Rules:**

- Only admin can register/revoke/grant-admin
- Cannot revoke primary admin (contract deployer)
- Email uniqueness enforced

---

### 3.2 Contract: CertificateRegistry.sol

**Purpose:** Issue and manage versioned certificates per student_id.

**Functions:**

- `issueCertificate(bytes32, string student_id, string studentName, string degreeProgram, uint16 cgpa, string issuingAuthority, bytes signature, address issuer_address)` – **Meta-transaction support**: Admin OR issuer can call, but issuer_address is recorded
- `verifyCertificate(bytes32)` – Returns full certificate data
- `revokeCertificate(bytes32)` – Sets is_revoked=true, clears active pointer
- `reactivateCertificate(bytes32)` – Sets is_revoked=false, sets as active if no conflict
- `getActiveCertificate(string student_id)` – Returns currently active certificate
- `getAllVersions(string student_id)` – Returns array of all cert hashes for student

**Storage:**

- `mapping(bytes32 => Certificate)` private certificates
- `mapping(bytes32 => bool)` private certificate_exists
- `mapping(string => uint256)` public student_to_latest_version
- `mapping(string => mapping(uint256 => bytes32))` public student_version_to_hash
- `mapping(string => bytes32)` public student_to_active_cert_hash

**Certificate Struct:**

```solidity
struct Certificate {
    bytes32 cert_hash;
    string student_id;          // PRIMARY KEY (replaces certificate_number)
    uint256 version;            // Auto-incremented: v1, v2, v3...
    string student_name;
    string degree_program;
    uint16 cgpa;                // Multiplied by 100 (3.85 → 385)
    string issuing_authority;
    address issuer;             // ACTUAL issuer wallet (not admin)
    bool is_revoked;
    bytes signature;
    uint256 issuance_date;
}
```

**Events:**

- `CertificateIssued(certHash, student_id, version, issuer, blockNumber)`
- `CertificateRevoked(certHash, revokedBy, blockNumber)`
- `CertificateReactivated(certHash, reactivatedBy, blockNumber)`

**Rules:**

- Only authorized users (UserRegistry.isAuthorized=true) can issue certificates
- Meta-transaction pattern: Admin pays gas, issuer_address recorded as issuer
- Only one active version per student at a time
- Must revoke active version before issuing new version
- Can reactivate old versions if no other version is active
- Version numbers auto-increment per student_id

### 3.3 Design Principles

- No inheritance
- Minimal custom modifiers (onlyAdmin, onlyAuthorized)
- Keep structs small
- No dynamic arrays in storage (except return values)
- Use bytes32 hash as certificate primary key
- student_id as logical primary key for versioning
- UserRegistry interface in CertificateRegistry for authorization checks

---

## 4. Frontend Requirements (Next.js)

### 4.1 Pages

**User Management:**

- /login – Web3 wallet login (Rabby wallet signature)
- /register – Admin-only user registration with wallet generation
- /users – List all users (admin only)
- /users/profile – View own profile

**Certificate Management:**

- /issue – Issue certificate (authorized users only)
- /verify – Verify certificate by hash (public)
- /search – Search certificate by student_id (public)
- /revoke – Revoke certificate (authorized users only)
- /reactivate – Reactivate certificate (authorized users only)
- /audit-logs – View certificate audit trail (authenticated users)

### 4.2 UI Guidelines

**Web3 Authentication Flow:**

- "Connect Wallet" button using `window.ethereum` (Rabby injects this)
- Display wallet address after connection
- Request signature for login message
- Show JWT expiry countdown
- Logout clears JWT

**Certificate Display:**

- Clean card-based layout
- Display:
  - student_id + version (e.g., "22-46734-1 v2")
  - certHash (short + copy button)
  - blockchain txHash (link to explorer)
  - signature preview
  - issuer address + issuer name (from UserRegistry)
  - student name, degree program, CGPA (displayed as 3.85, not 385)
  - issuing authority
  - revoked status badge (🟢 Active / 🔴 Revoked)
  - issuance date (human-readable)
- Version history timeline for students with multiple certificates

**User Management Display:**

- User cards with:
  - Wallet address (truncated + copy)
  - Username, email
  - Registration date
  - Authorization badge (✅ Authorized / ❌ Revoked)
  - Admin badge (👑 Admin)
  - Action buttons (Revoke/Reactivate, Grant/Revoke Admin)

### 4.3 Blockchain Feedback

- Loading states ("Submitting transaction to blockchain...")
- Transaction pending ("Waiting for block confirmation...")
- Success card with:
  - Transaction hash (clickable)
  - Block number
  - Gas used
  - Confirmation message
- Error alerts with:
  - Readable error messages (not raw revert strings)
  - Suggestions for common errors
  - "Try again" button

### 4.4 Web3 Integration Notes

- Use ethers.js v6 for wallet connection
- Rabby wallet preferred over MetaMask (faster UX)
- Handle wallet disconnection gracefully
- Prompt wallet installation if not detected
- Show network mismatch warnings (must be on Quorum network)

---

## 5. Non-Functional Requirements

- Certificate verification time < 150ms (blockchain read)
- Transaction finality < 5–15 seconds (IBFT consensus)
- Smart contract must be deterministic and simple
- Node configuration:
  - 4 nodes (3 validators + 1 observer)
  - 5s block time (configurable)
- JWT token expiry: 7 days
- Gas fees: Admin wallet pays all transaction costs
- Zero database dependencies: 100% blockchain storage
- Wallet generation: ethers.js `Wallet.createRandom()`
- Signature verification: ECDSA (secp256k1 curve)
- Authorization checks: Query blockchain in real-time (no caching)
- Certificate versioning: Unlimited versions per student_id
- Meta-transaction support: Admin signs, issuer recorded

---

## 6. Out of Scope

**Explicitly Removed:**

- ❌ Database (TypeORM, PostgreSQL, bcrypt removed)
- ❌ Password authentication (replaced with Web3 signatures)
- ❌ Bring Your Own Wallet (BYOW) – admin generates wallets for users
- ❌ Multiple funded wallets – admin wallet pays all gas fees
- ❌ NFT-style certificates
- ❌ On-chain storage of PDFs or images
- ❌ Decentralized identity (DID/ENS)
- ❌ Public blockchain deployment (Quorum private network only for thesis)
- ❌ Multiple certificate numbers – student_id is the unique identifier
- ❌ Email notifications (nodemailer integration postponed)

**Future Considerations (Post-Thesis):**

- Public blockchain migration (Ethereum mainnet/testnet)
- BYOW support for users with existing wallets
- Email notifications via nodemailer
- Mobile wallet integration (WalletConnect)
- On-chain governance for admin voting

---

## 7. Current Deployment & Testing

### 7.1 Smart Contract Addresses (Quorum)

**Latest Deployment:**

- UserRegistry: `0xECB550dE5c73e6690AB4521C03EC9D476617167E`
- CertificateRegistry: `0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD`
- Admin Wallet: `0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73`

**Deployment Script:**

```bash
cd proposed/blockchain
npx hardhat run scripts/seed-admin.js --network quorum
```

### 7.2 API Testing

**Total Endpoints:** 16

See [TESTING_GUIDE.md](../proposed/TESTING_GUIDE.md) for:

- Complete API documentation with examples
- cURL commands for all endpoints
- Web3 wallet login flow
- Browser console testing method (Rabby wallet)
- Test scripts: `test-wallet-login.js`, `test-user-registration.js`

### 7.3 Web3 Authentication Testing

**Option 1: Test Script**

```bash
cd proposed/backend
node test-wallet-login.js
```

**Option 2: Browser Console (Rabby)**

1. Install Rabby wallet extension
2. Import user's private key
3. Open browser console on `http://localhost:3001`
4. Use `window.ethereum.request()` to sign messages
5. Full instructions: [WALLET_LOGIN_GUIDE.md](../proposed/WALLET_LOGIN_GUIDE.md)

### 7.4 Backend Configuration

**Environment Variables (.env):**

```env
BLOCKCHAIN_NETWORK_URL=http://localhost:8545
USER_REGISTRY_ADDRESS=0xECB550dE5c73e6690AB4521C03EC9D476617167E
CONTRACT_ADDRESS=0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD
ADMIN_WALLET_ADDRESS=0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73
ADMIN_WALLET_PRIVATE_KEY=<from_hardhat_accounts>
JWT_SECRET=<random_secret>
PORT=3001
```

### 7.5 Key Testing Scenarios

1. **Admin Registration Flow:**

   - Deploy contracts → Admin auto-registered with `is_admin=true`
   - Admin can register new users → Backend generates wallets
   - New users import private key to Rabby → Login via signature

2. **Certificate Issuance Flow:**

   - Authorized user issues certificate → Admin pays gas
   - Issuer's wallet recorded as issuer (not admin)
   - Version auto-increments per student_id
   - Must revoke active certificate before new version

3. **Authorization Flow:**

   - Admin can revoke/reactivate users
   - Revoked users cannot issue certificates
   - Admin can grant/revoke admin privileges
   - Cannot revoke primary admin

4. **Certificate Versioning:**
   - Student has v1 active → Issue v2 (fails)
   - Revoke v1 → Issue v2 (succeeds)
   - Reactivate v1 (fails - v2 is active)
   - Revoke v2 → Reactivate v1 (succeeds)

---

## 8. Architecture Decisions

### 8.1 Why No Database?

**Problems with Database:**

- Centralized point of failure
- Data can be tampered with
- Requires separate backup/recovery
- Slows down the system
- Defeats purpose of blockchain (immutability)

**Solution:**

- 100% blockchain storage
- Data integrity guaranteed by cryptography
- No separate backup needed (blockchain IS the backup)
- Faster reads (direct blockchain queries)
- True decentralization

### 8.2 Why Admin Generates Wallets?

**Rejected Approach: Bring Your Own Wallet (BYOW)**

- Users need to install wallet extension
- Users need to understand gas fees
- Every user wallet needs funding
- High friction for non-crypto users

**Chosen Approach: Admin-Generated Wallets**

- Admin generates wallet → User imports to Rabby
- Only admin wallet needs funding (gas fees)
- Users don't need to understand blockchain
- Lower friction for adoption
- Meta-transactions hide complexity

### 8.3 Why Meta-Transactions?

**Problem:**

- Every user issuing certificates needs ETH for gas
- In production, funding 100+ wallets is expensive
- Users shouldn't worry about gas fees

**Solution:**

- Admin wallet pays ALL gas fees
- Users sign with their wallet (authentication)
- Backend calls contract with admin wallet (gas payment)
- Contract records user's wallet as issuer (meta-transaction)
- **Result:** One funded wallet, individual accountability

### 8.4 Why Certificate Versioning by student_id?

**Original Design:**

- Unique `certificate_number` per certificate
- No relation between certificates for same student
- Hard to track student's history

**New Design:**

- `student_id` is the primary key
- Version auto-increments: v1, v2, v3...
- Easy to query all versions: `getAllVersions(student_id)`
- Easy to get active certificate: `getActiveCertificate(student_id)`
- Clear audit trail per student

### 8.5 Why Rabby Over MetaMask?

**MetaMask Issues:**

- Slow transaction confirmations
- Confusing UI for non-crypto users
- Requires network switching

**Rabby Benefits:**

- Faster transaction confirmations
- Cleaner UI
- Better support for custom networks
- Easier private key import
- User tested and preferred
