# System Design Document

## 1. Overview of System Design

This project implements a certificate management system in two variants: a **centralized PostgreSQL-based system** (control) and a **blockchain-based system** (proposed) using Quorum private blockchain. Both systems provide functionally equivalent APIs for certificate issuance, verification, and management, allowing direct comparison of centralized versus distributed ledger approaches.

The primary goal is to evaluate security, immutability, transparency, and performance trade-offs between traditional database systems and blockchain technology for academic credential management.

**Key Design Principles:**

- Functional equivalence across both implementations
- RESTful API design for frontend integration
- Role-based access control (Admin/Authorized User)
- Audit trail for all certificate operations
- Digital signature support for certificate authenticity

---

## 2. System Architecture

### 2.1 High-Level Architecture Overview

Both systems follow a three-tier architecture:

```
┌─────────────┐
│   Frontend  │  (Next.js + React)
│  (Shared)   │
└──────┬──────┘
       │
       │ HTTP/REST API
       │
┌──────┴──────────────────────────────────────┐
│                                             │
│  ┌────────────────┐    ┌─────────────────┐  │
│  │   Centralized  │    │   Blockchain    │  │
│  │     Backend    │    │     Backend     │  │
│  │   (NestJS)     │    │   (NestJS)      │  │
│  └───────┬────────┘    └────────┬────────┘  │
│          │                      │           │
└──────────┼──────────────────────┼───────────┘
           │                      │
    ┌──────┴──────┐        ┌──────┴────────────────┐
    │  PostgreSQL │        │  Quorum Blockchain    │
    │   Database  │        │  + Ethers.js Client   │
    └─────────────┘        └───────────────────────┘
```

**Key Components:**

1. **Frontend Layer**: Single Next.js application that can switch between centralized/blockchain backends
2. **Backend Layer**: NestJS REST API servers with identical endpoints
3. **Data Layer**: PostgreSQL (centralized) vs Quorum blockchain (distributed)

---

## 3. Centralized System Implementation

### 3.1 Database Schema and Design

The centralized system uses **PostgreSQL** with **TypeORM** as the ORM. Three main entities handle the core functionality:

#### **User Entity**

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ name: "password_hash" })
  password_hash: string;

  @Column({ name: "is_admin", default: false })
  is_admin: boolean;
}
```

**Design Decisions:**

- UUID primary keys for security (non-sequential IDs)
- Password-based authentication using bcrypt hashing
- `is_admin` boolean flag for role-based access control
- Unique constraints on username and email

#### **Certificate Entity**

```typescript
@Entity("certificates")
@Index(["student_name", "degree_program"])
@Index(["certificate_number"], { unique: true })
export class Certificate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "certificate_number", unique: true })
  certificate_number: string;

  @Column({ name: "student_id" })
  student_id: string;

  @Column({ name: "student_name" })
  student_name: string;

  @Column({ name: "degree_program" })
  degree_program: string;

  @Column("float")
  cgpa: number;

  @Column({ name: "issuing_authority" })
  issuing_authority: string;

  @Column({ name: "issuer_id", type: "uuid" })
  issuer_id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "issuer_id" })
  issuer: User;

  @CreateDateColumn({ name: "issuance_date" })
  issuance_date: Date;

  @Column({ default: false, name: "is_revoked" })
  is_revoked: boolean;
}
```

**Design Decisions:**

- Foreign key relationship to User (issuer) for accountability
- Composite index on student_name + degree_program for search performance
- `certificate_number` serves as unique identifier
- `is_revoked` flag for soft deletion (maintains history)
- Automatic timestamp on creation

#### **Audit Log Entity**

```typescript
@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column({ name: "certificate_id", type: "uuid" })
  certificate_id: string;

  @Column("jsonb")
  details: any;

  @Column({ name: "performed_by", nullable: true })
  performed_by: string;

  @CreateDateColumn()
  timestamp: Date;
}
```

**Design Decisions:**

- Separate audit table for historical tracking
- JSONB column for flexible detail storage
- No foreign key constraints (audit logs persist even if certificates are deleted)

### 3.2 NestJS Backend Architecture

The centralized backend follows a modular architecture:

```
src/
├── auth/
│   ├── auth.controller.ts       (Login endpoints)
│   ├── auth.service.ts          (JWT token generation)
│   ├── jwt.strategy.ts          (Passport JWT verification)
│   └── roles.guard.ts           (Admin role guard)
├── users/
│   ├── users.controller.ts      (User CRUD)
│   ├── users.service.ts         (User business logic)
│   └── user.entity.ts
├── certificates/
│   ├── certificates.controller.ts
│   ├── certificates.service.ts
│   └── entities/
│       ├── certificate.entity.ts
│       └── audit-log.entity.ts
└── app.module.ts                (Root module)
```

**Key Architectural Patterns:**

1. **Dependency Injection**: NestJS's built-in IoC container manages service lifecycles
2. **Guard-based Authorization**: `@UseGuards(AuthGuard('jwt'), RolesGuard)` for protected routes
3. **DTO Validation**: Class-validator decorators ensure data integrity
4. **Repository Pattern**: TypeORM repositories abstract database operations

**Authentication Flow:**

```
1. User sends { username, password } to /api/auth/login
2. AuthService validates credentials (bcrypt.compare)
3. If valid, generate JWT token with payload { userId, username, isAdmin }
4. Client stores JWT in localStorage
5. Subsequent requests include Authorization: Bearer <token>
6. JwtStrategy validates token and attaches user to request object
```

### 3.3 API Endpoints and Data Flow

**User Management:**

- `POST /api/auth/login` - Authenticate user, return JWT
- `POST /api/users/register` - Admin-only user registration
- `GET /api/users` - List all users (with filters)
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id/revoke` - Deactivate user
- `PATCH /api/users/:id/reactivate` - Reactivate user

**Certificate Operations:**

- `POST /api/certificates` - Issue new certificate (authorized users)
- `GET /api/certificates` - List all certificates (with pagination/filters)
- `GET /api/certificates/:id` - Get certificate details
- `GET /api/certificates/verify/:number` - Verify certificate by number
- `PATCH /api/certificates/:id/revoke` - Revoke certificate
- `PATCH /api/certificates/:id/reactivate` - Reactivate certificate
- `GET /api/certificates/student/:id/active` - Get student's active certificate
- `GET /api/certificates/student/:id/versions` - Get all certificate versions

