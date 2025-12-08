# Control System Testing Guide

**Base URL:** `http://localhost:3000`

**Default Admin:** `admin / admin123`

---

## Setup

### 1. Environment Variables

Create `.env` in `control/backend/`:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=control_certificates

# JWT
JWT_SECRET=control_system_secret_key_change_in_production
JWT_EXPIRY=24h

# Server
PORT=3000
```

### 2. Database Setup

```bash
psql -U postgres
CREATE DATABASE control_certificates;
\q
```

### 3. Install and Start

```bash
cd control/backend
npm install
npm run start:dev
```

**Expected Output:**

```
✅ Initial Admin seeded: admin / admin123
Listening on port 3000
```

---

## API Endpoints

### 1. Login

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

### 2. Get All Users

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
    "is_admin": true,
    "is_authorized": true
  },
  {
    "id": "uuid",
    "username": "alice_issuer",
    "email": "alice@bracu.edu.bd",
    "full_name": "Alice Johnson",
    "is_admin": false,
    "is_authorized": true
  }
]
```

---

### 3. Get User by ID

**Endpoint:** `GET /api/users/:id`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "id": "uuid",
  "username": "alice_issuer",
  "email": "alice@bracu.edu.bd",
  "full_name": "Alice Johnson",
  "is_admin": false,
  "is_authorized": true
}
```

---

### 4. Create User

**Endpoint:** `POST /api/users`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body:**

```json
{
  "username": "alice_issuer",
  "email": "alice@bracu.edu.bd",
  "full_name": "Alice Johnson",
  "password": "alice123",
  "isAdmin": false
}
```

**Response:**

```json
{
  "id": "uuid",
  "username": "alice_issuer",
  "email": "alice@bracu.edu.bd",
  "full_name": "Alice Johnson",
  "is_admin": false,
  "is_authorized": true
}
```

---

### 5. Revoke User

**Endpoint:** `PATCH /api/users/:id/revoke`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "User revoked successfully"
}
```

---

### 6. Reactivate User

**Endpoint:** `PATCH /api/users/:id/reactivate`

**Auth:** Admin JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
8

```json
{
  "success": true,
  "message": "User reactivated successfully"
}
```

---

### 7. Get All Certificates

**Endpoint:** `GET /api/certificates`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
[
  {
    "id": "uuid",
    "student_id": "STU-001",
    "student_name": "John Doe",
    "degree_program": "Computer Science",
    "cgpa": 3.85,
    "issuing_authority": "BRAC University",
    "is_revoked": false,
    "issuance_date": "2025-11-27T12:00:00Z",
    "issuer": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@university.edu"
    }
  }
]
```

---

### 5. Issue Certificate

**Endpoint:** `POST /api/certificates`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body:**

```json
{
  "student_id": "20101001",
  "student_name": "Bob Smith",
  "degree_program": "BSc in Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "BRAC University"
}
```

**Response:**

```json
{
  "certificate_id": "uuid",
  "student_id": "20101001",
  "issuance_date": "2024-11-27T10:30:00.000Z"
}
```

---

### 9. Verify Certificate by Student ID

**Endpoint:** `GET /api/certificates/verify/:student_id`

**Auth:** None (Public)

**Note:** Returns 404 if certificate is revoked or not found

**Response:**

```json
{
  "id": "uuid",
  "student_id": "20101001",
  "student_name": "Bob Smith",
  "degree_program": "BSc in Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "BRAC University",
  "issuer_id": "uuid",
  "issuance_date": "2024-11-27T10:30:00.000Z",
  "is_revoked": false
}
```

---

### 10. Get Certificate by ID

**Endpoint:** `GET /api/certificates/:id`

**Auth:** JWT Required (Internal Use)

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Note:** Shows certificate regardless of revocation status

**Response:**

```json
{
  "id": "uuid",
  "student_id": "20101001",
  "student_name": "Bob Smith",
  "degree_program": "BSc in Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "BRAC University",
  "issuer_id": "uuid",
  "issuance_date": "2024-11-27T10:30:00.000Z",
  "is_revoked": false
}
```

---

### 11. Update Certificate

**Endpoint:** `PATCH /api/certificates/:id`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body:**

```json
{
  "cgpa": 3.9
}
```

**Response:**

```json
{
  "success": true,
  "message": "Certificate updated successfully",
  "certificate": { "id": "uuid", "cgpa": 3.9 }
}
```

---

### 12. Revoke Certificate

**Endpoint:** `PATCH /api/certificates/:id/revoke`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Certificate revoked successfully"
}
```

