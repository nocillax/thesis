# Traditional Certificate Management System (Control System)

Centralized certificate issuance and verification using PostgreSQL with database audit logging.

---

## Prerequisites

- **Docker** (for PostgreSQL container)
- **Node.js** >= 18
- **npm** or yarn

---

## Quick Setup

### Step 1: Setup Database

```bash
cd control
./setup-db.sh
```

This script will:

1. ✅ Start PostgreSQL container in Docker
2. ✅ Create database `cert_control_db`
3. ✅ Display database credentials

**Expected Output:**

```
✨ Database Setup Complete!

📊 Database Configuration:
   Host: localhost
   Port: 5432
   Database: cert_control_db
   Username: nocillax
   Password: 2272

🚀 Next Steps:
   1. cd backend
   2. npm install
   3. npm run start:dev
```

### Step 2: Verify Configuration

Check that `backend/.env` has the correct database credentials:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=nocillax
DB_PASSWORD=2272
DB_NAME=cert_control_db

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

PORT=8000
```

### Step 3: Start Backend

```bash
cd backend
npm install
npm run start:dev
```

On first start, the backend will:

- ✅ Create all database tables automatically (TypeORM sync)
- ✅ Seed admin user: `admin` / `admin123`

**Expected Output:**

```
✅ Initial Admin seeded: admin / admin123
Control System Backend running on http://localhost:8000
```

**API Base URL:** `http://localhost:8000`

**Default Admin:**

- Username: `admin`
- Password: `admin123`

---

## Database Management

**Stop database (keeps data):**

```bash
./stop-db.sh
```

**Remove database (deletes all data):**

```bash
./remove-db.sh
```

**Restart database:**

```bash
./setup-db.sh
```

---

## API Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete API documentation and testing instructions.

**Quick Test:**

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response: { "access_token": "..." }
```

---

## Project Structure

```
control/
├── docker-compose.yml      # PostgreSQL container config
├── setup-db.sh            # One-command setup script
├── stop-db.sh             # Stop database
├── remove-db.sh           # Remove database
├── TESTING_GUIDE.md       # API documentation
└── backend/
    ├── .env               # Your local config (not in git)
    ├── .env.example       # Template config
    ├── src/
    │   ├── auth/          # Authentication & JWT
    │   ├── users/         # User management
    │   └── certificates/  # Certificate CRUD + audit logs
    └── package.json
```

---

## Key Features

- **PostgreSQL in Docker**: No local PostgreSQL installation needed
- **Auto-seeded Admin**: Ready to use immediately (admin/admin123)
- **JWT Authentication**: Standard token-based auth
- **Database Audit Logs**: Before/after values tracked automatically
- **Role-Based Access**: Admin and issuer roles
- **Fast Operations**: ~10-50ms response times

---

## Configuration

If you need to change defaults, edit `backend/.env`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=nocillax
DB_PASSWORD=2272
DB_NAME=cert_control_db

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

PORT=8000
```

Then restart:

```bash
./stop-db.sh
./setup-db.sh
```

---

## What's Not in Git

- `node_modules/` - NPM dependencies
- `dist/` - Build outputs
- `.env` - Your local environment config
- Docker volumes - Database data

Only source code, configs, and `.env.example` are tracked in git.