**Audit Logs:**

- `GET /api/audit-logs` - Get system-wide audit logs
- `GET /api/audit-logs/certificate/:id` - Get certificate-specific logs

**Data Flow Example (Issue Certificate):**

```
1. POST /api/certificates with DTO:
   {
     student_id, student_name, degree_program,
     cgpa, issuing_authority
   }

2. CertificatesController validates JWT + admin role

3. CertificatesService:
   a. Generate unique certificate_number (UUID or custom format)
   b. Create Certificate entity with issuer_id = req.user.id
   c. Save to PostgreSQL via repository.save()
   d. Create AuditLog entry (action: "ISSUED", details: certificate data)

4. Return response:
   {
     success: true,
     certificate_number: "CERT-2024-12345",
     issuance_date: "2024-12-07T10:30:00Z"
   }
```

### 3.4 Security Limitations and Attack Surface

**Centralized System Vulnerabilities:**

1. **Single Point of Failure**

   - Database server crash = complete system outage
   - No built-in replication or failover

2. **Data Integrity Risks**

   - Admin with database access can modify/delete records
   - No cryptographic proof of authenticity
   - Audit logs can be tampered with (JSONB column is mutable)

3. **Trust Dependency**

   - Users must trust the centralized authority
   - No verifiable trail of who issued/modified certificates
   - Timestamps can be backdated with direct DB access

4. **SQL Injection** (Mitigated)

   - TypeORM uses parameterized queries
   - Still vulnerable if raw SQL queries are used

5. **Authentication Weaknesses**

   - Password-based auth vulnerable to brute force, phishing
   - JWT tokens stored in localStorage (XSS risk)
   - No multi-factor authentication

6. **Audit Trail Gaps**
   - Audit logs created by application code (can be bypassed)
   - No guarantee that logged actions match database state

**Attack Scenarios:**

- **Insider Threat**: Database admin can forge certificates with arbitrary dates
- **Compromised Credentials**: Attacker with admin credentials can issue/revoke any certificate
- **Database Breach**: Attacker gains access to all user passwords (even if hashed) and all certificate data

---

## 4. Blockchain System Implementation

### 4.1 Quorum Network Configuration

**Why Quorum?**

- **Private/Permissioned**: Suitable for enterprise use (not public like Ethereum)
- **Transaction Privacy**: Tessera for private transactions
- **Performance**: IBFT/QBFT consensus (faster than Proof-of-Work)
- **Ethereum Compatibility**: Uses Solidity and EVM

**Network Setup:**

The system uses **Quorum Developer Quickstart** with the following configuration:

```yaml
# quorum-test-network/docker-compose.yml (simplified)
services:
  validator1:
    image: quorumengineering/quorum:latest
    ports:
      - "21001:8545/tcp" # RPC endpoint
      - "30303" # P2P
    environment:
      - GOQUORUM_CONS_ALGO=istanbul
      - GOQUORUM_GENESIS_MODE=standard
    volumes:
      - ./config/nodes/validator1:/config/keys
      - ./logs/quorum:/var/log/quorum/
    networks:
      quorum-dev-quickstart:
        ipv4_address: 172.16.239.11

  validator2:
    image: quorumengineering/quorum:latest
    ports: ["21002:8545/tcp", "30303"]
    networks:
      quorum-dev-quickstart:
        ipv4_address: 172.16.239.12

  validator3:
    image: quorumengineering/quorum:latest
    ports: ["21003:8545/tcp", "30303"]
    networks:
      quorum-dev-quickstart:
        ipv4_address: 172.16.239.13

  validator4:
    image: quorumengineering/quorum:latest
    ports: ["21004:8545/tcp", "30303"]
    networks:
      quorum-dev-quickstart:
        ipv4_address: 172.16.239.14

networks:
  quorum-dev-quickstart:
    driver: bridge
    ipam:
      config:
        - subnet: 172.16.239.0/24
```

**Backend Connection:**

```bash
# proposed/backend/.env
RPC_URL=http://localhost:8545  # Maps to validator1 port 21001
PRIVATE_KEY=0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63
ADMIN_WALLET_ADDRESS=0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73
```

**Note on Tessera:** Configuration exists in `config/tessera/` but private transactions are NOT actively used in this implementation. All transactions are public within the private network.

**Consensus Mechanism: IBFT 2.0**

- **Istanbul Byzantine Fault Tolerant**: Requires 2F+1 validators (F = faulty nodes)
- 4 validator nodes in test network (tolerates 1 failure)
- Block time: ~5 seconds
- Finality: Immediate (no chain reorganizations)

**Network Architecture:**

```
┌─────────────────────────────────────────────┐
│         Quorum Private Network              │
│         (Docker Compose Network)            │
│                                             │
│  ┌───────────┐  ┌───────────┐              │
│  │Validator 1│──│Validator 2│              │
│  │port 21001 │  │port 21002 │              │
│  └─────┬─────┘  └─────┬─────┘              │
│        │              │                     │
│        └──────┬───────┘                     │
│               │                             │
│  ┌────────────┴───────┐                    │
│  │                    │                     │
│  ┌─────▼─────┐  ┌─────▼─────┐              │
│  │Validator 3│  │Validator 4│              │
│  │port 21003 │  │port 21004 │              │
│  └───────────┘  └───────────┘              │
│                                             │
│  IBFT 2.0 Consensus (4 validators)          │
└─────────────┬───────────────────────────────┘
              │
              │ RPC: http://localhost:8545
              │ (maps to validator1:8545)
              │
        ┌─────▼──────┐
        │   NestJS   │
        │   Backend  │
        └────────────┘
```

**Key Configuration Files:**

1. **Genesis Block** (`config/goquorum/data/istanbul-standard-genesis.json`):

```json
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "istanbul": {
      "epoch": 30000,
      "policy": 0,
      "ceil2Nby3Block": 0
    },
    "txnSizeLimit": 64,
    "isQuorum": true
  },
  "gasLimit": "0xf7b760",
  "difficulty": "0x1",
  "alloc": {
    "fe3b557e8fb62b89f4916b721be55ceb828dbd73": {
      "balance": "0x130EE8E7179044400000",
      "comment": "Admin wallet (matches PRIVATE_KEY in .env)"
    },
    "0xf0e2db6c8dc6c681bb5d6ad121a107f300e9b2b5": {
      "balance": "1000000000000000000000000000"
    }
    // ... 7 more pre-funded accounts
  }
}
```

