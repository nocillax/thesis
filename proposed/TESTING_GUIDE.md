# API Testing Guide

**Base URL:** `http://localhost:3001`

**Default Admin:** `admin / admin123`

**Note:** Admin is DB-only (no blockchain account). Admin manages the system but doesn't issue certificates.

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

## 2. Get All Users (Database)

**Endpoint:** `GET /api/users`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
[
  {
    "id": "uuid",
    "username": "admin",
    "email": "admin@university.edu",
    "full_name": "System Administrator",
    "wallet_address": "0x0000000000000000000000000000000000000000",
    "is_admin": true
  },
  {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@university.edu",
    "full_name": "John Doe",
    "wallet_address": "0x1234...",
    "is_admin": false
  }
]
```

**Note:** Gets users from database (fast but can be tampered). Use blockchain endpoint for source of truth.

---

## 3. Get All Users (Blockchain)

**Endpoint:** `GET /api/users/blockchain`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
[
  {
    "wallet_address": "0x1234...",
    "username": "john_doe",
    "email": "john@university.edu",
    "is_authorized": true
  },
  {
    "wallet_address": "0x5678...",
    "username": "jane_smith",
    "email": "jane@university.edu",
    "is_authorized": false
  }
]
```

**Note:** Queries blockchain UserRegistry events. This is the source of truth - shows who can actually issue certificates. Admin is not included (DB-only, no blockchain account).

---

## 4. Register User

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

**Note:** User is automatically authorized to issue certificates on the blockchain upon registration.

---

## 5. Revoke User

**Endpoint:** `PATCH /api/users/:wallet_address/revoke`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `PATCH /api/users/0x1234.../revoke`

**Response:**

```json
{
  "success": true,
  "message": "User john_doe has been revoked and can no longer issue certificates",
  "wallet_address": "0x1234..."
}
```

**Note:** Removes authorization on blockchain (source of truth). Uses wallet address instead of UUID because blockchain is the authority.

---

## 6. Reactivate User

**Endpoint:** `PATCH /api/users/:wallet_address/reactivate`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `PATCH /api/users/0x1234.../reactivate`

**Response:**

```json
{
  "success": true,
  "message": "User john_doe has been reactivated and can now issue certificates",
  "wallet_address": "0x1234..."
}
```

**Note:** Re-authorizes user on blockchain. User can issue certificates again.

---

## 7. Get All Certificates

**Endpoint:** `GET /api/blockchain/certificates`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
[
  {
    "cert_hash": "0xabcd1234...",
    "student_id": "22-46734-1",
    "version": 1,
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
]
```

**Note:** Certificates are now versioned by student_id. Each student can have multiple versions (v1, v2, v3...).

---

## 8. Issue Certificate

**Endpoint:** `POST /api/blockchain/certificates`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body:**

```json
{
  "student_id": "22-46734-1",
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
  "student_id": "22-46734-1",
  "version": 1,
  "cert_hash": "0xabcd1234...",
  "transaction_hash": "0x5678efgh...",
  "block_number": 123,
  "signature": "0x9abc..."
}
```

**Important Notes:**

- **No certificate_number needed!** Student ID is the unique identifier
- **Automatic versioning:** First certificate = v1, second = v2, etc.
- **Must revoke active version first:** If student has an active certificate, you must revoke it before issuing a new version
- **Only one active version:** Only one version can be active at a time per student

---

## 9. Verify Certificate

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

## 10. Revoke Certificate

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

## 11. Reactivate Certificate

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

## 12. Get Audit Logs

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

## 13. Get User by Wallet Address (Blockchain Only)

**Endpoint:** `GET /api/blockchain/certificates/user/:wallet_address`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `GET /api/blockchain/certificates/user/0x1234...`

**Response:**

```json
{
  "wallet_address": "0x1234...",
  "username": "john_doe",
  "email": "john@university.edu",
  "registration_date": "2025-11-27T01:28:41.000Z",
  "is_authorized": true
}
```

**Note:** Returns ONLY blockchain data from UserRegistry. Pure source of truth.

---

## 14. Get User by Wallet Address (Database Only)

**Endpoint:** `GET /api/blockchain/certificates/user/:wallet_address/with-db`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `GET /api/blockchain/certificates/user/0x1234.../with-db`

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

**Note:** Returns ONLY database data for the user. No blockchain merging to avoid data conflicts.

---

## 15. Get Active Certificate by Student ID

**Endpoint:** `GET /api/blockchain/certificates/student/:student_id/active`

**Auth:** None (Public)

**Example:** `GET /api/blockchain/certificates/student/22-46734-1/active`

**Response:**

```json
{
  "cert_hash": "0xabcd1234...",
  "student_id": "22-46734-1",
  "version": 2,
  "student_name": "Alice Johnson",
  "degree_program": "Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "Tech University",
  "issuer": "0x08Bd40C733...",
  "issuer_name": "john_doe",
  "is_revoked": false,
  "signature": "0x9abc...",
  "issuance_date": "2025-11-27T01:28:41.000Z"
}
```

**Note:** Returns the currently active certificate for a student. Returns 404 if no active certificate exists.

---

## 16. Get All Certificate Versions by Student ID

**Endpoint:** `GET /api/blockchain/certificates/student/:student_id/versions`

**Auth:** None (Public)

**Example:** `GET /api/blockchain/certificates/student/22-46734-1/versions`

**Response:**

```json
[
  {
    "cert_hash": "0xabcd1234...",
    "student_id": "22-46734-1",
    "version": 1,
    "student_name": "Alice Johnson",
    "degree_program": "Computer Science",
    "cgpa": 3.5,
    "issuing_authority": "Tech University",
    "issuer": "0x08Bd40C733...",
    "issuer_name": "john_doe",
    "is_revoked": true,
    "signature": "0x9abc...",
    "issuance_date": "2025-11-20T01:28:41.000Z"
  },
  {
    "cert_hash": "0xefgh5678...",
    "student_id": "22-46734-1",
    "version": 2,
    "student_name": "Alice Johnson",
    "degree_program": "Computer Science",
    "cgpa": 3.85,
    "issuing_authority": "Tech University",
    "issuer": "0x08Bd40C733...",
    "issuer_name": "john_doe",
    "is_revoked": false,
    "signature": "0x1def...",
    "issuance_date": "2025-11-27T01:28:41.000Z"
  }
]
```

**Note:** Returns ALL certificate versions for a student, including revoked ones. Useful for audit trails and history tracking.

---

## Contract Addresses

```
CertificateRegistry: 0xc83003B2AD5C3EF3e93Cc3Ef0a48E84dc8DBD718
UserRegistry: 0x6aA8b700cD034Ab4B897B59447f268b33B8cF699
Admin Wallet: 0x0000000000000000000000000000000000000000 (Placeholder - admin is DB-only)
```

**Note:** Admin has no blockchain account. Only regular users (issuers) have blockchain wallets.
