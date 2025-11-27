# API Testing Guide

**Base URL:** `http://localhost:3001`

**Default Admin:** `admin / admin123`

---

## Important Notes

### Private Key Storage

- **Database:** Stores encrypted private key (AES-256-CTR) for each user
- **Blockchain:** NEVER stores private keys (that would be a security disaster!)
- **Purpose:** Backend decrypts the key to sign transactions with user's unique wallet
- **Security:** Each user has their own wallet, certificates show who issued them

### Error Codes

- **404 Not Found:** Certificate doesn't exist
- **401 Unauthorized:** Missing or invalid JWT token
- **403 Forbidden:** Admin privileges required
- **400 Bad Request:** Invalid data or transaction failed

---

## 1. Login

**Endpoint:** `POST /api/auth/login`

**Auth:** None

**Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Register User

**Endpoint:** `POST /api/users/register`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body:**

```json
{
  "username": "john_doe",
  "password": "password123",
  "email": "john@university.edu",
  "full_name": "John Doe",
  "is_admin": false
}
```

**Response:**

```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "john@university.edu",
  "full_name": "John Doe",
  "wallet_address": "0x1234...",
  "is_admin": false
}
```

---

## 3. Issue Certificate

**Endpoint:** `POST /api/blockchain/certificates`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body:**

```json
{
  "certificate_number": "CERT-2025-001",
  "student_id": "STU-001",
  "student_name": "Alice Johnson",
  "degree_program": "Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "Tech University"
}
```

**Response:**

```json
{
  "success": true,
  "certificate_number": "CERT-2025-001",
  "cert_hash": "0xabcd1234...",
  "transaction_hash": "0x5678efgh...",
  "block_number": 123,
  "signature": "0x9abc..."
}
```

---

## 4. Verify Certificate

**Endpoint:** `GET /api/blockchain/certificates/verify/:cert_hash`

**Auth:** None (Public)

**Example:** `GET /api/blockchain/certificates/verify/0xabcd1234...`

**Response:**

```json
{
  "cert_hash": "0xabcd1234...",
  "certificate_number": "CERT-2025-001",
  "student_id": "STU-001",
  "student_name": "Alice Johnson",
  "degree_program": "Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "Tech University",
  "issuer": "0x08Bd40C733...",
  "issuer_name": "admin",
  "is_revoked": false,
  "signature": "0x9abc...",
  "issuance_date": "2025-11-27T01:28:41.000Z"
}
```

---

## 5. Revoke Certificate

**Endpoint:** `PATCH /api/blockchain/certificates/:cert_hash/revoke`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `PATCH /api/blockchain/certificates/0xabcd1234.../revoke`

**Response:**

```json
{
  "success": true,
  "cert_hash": "0xabcd1234...",
  "transaction_hash": "0x1111...",
  "block_number": 124
}
```

---

## 6. Reactivate Certificate

**Endpoint:** `PATCH /api/blockchain/certificates/:cert_hash/reactivate`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `PATCH /api/blockchain/certificates/0xabcd1234.../reactivate`

**Response:**

```json
{
  "success": true,
  "cert_hash": "0xabcd1234...",
  "transaction_hash": "0x2222...",
  "block_number": 125
}
```

---

## 7. Get Audit Logs

**Endpoint:** `GET /api/blockchain/certificates/audit-logs?cert_hash=:cert_hash`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `GET /api/blockchain/certificates/audit-logs?cert_hash=0xabcd1234...`

**Response:**

```json
[
  {
    "action": "ISSUED",
    "cert_hash": "0xabcd1234...",
    "issuer": "0x08Bd40C733...",
    "block_number": 123,
    "transaction_hash": "0x5678..."
  },
  {
    "action": "REVOKED",
    "cert_hash": "0xabcd1234...",
    "revoked_by": "0x08Bd40C733...",
    "block_number": 124,
    "transaction_hash": "0x1111..."
  },
  {
    "action": "REACTIVATED",
    "cert_hash": "0xabcd1234...",
    "reactivated_by": "0x08Bd40C733...",
    "block_number": 125,
    "transaction_hash": "0x2222..."
  }
]
```

---

## 8. Get User by Wallet Address

**Endpoint:** `GET /api/blockchain/certificates/user/:wallet_address`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `GET /api/blockchain/certificates/user/0x08Bd40C733...`

**Response:**

```json
{
  "wallet_address": "0x08Bd40C733...",
  "username": "admin",
  "email": "admin@university.edu",
  "registration_date": "2025-11-27T01:28:41.000Z",
  "is_active": true
}
```

---

## Contract Addresses

```
CertificateRegistry: 0x4261D524bc701dA4AC49339e5F8b299977045eA5
UserRegistry: 0xC9Bc439c8723c5c6fdbBE14E5fF3a1224f8A0f7C
Admin Wallet: 0x08Bd40C733bC5fA1eDD5ae391d2FAC32A42910E2
```