2. **Static Nodes** (`config/goquorum/data/static-nodes.json`):

```json
[
  "enode://8208a3f344695d44e9cf2c023683cbea7b9343e2f70a5e804bd2c93858e945f8...@172.16.239.11:30303",
  "enode://b9050e002aa42464e6b07c811a1f9dfec01249af03f67b753e8415420649b184...@172.16.239.12:30303",
  "enode://59cf0c623c582fa9b19bdf70fb6bade07f4ae32218dd4d1c7e2c7e65acf87da4...@172.16.239.13:30303",
  "enode://2fd5b5b6ad529f55b71602026d1849d0036f06482368b5812fa793014195d357...@172.16.239.14:30303"
  // ... 4 more member nodes
]
```

- Defines validator network topology using enode URLs
- IP addresses from Docker Compose network (172.16.239.0/24)
- Includes 4 validators + 4 member nodes

### 4.2 Smart Contract Design (Solidity)

Two main contracts handle the system logic:

#### **UserRegistry Contract**

**Purpose**: Manage authorized users and their wallet addresses (replaces User table)

```solidity
contract UserRegistry {
    struct User {
        address wallet_address;
        string username;
        string email;
        uint256 registration_date;
        bool is_authorized;
        bool is_admin;
    }

    mapping(address => User) private users;
    mapping(address => bool) private user_exists;
    mapping(string => address) private email_to_address;

    address public admin;

    event UserRegistered(address indexed wallet_address, ...);
    event UserRevoked(address indexed wallet_address);
    event AdminGranted(address indexed wallet_address);
}
```

**Key Functions:**

1. **registerUser** (admin-only):

```solidity
function registerUser(
    address wallet_address,
    string memory username,
    string memory email,
    bool is_admin
) external onlyAdmin {
    require(!user_exists[wallet_address], "User already registered");
    require(email_to_address[email] == address(0), "Email taken");

    users[wallet_address] = User({
        wallet_address: wallet_address,
        username: username,
        email: email,
        registration_date: block.timestamp,
        is_authorized: true,
        is_admin: is_admin
    });

    user_exists[wallet_address] = true;
    email_to_address[email] = wallet_address;

    emit UserRegistered(wallet_address, username, email, block.timestamp);
}
```

**Design Decisions:**

- `address` as primary key (wallet address = unique identifier)
- Reverse mapping `email_to_address` for email-based lookups
- `onlyAdmin` modifier restricts user registration
- Events emit indexed parameters for efficient filtering
- No password storage (authentication via wallet signature)

2. **getUser** (public view):

```solidity
function getUser(address wallet_address)
    external view
    returns (
        string memory username,
        string memory email,
        uint256 registration_date,
        bool is_authorized,
        bool is_admin
    )
{
    require(user_exists[wallet_address], "User not found");
    User memory user = users[wallet_address];
    return (user.username, user.email, ...);
}
```

3. **revokeUser / reactivateUser**:

- Toggle `is_authorized` flag
- Cannot revoke the primary admin
- Emits events for audit trail

#### **CertificateRegistry Contract**

**Purpose**: Issue, verify, and manage certificates with versioning support

```solidity
contract CertificateRegistry {
    struct Certificate {
        bytes32 cert_hash;
        string student_id;
        uint256 version;
        string student_name;
        string degree;
        string program;
        uint16 cgpa;  // Scaled to 2 decimals (e.g., 395 = 3.95)
        string issuing_authority;
        address issuer;
        bool is_revoked;
        bytes signature;
        uint256 issuance_date;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(bytes32 => bool) private certificate_exists;

    // Versioning
    mapping(string => uint256) public student_to_latest_version;
    mapping(string => mapping(uint256 => bytes32)) public student_version_to_hash;
    mapping(string => bytes32) public student_to_active_cert_hash;

    IUserRegistry public userRegistry;

    event CertificateIssued(bytes32 indexed cert_hash, ...);
    event CertificateRevoked(bytes32 indexed cert_hash, ...);
}
```

**Key Functions:**

1. **issueCertificate** (authorized users only):

```solidity
function issueCertificate(
    bytes32 cert_hash,
    string memory student_id,
    string memory student_name,
    string memory degree,
    string memory program,
    uint16 cgpa,
    string memory issuing_authority,
    bytes memory signature,
    address issuer_address
) external {
    require(userRegistry.isAuthorized(issuer_address), "Not authorized");
    require(!certificate_exists[cert_hash], "Certificate exists");
    require(cgpa <= 400, "Invalid CGPA");

    uint256 latest_version = student_to_latest_version[student_id];

    // Ensure no active certificate before issuing new version
    if (latest_version > 0) {
        bytes32 active_hash = student_to_active_cert_hash[student_id];
        require(active_hash == bytes32(0), "Active certificate exists");
    }

    uint256 new_version = latest_version + 1;

    certificates[cert_hash] = Certificate({...});
    certificate_exists[cert_hash] = true;

    student_to_latest_version[student_id] = new_version;
    student_version_to_hash[student_id][new_version] = cert_hash;
    student_to_active_cert_hash[student_id] = cert_hash;

    emit CertificateIssued(cert_hash, student_id, new_version, issuer_address, block.number);
}
```

**Design Decisions:**

- `bytes32` cert_hash = Keccak256(student_id + name + degree + cgpa + version + timestamp)
- Versioning ensures one active certificate per student at a time
- `signature` field stores off-chain signature for additional verification
- `issuance_date` uses `block.timestamp` (immutable, consensus-verified)
- Events include `block.number` for audit chronology

2. **verifyCertificate** (public view):

```solidity
function verifyCertificate(bytes32 cert_hash)
    external view
    returns (Certificate memory)
{
    require(certificate_exists[cert_hash], "Certificate does not exist");
    return certificates[cert_hash];
}
```

3. **revokeCertificate / reactivateCertificate**:

- Toggle `is_revoked` flag
- Clear/set `student_to_active_cert_hash` pointer
- Prevents reactivation if another version is active
- Emits events with actor address for accountability

