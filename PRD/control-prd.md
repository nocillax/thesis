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

### 2.3 Certificate Revocation API

- PATCH /api/certificates/:id/revoke
- Auth required
- Marks certificate as revoked

### 2.4 Authentication

- POST /api/auth/login
- JWT-based

### 2.5 Database

Tables:

1. certificates
2. audit_logs
3. users

Indexes:

- PK on certificate_id
- Composite index: (student_name, degree_program)

Triggers:

- Log INSERT/UPDATE/DELETE into audit_logs

### 2.6 Architecture Guidelines

- Controllers → Services → Repository pattern
- Minimal DTO validation
- Use TypeORM entities
- Use PostgreSQL JSONB for audit snapshots
- Error handling through NestJS filters

---

## 3. Core Features (Frontend)

### 3.1 Pages

- /login
- /issue-certificate
- /verify-certificate
- /revoke-certificate
- /dashboard (optional)

### 3.2 UI Guidelines

- Minimalist UI using Tailwind + shadcn
- Consistent spacing, 1–2 accent colors
- Success/error states with toast notifications
- Forms with floating labels and inline validation

### 3.3 UX Flow

Issuance → Confirmation → Option to copy UUID  
Verification → Result card (valid/revoked/not found)

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
