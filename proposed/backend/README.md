# NXCertify Backend

NestJS REST API server for blockchain certificate management with cryptographic wallet authentication.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Quorum Blockchain

Make sure Quorum network is running:

```bash
cd ../quorum-test-network
./run.sh
```

### 3. Deploy Contracts & Seed Admin

```bash
cd ../blockchain
npm install
npx hardhat run scripts/seed-admin.js --network quorum
```

Copy the contract addresses from output.

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste contract addresses:

```env
# Blockchain
RPC_URL=http://localhost:8545
CHAIN_ID=1337
USER_REGISTRY_ADDRESS=<paste_UserRegistry_address>
CONTRACT_ADDRESS=<paste_CertificateRegistry_address>

# Admin Wallet (from seed-admin output)
ADMIN_WALLET_ADDRESS=<paste_admin_address>
ADMIN_PRIVATE_KEY=<paste_admin_private_key>

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=30m

# CORS
FRONTEND_URL=http://localhost:3000
```

### 5. Start Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server runs at **http://localhost:3001**

---

## API Overview

Base URL: `http://localhost:3001/api`

### Authentication

**Login (Public)**

```bash
POST /auth/wallet-login
{
  "walletAddress": "0x...",
  "message": "Login to Certificate System at 2025-12-07T10:30:00.000Z",
  "signature": "0x..."
}
```

### Users (Admin only)

**Register User**

```bash
POST /blockchain/users/register
Authorization: Bearer <jwt_token>
{
  "username": "john_doe",
  "email": "john@university.edu",
  "is_admin": false
}
```

**Get All Users**

```bash
GET /blockchain/users?page=1&limit=20&status=authorized
Authorization: Bearer <jwt_token>
```

**Revoke/Reactivate User**

```bash
PATCH /blockchain/users/:wallet_address/revoke
PATCH /blockchain/users/:wallet_address/reactivate
Authorization: Bearer <jwt_token>
```

**Grant/Revoke Admin**

```bash
PATCH /blockchain/users/:wallet_address/grant-admin
PATCH /blockchain/users/:wallet_address/revoke-admin
Authorization: Bearer <jwt_token>
```

### Certificates (Authorized users)

**Get All Certificates**

```bash
GET /blockchain/certificates?page=1&limit=20&status=active
Authorization: Bearer <jwt_token>
```

**Issue Certificate**

```bash
POST /blockchain/certificates
Authorization: Bearer <jwt_token>
{
  "student_id": "22-46734-1",
  "student_name": "Alice Johnson",
  "degree_program": "Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "Tech University"
}
```

**Verify Certificate (Public)**

```bash
GET /blockchain/certificates/verify/:cert_hash
```

**Revoke/Reactivate Certificate**

```bash
PATCH /blockchain/certificates/:cert_hash/revoke
PATCH /blockchain/certificates/:cert_hash/reactivate
Authorization: Bearer <jwt_token>
```

**Get Student Certificates**

```bash
GET /blockchain/certificates/student/:student_id/active
GET /blockchain/certificates/student/:student_id/versions
Authorization: Bearer <jwt_token>
```

### Audit Logs

**System Logs**

```bash
GET /blockchain/certificates/audit-logs?page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Certificate Logs**

```bash
GET /blockchain/certificates/audit-logs?cert_hash=0x...
Authorization: Bearer <jwt_token>
```

**User Logs**

```bash
GET /blockchain/certificates/audit-logs/user/:wallet_address
Authorization: Bearer <jwt_token>
```

### Search

**Universal Search**

```bash
GET /blockchain/search?q=22-467
Authorization: Bearer <jwt_token>
```

Searches across student IDs, certificate hashes, and wallet addresses.

---

## Response Format

**Success (Single Item)**

```json
{
  "success": true,
  "data": {...}
}
```

**Success (Paginated)**

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 95,
    "has_more": true
  }
}
```

**Error**

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## Complete API Documentation

See [../TESTING_GUIDE.md](../TESTING_GUIDE.md) for:

- Detailed request/response examples
- Authentication flow
- All query parameters
- Error codes
- Blockchain architecture