4. **Version Management**:

```solidity
function getAllVersions(string memory student_id)
    external view
    returns (bytes32[] memory)
{
    uint256 latest = student_to_latest_version[student_id];
    require(latest > 0, "No certificates found");

    bytes32[] memory hashes = new bytes32[](latest);
    for (uint256 v = 1; v <= latest; v++) {
        hashes[v-1] = student_version_to_hash[student_id][v];
    }
    return hashes;
}

function getActiveCertificate(string memory student_id)
    external view
    returns (Certificate memory)
{
    bytes32 hash = student_to_active_cert_hash[student_id];
    require(hash != bytes32(0), "No active certificate");
    return certificates[hash];
}
```

**Gas Optimization:**

- `uint16` for CGPA instead of `uint256` (saves storage)
- `memory` instead of `storage` for read-only operations
- Indexed event parameters for efficient log filtering
- No dynamic arrays in struct (fixed size data)

### 4.3 Backend Integration with Ethers.js

The NestJS backend uses **Ethers.js v6** to interact with Quorum:

**Connection Setup:**

```typescript
// blockchain-client.service.ts
async initialize(configService: ConfigService) {
  const rpcUrl = configService.get<string>('RPC_URL');
  const privateKey = configService.get<string>('PRIVATE_KEY');

  this.provider = new ethers.JsonRpcProvider(rpcUrl);
  this.adminWallet = new ethers.Wallet(privateKey, this.provider);

  this.certificateContract = new ethers.Contract(
    certificateAddress,
    CONTRACT_ABI,
    this.adminWallet
  );

  this.userRegistryContract = new ethers.Contract(
    userRegistryAddress,
    USER_REGISTRY_ABI,
    this.adminWallet
  );
}
```

**Key Integration Patterns:**

1. **Reading Data (View Functions)**:

```typescript
async verifyCertificate(cert_hash: string) {
  const result = await this.certificateContract.verifyCertificate(cert_hash);

  return {
    cert_hash,
    student_id: result.student_id,
    version: Number(result.version),
    cgpa: Number(result.cgpa) / 100,  // Descale from blockchain
    issuance_date: new Date(Number(result.issuance_date) * 1000).toISOString(),
    is_revoked: result.is_revoked,
    ...
  };
}
```

2. **Writing Data (State-Changing Functions)**:

```typescript
async issueCertificate(dto) {
  // Compute deterministic hash
  const cert_hash = this.computeHash(
    dto.student_id,
    dto.student_name,
    `${dto.degree} - ${dto.program}`,
    dto.cgpa,
    version,
    issuance_date
  );

  // Sign with admin wallet
  const signature = await this.adminWallet.signMessage(
    ethers.getBytes(cert_hash)
  );

  // Send transaction
  const tx = await this.certificateContract.issueCertificate(
    cert_hash,
    dto.student_id,
    dto.student_name,
    dto.degree,
    dto.program,
    Math.round(dto.cgpa * 100),  // Scale CGPA
    dto.issuing_authority,
    signature,
    walletAddress
  );

  // Wait for transaction confirmation
  const receipt = await tx.wait();

  return {
    success: true,
    cert_hash,
    transaction_hash: receipt.hash,
    block_number: receipt.blockNumber
  };
}
```

**Error Handling:**

```typescript
try {
  const tx = await this.certificateContract.revokeCertificate(...);
  await tx.wait();
} catch (error) {
  if (error.reason) {
    throw new BadRequestException(error.reason);  // Solidity revert message
  }
  if (error.code === 'CALL_EXCEPTION' && error.revert?.args?.[0]) {
    throw new BadRequestException(error.revert.args[0]);
  }
  throw new BadRequestException('Transaction failed');
}
```

3. **Event Querying (Audit Logs)**:

```typescript
async getAuditLogs(cert_hash: string) {
  const issuedFilter = this.certificateContract.filters.CertificateIssued(cert_hash);
  const revokedFilter = this.certificateContract.filters.CertificateRevoked(cert_hash);

  const [issuedEvents, revokedEvents] = await Promise.all([
    this.certificateContract.queryFilter(issuedFilter),
    this.certificateContract.queryFilter(revokedFilter)
  ]);

  const allEvents = await Promise.all([
    ...issuedEvents.map(async (e) => {
      const block = await this.provider.getBlock(e.blockNumber);
      return {
        action: 'ISSUED',
        cert_hash: e.args.cert_hash,
        issuer: e.args.issuer,
        block_number: Number(e.args.block_number),
        transaction_hash: e.transactionHash,
        timestamp: new Date(block.timestamp * 1000).toISOString()
      };
    }),
    ...
  ]);

  return allEvents.sort((a, b) => b.block_number - a.block_number);
}
```

**Authentication Flow (Wallet-Based):**

```typescript
// 1. Frontend requests wallet signature
const message = `Login to Certificate System\nNonce: ${nonce}`;
const signature = await signer.signMessage(message);

// 2. Backend verifies signature
const recoveredAddress = ethers.verifyMessage(message, signature);
if (recoveredAddress !== walletAddress) {
  throw new UnauthorizedException("Invalid signature");
}

// 3. Check if user exists and is authorized
const user = await this.userRegistryContract.getUser(walletAddress);
if (!user.is_authorized) {
  throw new UnauthorizedException("User not authorized");
}

// 4. Generate JWT token
const token = this.jwtService.sign({
  walletAddress,
  username: user.username,
  isAdmin: user.is_admin,
});
```

**Service Architecture:**

```
blockchain.service.ts (orchestrator)
    ├─> blockchain-client.service.ts (connection management)
    ├─> user-blockchain.service.ts (user operations)
    ├─> certificate-blockchain.service.ts (certificate operations)
    └─> audit-blockchain.service.ts (event querying)
```

### 4.4 Ensuring Functional Equivalence

**API Compatibility Matrix:**

