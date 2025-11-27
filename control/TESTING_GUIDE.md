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

### 2. Create User

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
  "is_admin": false
}
```

---

### 3. Issue Certificate

**Endpoint:** `POST /api/certificates`

**Auth:** JWT Required

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body:**

```json
{
  "certificate_number": "BRAC-CSE-2024-001",
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
  "certificate_number": "BRAC-CSE-2024-001",
  "issuance_date": "2024-11-27T10:30:00.000Z"
}
```

---

### 4. Get Certificate

**Endpoint:** `GET /api/certificates/:id`

**Auth:** None (Public)

**Response:**

```json
{
  "id": "uuid",
  "certificate_number": "BRAC-CSE-2024-001",
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

### 5. Update Certificate

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

### 6. Revoke Certificate

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

### 7. Reactivate Certificate

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

### 8. Get Audit Logs

**Endpoint:** `GET /api/certificates/audit-logs?certificate_id=:id`

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
    "details": { "certificate_number": "BRAC-CSE-2024-001" },
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
  c.certificate_number,
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
