# Traditional Certificate Management System (Control System)

Centralized certificate management using PostgreSQL.

---

## Prerequisites

- **Docker**
- **Node.js** >= 18
- **npm**

---

## Setup

### 1. Configure Database (Optional)

Edit `backend/.env` if you want custom credentials. Otherwise, defaults will be used.

**Defaults:**
- Username: `nocillax`
- Password: `2272`
- Database: `cert_control_db`
- Port: `5433`

### 2. Run Setup Script

```bash
cd control
./setup-db.sh
```

This creates PostgreSQL container and database.

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start Backend

```bash
npm run start:dev
```

On first start, tables and admin user are created automatically.

**API:** `http://localhost:8000`

**Admin:** `admin` / `admin123`

---

## Database Management

**Stop database:**
```bash
./stop-db.sh
```

**Remove database:**
```bash
./remove-db.sh
```

---

## View Database (GUI)

Use **pgAdmin**, **DBeaver**, or **TablePlus**:

**Connection details:**
- Host: `localhost`
- Port: `5433`
- Database: `cert_control_db`
- Username: `nocillax`
- Password: `2272`

**pgAdmin Setup:**
1. Right-click "Servers" → Register → Server
2. General tab: Name = "Control System"
3. Connection tab: Fill in details above
4. Save

**DBeaver Setup:**
1. New Database Connection → PostgreSQL
2. Host: `localhost`, Port: `5433`
3. Database: `cert_control_db`
4. Username: `nocillax`, Password: `2272`
5. Test Connection → Finish

---

## API Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for all endpoints and examples.