| Endpoint                             | Centralized (PostgreSQL)  | Blockchain (Quorum)                         | Equivalent?         |
| ------------------------------------ | ------------------------- | ------------------------------------------- | ------------------- |
| POST /api/auth/login                 | Username + password → JWT | Wallet signature → JWT                      | ✅ (different auth) |
| POST /api/users/register             | Insert User row           | Call UserRegistry.registerUser()            | ✅                  |
| GET /api/users                       | SELECT \* FROM users      | Query UserRegistered events                 | ✅                  |
| POST /api/certificates               | Insert Certificate row    | Call CertificateRegistry.issueCertificate() | ✅                  |
| GET /api/certificates/:hash          | SELECT WHERE cert_number  | Call verifyCertificate(cert_hash)           | ✅                  |
| PATCH /api/certificates/:hash/revoke | UPDATE is_revoked = true  | Call revokeCertificate()                    | ✅                  |
| GET /api/audit-logs                  | SELECT FROM audit_logs    | Query CertificateIssued/Revoked events      | ✅                  |

**Key Differences:**

1. **Authentication:**

   - Centralized: Password-based (bcrypt) → JWT
   - Blockchain: Wallet signature (ECDSA) → JWT

2. **Data Format:**

   - Centralized: UUID primary keys, ISO timestamps
   - Blockchain: bytes32 hashes, Unix timestamps

3. **Versioning:**

   - Centralized: No built-in versioning (needs custom logic)
   - Blockchain: Native versioning via mappings

4. **Transaction Confirmation:**
   - Centralized: Immediate (database commit)
   - Blockchain: ~5 seconds (IBFT block time)

**Data Transformation Layer:**

The backend abstracts these differences:

```typescript
// Blockchain service transforms blockchain data to match API contract
async verifyCertificate(cert_hash: string) {
  const blockchainCert = await this.certificateContract.verifyCertificate(cert_hash);

  // Transform to match centralized API response
  return {
    id: cert_hash,  // Use cert_hash as "id" field
    certificate_number: cert_hash,
    student_id: blockchainCert.student_id,
    student_name: blockchainCert.student_name,
    degree_program: `${blockchainCert.degree} - ${blockchainCert.program}`,
    cgpa: Number(blockchainCert.cgpa) / 100,
    issuing_authority: blockchainCert.issuing_authority,
    issuer_id: blockchainCert.issuer,  // Wallet address instead of UUID
    issuance_date: new Date(Number(blockchainCert.issuance_date) * 1000).toISOString(),
    is_revoked: blockchainCert.is_revoked
  };
}
```

**Frontend Configuration:**

The Next.js frontend is currently hardcoded to the blockchain backend:

```typescript
// proposed/frontend/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Current State:**

- Frontend defaults to `http://localhost:3001` (blockchain backend)
- No environment variable switching implemented yet
- Control system would require separate frontend or configuration change
- Future work: Add runtime backend selection via environment variables

---

## 5. Complete API Route Specification

### 5.1 Authentication

#### **POST /api/auth/login**

**Centralized:**

```json
Request:
{
  "username": "admin",
  "password": "secure123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "is_admin": true
  }
}
```

**Blockchain:**

```json
Request:
{
  "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "signature": "0x1234...",
  "message": "Login to Certificate System\nNonce: abc123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "walletAddress": "0xf39...",
    "username": "admin",
    "is_admin": true
  }
}
```

### 5.2 User Management

#### **POST /api/blockchain/users/register** (Admin only)

```json
Request:
{
  "username": "john_doe",
  "email": "john@example.com",
  "is_admin": false
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "wallet_address": "0xABC...",
  "private_key": "0x123...",  // Blockchain only - generated wallet
  "username": "john_doe",
  "email": "john@example.com",
  "transaction_hash": "0xDEF...",
  "block_number": 42
}
```

#### **GET /api/blockchain/users**

```json
Query Parameters:
- page: number
- limit: number
- status: 'authorized' | 'revoked'
- is_admin: 'true' | 'false'

Response:
[
  {
    "wallet_address": "0xABC...",
    "username": "john_doe",
    "email": "john@example.com",
    "is_authorized": true,
    "is_admin": false
  },
  ...
]
```

#### **PATCH /api/blockchain/users/:wallet_address/revoke** (Admin only)

```json
Response:
{
  "success": true,
  "message": "User revoked",
  "transaction_hash": "0x123..."
}
```

### 5.3 Certificate Operations

#### **POST /api/blockchain/certificates** (Authorized users)

```json
Request:
{
  "student_id": "2021CS001",
  "student_name": "Alice Johnson",
  "degree": "Bachelor of Science",
  "program": "Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "University of Example"
}

Response:
{
  "success": true,
  "student_id": "2021CS001",
  "version": 1,
  "cert_hash": "0xabcdef1234567890...",
  "transaction_hash": "0x9876543210...",
  "block_number": 123,
  "signature": "0x..."
}
```

#### **GET /api/blockchain/certificates** (Public)

```json
Query Parameters:
- page: number
- limit: number
- student_id: string
- status: 'active' | 'revoked'

Response:
{
  "data": [
    {
      "cert_hash": "0xabc...",
      "student_id": "2021CS001",
      "student_name": "Alice Johnson",
      "degree": "Bachelor of Science",
      "program": "Computer Science",
      "cgpa": 3.85,
      "issuing_authority": "University of Example",
      "issuer": "0x123...",
      "issuer_name": "admin",
      "is_revoked": false,
      "signature": "0x...",
      "issuance_date": "2024-12-07T10:30:00.000Z"
    },
    ...
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 42,
    "has_more": true
  }
}
```

#### **GET /api/blockchain/certificates/verify/:cert_hash** (Public)

```json
Response:
{
  "cert_hash": "0xabc...",
  "student_id": "2021CS001",
  "version": 1,
  "student_name": "Alice Johnson",
  "degree": "Bachelor of Science",
  "program": "Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "University of Example",
  "issuer": "0x123...",
  "issuer_name": "admin",
  "is_revoked": false,
  "signature": "0x...",
  "issuance_date": "2024-12-07T10:30:00.000Z"
}
```

#### **GET /api/blockchain/certificates/student/:student_id/active** (Public)

```json
Response:
{
  "cert_hash": "0xabc...",
  "student_id": "2021CS001",
  "version": 2,
  "degree_program": "Bachelor of Science - Computer Science",
  ...
}
```

#### **GET /api/blockchain/certificates/student/:student_id/versions** (Public)

```json
Response:
[
  {
    "cert_hash": "0xabc...",
    "version": 1,
    "is_revoked": true,
    ...
  },
  {
    "cert_hash": "0xdef...",
    "version": 2,
    "is_revoked": false,
    ...
  }
]
```

