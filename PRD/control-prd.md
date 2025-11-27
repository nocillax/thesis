# PRD – Centralized Certificate Verification System (Control System)

## 1. Project Summary

Build a simple, secure, and production-quality centralized certificate issuance + verification system. This system acts as the baseline for comparing with blockchain.

Backend: NestJS + PostgreSQL  
Frontend: Next.js + Tailwind + shadcn UI  
Auth: JWT  
ORM: TypeORM

## 2. Core Features (Backend)

### 2.1 Certificate Issuance API

- POST /api/certificates
- Auth required (JWT)
- Input: student_name, degree_program, cgpa, issuing_authority
- Output: certificate_id (UUID), issuance_date

### 2.2 Certificate Verification API

- GET /api/certificates/:id
- No auth
- Output: full certificate info OR 404

### 2.3 Certificate Update API

- PATCH /api/certificates/:id
- Auth required (JWT)
- Updates certificate fields (student_name, degree_program, cgpa, issuing_authority)
- Cannot update revoked certificates
- Logs changes to audit_logs (delta tracking)

### 2.4 Certificate Revocation API

- PATCH /api/certificates/:id/revoke
- Auth required (JWT)
- Marks certificate as revoked
- Cannot revoke already revoked certificates

### 2.5 Certificate Reactivation API

- PATCH /api/certificates/:id/reactivate
- Auth required (JWT)
- Reactivates a revoked certificate
- Cannot reactivate non-revoked certificates

### 2.6 Audit Logs API

- GET /api/certificates/audit-logs?certificate_id=:id
- Auth required (JWT)
- Returns audit trail for all certificates or specific certificate
- Ordered by timestamp (DESC)
- Logs actions: INSERT, UPDATE, REVOKE, REACTIVATE

### 2.7 Authentication

- POST /api/auth/login
- JWT-based
- Returns: { success: true, access_token: "..." }

### 2.8 Database

Tables:

1. certificates
2. audit_logs
3. users

All tables use **snake_case** for column names.

Indexes:

- PK on certificate_id
- Composite index: (student_name, degree_program)

Audit Log Strategy:

- INSERT: Full certificate snapshot (excluding ID)
- UPDATE: Delta tracking (before/after for changed fields only)
- REVOKE/REACTIVATE: Only is_revoked status change
- No certificate_id duplication in details (already in certificate_id column)

### 2.9 Architecture Guidelines

- Controllers → Services → Repository pattern
- Minimal DTO validation
- Use TypeORM entities with snake_case columns
- Use PostgreSQL JSONB for optimized audit deltas
- Error handling through NestJS filters
- ConfigService for environment variables (JWT_SECRET, DB credentials)

---

## 3. Core Features (Frontend)

### 3.1 Pages

- /login
- /issue-certificate
- /verify-certificate
- /update-certificate
- /revoke-certificate
- /reactivate-certificate
- /audit-logs
- /dashboard (optional)

### 3.2 UI Guidelines

- Minimalist UI using Tailwind + shadcn
- Consistent spacing, 1–2 accent colors
- Success/error states with toast notifications
- Forms with floating labels and inline validation

### 3.3 UX Flow

Issuance → Confirmation → Option to copy UUID  
Verification → Result card (valid/revoked/not found)  
Update → Confirmation → Show changes made  
Revoke/Reactivate → Confirmation → Updated status display  
Audit Logs → Filterable list → Timeline view of certificate actions

---

## 4. Non-Functional Requirements

- Response time < 50ms for GET verification
- Secure password hashing using bcrypt
- Proper role-based access (admin vs public)
- Database must be seedable with initial admin user

---

## 5. Out of Scope

- No multi-tenancy
- No complex admin dashboard
- No analytics
- No file uploads