---

### 13. Reactivate Certificate

**Endpoint:** `PATCH /api/certificates/:id/reactivate`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Certificate reactivated successfully"
}
```

---

### 14. Get Audit Logs

**Endpoint:** `GET /api/certificates/audit-logs`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters:**

- `certificate_id` (optional): Filter logs for specific certificate

**Response:**

```json
[
  {
    "action": "INSERT",
    "certificate_id": "uuid",
    "details": { "student_id": "20101001", "student_name": "Bob Smith" },
    "performed_by": "uuid",
    "timestamp": "2024-11-27T10:30:00.000Z"
  },
  {
    "action": "REVOKE",
    "certificate_id": "uuid",
    "details": { "is_revoked": { "before": false, "after": true } },
    "performed_by": "uuid",
    "timestamp": "2024-11-27T11:00:00.000Z"
  }
]
```

---

### 15. Get System-Wide Audit Logs

**Endpoint:** `GET /api/audit-logs`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
[
  {
    "action": "INSERT",
    "certificate_id": "uuid",
    "details": { "student_id": "20101001", "student_name": "Bob Smith" },
    "performed_by": "uuid",
    "timestamp": "2024-11-27T10:30:00.000Z"
  },
  {
    "action": "REVOKE",
    "certificate_id": "uuid",
    "details": { "is_revoked": { "before": false, "after": true } },
    "performed_by": "uuid",
    "timestamp": "2024-11-27T11:00:00.000Z"
  }
]
```

---

### 16. Get Certificate-Specific Audit Logs

**Endpoint:** `GET /api/audit-logs/certificate/:id`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
[
  {
    "action": "INSERT",
    "certificate_id": "uuid",
    "details": { "student_id": "20101001", "student_name": "Bob Smith" },
    "performed_by": "uuid",
    "timestamp": "2024-11-27T10:30:00.000Z"
  },
  {
    "action": "REVOKE",
    "certificate_id": "uuid",
    "details": { "is_revoked": { "before": false, "after": true } },
    "performed_by": "uuid",
    "timestamp": "2024-11-27T11:00:00.000Z"
  }
]
```

---

## Database Queries

**Connect:**

```bash
psql -U postgres -d control_certificates
```

**View certificates with issuer:**

```sql
SELECT
  c.student_id,
  c.student_name,
  u.username as issued_by,
  c.is_revoked
FROM certificates c
JOIN users u ON c.issuer_id = u.id;
```

**View audit trail:**

```sql
SELECT
  a.action,
  u.username as performed_by,
  a.timestamp
FROM audit_logs a
JOIN users u ON a.performed_by = u.id
WHERE a.certificate_id = '<uuid>'
ORDER BY a.timestamp DESC;
```

---

## Key Differences vs Proposed System

| Feature           | Control System             | Proposed System                |
| ----------------- | -------------------------- | ------------------------------ |
| **Storage**       | PostgreSQL only            | Blockchain + PostgreSQL        |
| **Immutability**  | Mutable (admin can change) | Immutable after consensus      |
| **Audit Trail**   | Database (can be edited)   | Blockchain (permanent)         |
| **Trust**         | Trust server/admin         | Trust cryptography + consensus |
| **Verification**  | Query API (trust backend)  | Cryptographic proof            |
| **Issuance Time** | ~10-50ms (database insert) | ~1-2 seconds (blockchain)      |
| **Scalability**   | High (database scales)     | Lower (blockchain limits)      |
| **Complexity**    | Simple (standard REST API) | Complex (blockchain + backend) |
| **Uniqueness**    | One cert per student_id    | One cert per student_id        |