#### **PATCH /api/blockchain/certificates/:cert_hash/revoke** (Authorized users)

```json
Response:
{
  "success": true,
  "cert_hash": "0xabc...",
  "message": "Certificate revoked successfully",  // If already revoked
  "transaction_hash": "0x123...",
  "block_number": 125
}
```

#### **PATCH /api/blockchain/certificates/:cert_hash/reactivate** (Authorized users)

```json
Response:
{
  "success": true,
  "cert_hash": "0xabc...",
  "transaction_hash": "0x456...",
  "block_number": 126
}
```

### 5.4 Audit Logs

#### **GET /api/blockchain/certificates/audit-logs** (Admin only)

```json
Query Parameters:
- page: number
- limit: number

Response:
{
  "data": [
    {
      "action": "ISSUED",
      "cert_hash": "0xabc...",
      "student_id": "2021CS001",
      "version": 1,
      "issuer": "0x123...",
      "block_number": 100,
      "transaction_hash": "0x789...",
      "timestamp": "2024-12-07T10:30:00.000Z"
    },
    {
      "action": "REVOKED",
      "cert_hash": "0xabc...",
      "revoked_by": "0x456...",
      "block_number": 125,
      "transaction_hash": "0xabc...",
      "timestamp": "2024-12-08T14:20:00.000Z"
    },
    ...
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 15,
    "has_more": true
  }
}
```

#### **GET /api/blockchain/certificates/audit-logs/user/:wallet_address** (Admin only)

```json
Response: (Same structure as above, filtered by user)
```

### 5.5 Search

#### **GET /api/blockchain/search** (Public)

```json
Query Parameters:
- q: string (student ID, cert hash, or wallet address)

Response:
{
  "studentIds": ["2021CS001", "2021CS002"],
  "certificates": [
    {
      "cert_hash": "0xabc...",
      "student_id": "2021CS001",
      "is_active": true
    }
  ],
  "users": [
    {
      "wallet_address": "0x123...",
      "username": "john_doe",
      "email": "john@example.com",
      "is_authorized": true
    }
  ]
}
```

### 5.6 Statistics

#### **GET /api/blockchain/stats** (Authenticated users)

```json
Response:
{
  "active_certificates": 42,
  "authorized_users": 15,
  "certificates_issued_by_me": 5,
  "recent_activity": [
    {
      "action": "ISSUED",
      "cert_hash": "0xabc...",
      "student_id": "2021CS001",
      ...
    },
    ...
  ]
}
```

### 5.7 PDF Generation

#### **GET /api/blockchain/certificates/:cert_hash/download** (Public)

```
Response: application/pdf (file download)
```

#### **GET /api/blockchain/certificates/:cert_hash/preview** (Public)

```
Response: image/png (certificate image)
```

---

## 6. Security Comparison

### 6.1 Centralized System Security

**Strengths:**

- Mature authentication mechanisms (bcrypt, JWT)
- Row-level security via database permissions
- Faster transactions (no blockchain overhead)

**Weaknesses:**

- Trust in central authority required
- Audit logs can be tampered
- No cryptographic proof of data integrity
- Single point of failure

### 6.2 Blockchain System Security

**Strengths:**

- **Immutability**: Once written, data cannot be modified (only new states can be appended)
- **Transparency**: All transactions visible to network participants
- **Cryptographic Verification**: Digital signatures prove authenticity
- **Consensus-Based Trust**: 2F+1 validators must agree (Byzantine fault tolerance)
- **Audit Trail**: Events provide tamper-proof history
- **Decentralization**: No single point of control

**Weaknesses:**

- Private key management (if lost, account inaccessible)
- Smart contract bugs can be exploited (immutable code)
- Gas costs for transactions (mitigated in private networks)
- Performance overhead compared to databases

### 6.3 Security Testing Framework

**Note:** The following testing methodology should be applied to generate empirical data for attack resistance comparison.

#### **Testing Categories**

1. **Authentication Security**
   - **Test:** JWT token expiration and refresh handling
   - **Measure:** Token lifetime, session management behavior
   - **Compare:** Password-based (control) vs wallet signature (blockchain)
2. **Data Tampering Resistance**
   - **Test (Centralized):** Attempt direct database modification with admin access
   - **Test (Blockchain):** Attempt transaction modification before consensus
   - **Measure:** Success rate, detection mechanisms, recovery procedures
3. **Replay Attack Prevention**

   - **Test (Centralized):** Reuse JWT tokens after logout
   - **Test (Blockchain):** Resubmit signed transactions
   - **Measure:** Whether duplicate transactions are accepted
   - **Note:** Check if nonce mechanism is implemented for blockchain signatures

4. **SQL Injection Testing (Centralized Only)**

   - **Test:** Input validation on all POST/PATCH endpoints
   - **Use Tools:** SQLMap, manual payload injection
   - **Measure:** Vulnerability detection, TypeORM protection effectiveness

5. **Smart Contract Vulnerability Scanning (Blockchain Only)**

   - **Test:** Static analysis of CertificateRegistry and UserRegistry
   - **Use Tools:** Slither, Mythril, Manticore
   - **Measure:** Reentrancy, integer overflow, access control issues

6. **Insider Threat Simulation**

   - **Test (Centralized):** Database admin modifying audit_logs table
   - **Test (Blockchain):** Validator attempting to forge certificate without consensus
   - **Measure:** Traceability of malicious actions, detectability

7. **DDoS Resistance**
   - **Test:** Concurrent request flooding to both backends
   - **Use Tools:** Apache Bench, Locust
   - **Measure:** Request success rate, latency under load

#### **Data to Collect for Section 6.3**

Create a table with the following structure after testing:

