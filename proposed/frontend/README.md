# NXCertify Frontend

Next.js web application for blockchain certificate management with wallet-based authentication.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CHAIN_ID=1337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

### 3. Start Development Server

```bash
npm run dev
```

Application runs at **http://localhost:3000**

### 4. Production Build

```bash
npm run build
npm start
```

---

## Wallet Setup

### Install Wallet Extension

Install **MetaMask** or **Rabby** browser extension.

### Add Custom Network

**Network Name**: Quorum Local  
**RPC URL**: `http://localhost:8545`  
**Chain ID**: `1337`  
**Currency Symbol**: `ETH`

### Import Admin Wallet

1. Get private key from `blockchain/scripts/seed-admin.js` output
2. In wallet: Add Account → Import Private Key
3. Paste private key

---

## Features

### Public Pages

- **Landing** (`/`) - Hero, features, verify certificates
- **Verify** (`/verify`) - Public certificate verification
- **Login** (`/login`) - Wallet connection and signature

### Authenticated Pages

- **Dashboard** (`/dashboard`) - Overview and quick actions
- **Certificates** (`/certificates`) - List, filter, bulk actions
- **Issue Certificate** (`/certificates/issue`) - Form to issue new certificates
- **Certificate Detail** (`/certificates/[hash]`) - View and manage certificate
- **Student Versions** (`/certificates/student/[id]`) - All versions for a student

### Admin-Only Pages

- **Users** (`/users`) - List users, bulk actions
- **Register User** (`/users/register`) - Create new user accounts
- **User Profile** (`/users/[address]`) - View user and activity history
- **System Audit** (`/audit-logs/system`) - All certificate actions
- **Certificate Audit** (`/audit-logs/certificate/[hash]`) - Certificate history

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State**: Zustand (auth), TanStack Query (server state)
- **Blockchain**: ethers.js v6
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Notifications**: Sonner

---

## Project Structure

```
app/                    # Pages (Next.js App Router)
components/
  ├── audit/           # Audit log tables
  ├── auth/            # Wallet connect components
  ├── certificates/    # Certificate forms and tables
  ├── common/          # Shared components
  ├── layout/          # Header, footer
  ├── ui/              # shadcn/ui components
  └── users/           # User management components
lib/
  ├── api/             # API client (axios)
  ├── blockchain/      # Wallet connection (ethers.js)
  ├── hooks/           # React Query hooks
  └── utils/           # Helper functions
stores/
  └── authStore.ts     # Zustand auth store
types/                 # TypeScript types
```

---

## Development

### Run Linter

```bash
npm run lint
```

### Type Check

```bash
npm run type-check
```

### Format Code

```bash
npm run format
```

---

## Troubleshooting

**Wallet connection fails**

- Ensure MetaMask/Rabby is installed
- Check custom network is added (Chain ID 1337)
- Verify Quorum blockchain is running

**API calls fail**

- Verify backend is running at http://localhost:3001
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Inspect browser console for errors

**Login signature rejected**

- Ensure wallet is connected to correct network (Chain ID 1337)
- Check wallet account is registered in the system
- Verify account is authorized (not revoked)
