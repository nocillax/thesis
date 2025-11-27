# Traditional Certificate Management System (Control System)

Centralized certificate issuance and verification using PostgreSQL with database audit logging.

---

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/thesis.git
cd thesis/control
```

### 2. Setup Backend

```bash
cd backend
npm install

# Create database
createdb control_certificates

# Create .env file
cp .env.example .env
# Edit .env with:
# - Database credentials
# - JWT secret
# - Server port (3000)
```

### 3. Start Backend

```bash
npm run start:dev
```

**Expected Output:**

```
✅ Initial Admin seeded: admin / admin123
Listening on port 3000
```

---

## What Gets Auto-Generated (Not in Git)

- `node_modules/` - NPM dependencies
- `dist/` - Build outputs

**Only source code, configs, and .env.example are in git.**

---

## Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete API testing instructions.

---

## Key Features

- **Centralized Database**: All data in PostgreSQL
- **JWT Authentication**: Standard token-based auth
- **Database Audit Logs**: Before/after values in audit_logs table
- **Role-Based Access**: Admin and issuer roles
- **Fast Operations**: No blockchain overhead (~10-50ms)

---

## Troubleshooting

**Database connection failed:**

```bash
# Verify PostgreSQL running
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l | grep control_certificates

# Verify credentials in .env
cat .env
```

**Admin not seeded:**

```bash
# Check logs for errors
npm run start:dev

# Manually check users table
psql -U postgres -d control_certificates
SELECT * FROM users WHERE username = 'admin';
```

---

## Comparison with Proposed System

See [../proposed/](../proposed/) for blockchain-based implementation.

| Feature       | Control (This)             | Proposed                  |
| ------------- | -------------------------- | ------------------------- |
| Storage       | PostgreSQL only            | Blockchain + PostgreSQL   |
| Immutability  | Mutable (admin can change) | Immutable after consensus |
| Trust         | Trust server/admin         | Cryptography + consensus  |
| Verification  | Query API (trust backend)  | Cryptographic proof       |
| Issuance Time | ~10-50ms (database insert) | ~1-2 seconds (consensus)  |
| Complexity    | Simple (REST API)          | Complex (blockchain)      |