| Attack Type         | Centralized Result | Blockchain Result | Vulnerability Level | Notes               |
| ------------------- | ------------------ | ----------------- | ------------------- | ------------------- |
| SQL Injection       | [Pass/Fail]        | N/A               | [Low/Medium/High]   | TypeORM protection? |
| Data Tampering      | [Pass/Fail]        | [Pass/Fail]       | [Low/Medium/High]   | Can admin modify?   |
| Replay Attacks      | [Pass/Fail]        | [Pass/Fail]       | [Low/Medium/High]   | Nonce implemented?  |
| JWT Token Theft     | [Pass/Fail]        | [Pass/Fail]       | [Low/Medium/High]   | XSS protection?     |
| Smart Contract Bugs | N/A                | [Pass/Fail]       | [Low/Medium/High]   | Slither findings    |
| Insider Threat      | [Pass/Fail]        | [Pass/Fail]       | [Low/Medium/High]   | Audit trail valid?  |
| DDoS (100 req/s)    | [Response time]    | [Response time]   | [Low/Medium/High]   | Degradation rate    |
| DDoS (1000 req/s)   | [Response time]    | [Response time]   | [Low/Medium/High]   | System failure?     |

---

## 7. Performance Testing Framework

**Note:** The following benchmarks must be measured empirically. Numbers are currently placeholders pending actual load testing.

### 7.1 Testing Methodology

#### **Test Setup**

- **Environment:** Both systems running on same hardware
- **Network:** Localhost (eliminates network latency variables)
- **Database:** PostgreSQL with default configuration
- **Blockchain:** 4 Quorum validators (IBFT 2.0 consensus)
- **Tools:** Apache Bench, Postman, custom load testing scripts

#### **Benchmark Categories**

1. **Certificate Issuance Latency**

   - **Test:** Time from API request to successful response
   - **Method:** POST `/api/certificates` with valid data
   - **Iterations:** 100 requests (measure avg, p50, p95, p99)
   - **Compare:** Database INSERT vs blockchain transaction + consensus

2. **Certificate Verification Latency**

   - **Test:** Time to retrieve certificate details
   - **Method:** GET `/api/certificates/verify/:id` or `/certificates/:hash`
   - **Iterations:** 100 requests (measure avg, p50, p95, p99)
   - **Compare:** Database SELECT vs smart contract view function

3. **Throughput Under Load**

   - **Test:** Maximum requests/second before failure
   - **Method:** Gradually increase concurrent requests
   - **Measure:** Success rate at 10, 50, 100, 500, 1000 req/s
   - **Compare:** PostgreSQL transaction limit vs IBFT block capacity

4. **Concurrent User Simulation**

   - **Test:** 10, 50, 100 simultaneous users issuing certificates
   - **Measure:** Response time degradation, failure rate
   - **Compare:** Database connection pooling vs RPC endpoint bottleneck

5. **Search/Query Performance**

   - **Test:** Time to search 100, 1000, 10,000 certificates
   - **Method:** GET `/api/certificates` with filters
   - **Measure:** Query time vs dataset size
   - **Compare:** SQL indexes vs blockchain event log scanning

6. **Audit Log Retrieval**
   - **Test:** Time to fetch complete audit history
   - **Method:** GET `/api/audit-logs` (centralized) vs event filtering (blockchain)
   - **Measure:** Query time for 100, 1000, 10,000 events

### 7.2 Data to Collect for Section 7

Create tables with the following structure after testing:

#### **Latency Comparison**

| Operation                | Centralized (ms) | Blockchain (ms) | Difference  | Notes                  |
| ------------------------ | ---------------- | --------------- | ----------- | ---------------------- |
| Issue Certificate (avg)  | [TBD]            | [TBD]           | [X]x slower | Include consensus time |
| Issue Certificate (p95)  | [TBD]            | [TBD]           | [X]x slower | Worst-case latency     |
| Verify Certificate (avg) | [TBD]            | [TBD]           | [X]x slower | View function call     |
| Search 100 certs (avg)   | [TBD]            | [TBD]           | [X]x slower | SQL vs event scan      |
| Audit logs (1000 events) | [TBD]            | [TBD]           | [X]x slower | JSONB vs events        |

#### **Throughput Comparison**

| Load Level | Centralized (req/s) | Blockchain (req/s) | Success Rate (C) | Success Rate (B) |
| ---------- | ------------------- | ------------------ | ---------------- | ---------------- |
| 10 req/s   | [TBD]               | [TBD]              | [TBD]%           | [TBD]%           |
| 50 req/s   | [TBD]               | [TBD]              | [TBD]%           | [TBD]%           |
| 100 req/s  | [TBD]               | [TBD]              | [TBD]%           | [TBD]%           |
| 500 req/s  | [TBD]               | [TBD]              | [TBD]%           | [TBD]%           |
| 1000 req/s | [TBD]               | [TBD]              | [TBD]%           | [TBD]%           |

#### **Scalability Analysis**

| Dataset Size         | Centralized Query Time | Blockchain Query Time | Notes                   |
| -------------------- | ---------------------- | --------------------- | ----------------------- |
| 100 certificates     | [TBD] ms               | [TBD] ms              | Initial performance     |
| 1,000 certificates   | [TBD] ms               | [TBD] ms              | Indexes effective?      |
| 10,000 certificates  | [TBD] ms               | [TBD] ms              | Event log scan overhead |
| 100,000 certificates | [TBD] ms               | [TBD] ms              | Production scale        |

### 7.3 Expected Trade-offs (Hypotheses to Verify)

1. **Centralized System Advantages:**

   - Sub-100ms response times for all operations
   - Linear scalability with database connection pool
   - Query performance benefits from SQL indexes
   - Immediate transaction confirmation

2. **Blockchain System Challenges:**

   - 5-10 second latency due to block time (IBFT consensus)
   - Throughput limited by gas per block
   - Event querying slower than indexed database queries
   - RPC endpoint becomes bottleneck under load

3. **Critical Question to Answer:**
   - At what transaction volume does blockchain become impractical?
   - Does the immutability benefit outweigh the performance cost?

---

## 8. Deployment Architecture

### 8.1 Actual Implementation Architecture

Both systems are deployed as **single-instance development setups**, not production-ready architectures with load balancing or replication.

#### **Centralized System (Control)**

```
┌─────────────────┐
│   Browser       │
│  (localhost)    │
└────────┬────────┘
         │ HTTP
         │
┌────────▼────────┐
│  NestJS Backend │
│  (Single Inst.) │
│   port 3001     │
└────────┬────────┘
         │ TCP
         │
┌────────▼────────┐
│  PostgreSQL DB  │
│  (Single Inst.) │
│   port 5432     │
└─────────────────┘
```

**Components:**

- **Frontend**: Next.js dev server (`npm run dev`)
- **Backend**: Single NestJS instance (`npm run start:dev`)
- **Database**: Single PostgreSQL instance (no replicas)
- **No load balancer**: Direct connection
- **No horizontal scaling**: Single point of failure

#### **Blockchain System (Proposed)**

```
┌─────────────────┐
│  Next.js        │
│  Frontend       │
│  port 3000      │
└────────┬────────┘
         │ HTTP
         │
┌────────▼────────────┐
│  NestJS Backend     │
│  + Ethers.js        │
│  port 3001          │
└────────┬────────────┘
         │ RPC (port 8545)
         │
┌────────▼─────────────────────────────────┐
│     Quorum Network (Docker Compose)      │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │Validator1│──│Validator2│──┐          │
│  │port 21001│  │port 21002│  │          │
│  └──────────┘  └──────────┘  │          │
│       │             │         │          │
│  ┌────┴────┐  ┌─────┴────┐ ┌─▼────────┐ │
│  │Validator3│──│Validator4│ │          │ │
│  │port 21003│  │port 21004│ │          │ │
│  └──────────┘  └──────────┘ └──────────┘ │
│                                          │
│  IBFT 2.0 Consensus (4 validators)       │
│  Block Time: ~5 seconds                  │
└──────────────────────────────────────────┘
```

**Components:**

- **Frontend**: Next.js dev server
- **Backend**: Single NestJS instance with Ethers.js library
- **Blockchain**: 4 Quorum validator nodes in Docker containers
  - `validator1` - `validator4` (IBFT consensus)
  - All validators run locally in `quorum-test-network/`
  - Backend connects to `validator1` RPC endpoint (port 8545)
- **No load balancer**: Direct RPC connection
- **No backend scaling**: Single instance

**Quorum Network Details:**

```yaml
# docker-compose.yml (simplified)
services:
  validator1:
    image: quorumengineering/quorum:latest
    ports: ["21001:8545"] # RPC endpoint
    networks: [quorum-dev-quickstart]

  validator2:
    image: quorumengineering/quorum:latest
    ports: ["21002:8545"]
    networks: [quorum-dev-quickstart]

  validator3:
    image: quorumengineering/quorum:latest
    ports: ["21003:8545"]
    networks: [quorum-dev-quickstart]

  validator4:
    image: quorumengineering/quorum:latest
    ports: ["21004:8545"]
    networks: [quorum-dev-quickstart]
```

### 8.2 Production-Ready Architecture (Not Implemented)

The current implementation is suitable for **development and testing** only. A production deployment would require:

#### **Centralized System - Production Considerations:**

```
                  ┌───────────────┐
                  │  Load Balancer│
                  │   (Nginx/HAProxy)
                  └───────┬───────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼────┐
    │  NestJS     │ │  NestJS   │ │  NestJS   │
    │  Instance 1 │ │ Instance 2│ │ Instance 3│
    └──────┬──────┘ └────┬──────┘ └────┬──────┘
           │             │             │
           └─────────────┼─────────────┘
                         │
                  ┌──────▼───────┐
                  │  PostgreSQL  │
                  │   Primary    │
                  │  (Master)    │
                  └──────┬───────┘
                         │ Replication
              ┌──────────┼──────────┐
              │                     │
       ┌──────▼───────┐      ┌──────▼───────┐
       │  PostgreSQL  │      │  PostgreSQL  │
       │  Read Replica│      │ Read Replica │
       │   (Slave 1)  │      │  (Slave 2)   │
       └──────────────┘      └──────────────┘
```

**Required Components:**

- Load balancer for horizontal scaling
- Multiple NestJS instances (PM2 or Kubernetes)
- PostgreSQL streaming replication
- Redis for session management
- Monitoring (Prometheus + Grafana)

#### **Blockchain System - Production Considerations:**

```
                  ┌───────────────┐
                  │  Load Balancer│
                  └───────┬───────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
    ┌──────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
    │  NestJS     │ │  NestJS   │ │  NestJS   │
    │  + Ethers.js│ │+ Ethers.js│ │+ Ethers.js│
    └──────┬──────┘ └────┬──────┘ └────┬──────┘
           │             │             │
           └─────────────┼─────────────┘
                         │ RPC (Multiple endpoints)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Quorum  │    │ Quorum  │    │ Quorum  │
    │  Node 1 │────│  Node 2 │────│  Node 3 │
    │(Validator)   │(Validator)   │(Validator)
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Tessera │    │ Tessera │    │ Tessera │
    │Privacy 1│    │Privacy 2│    │Privacy 3│
    └─────────┘    └─────────┘    └─────────┘
```

**Required Components:**

- Multiple RPC endpoints for redundancy
- Geographically distributed validator nodes
- Monitoring dashboard (Prometheus, Splunk, or Chainlens)
- Backup nodes (non-validator) for reading
- Private transaction manager (Tessera) - currently not used

### 8.3 Why Development Architecture is Sufficient for Thesis

The single-instance setup is appropriate for this research project because:

1. **Proof of Concept**: Demonstrates blockchain vs centralized comparison without production overhead
2. **Functional Equivalence**: Both systems have identical API surfaces for fair comparison
3. **Performance Baseline**: Single-instance measurements provide consistent benchmarks
4. **Resource Constraints**: Running multiple instances requires significant hardware
5. **Research Focus**: Thesis evaluates architectural patterns, not operational scalability

**Production deployment concerns** (load balancing, replication, failover) are **infrastructure concerns** separate from the core research question: _"How does blockchain architecture compare to centralized databases for certificate management?"_

---

## 9. Conclusion

This system demonstrates the practical implementation of both centralized and blockchain-based architectures for certificate management. The blockchain approach provides:

1. **Immutable Audit Trail**: Every certificate operation is permanently recorded
2. **Decentralized Trust**: No single authority can tamper with records
3. **Cryptographic Verification**: Digital signatures prove authenticity
4. **Transparency**: All participants can verify data integrity

However, it comes with trade-offs:

- Higher latency (~5s vs <50ms)
- More complex infrastructure
- Limited transaction throughput

The centralized system remains viable for scenarios where:

- Speed is critical
- Central authority is trusted
- Lower operational complexity is preferred

Both implementations maintain functional API equivalence, allowing direct comparison and evaluation of the fundamental architectural differences.
