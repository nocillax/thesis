# NXCertify - Blockchain Certificate Management System

Decentralized academic certificate issuance and verification platform using Ethereum blockchain with cryptographic wallet authentication.

## Overview

**NXCertify** is a blockchain-based certificate management system that eliminates centralized trust by storing certificate records on an immutable blockchain. Users authenticate using cryptographic wallet signatures instead of passwords, and all certificate operations are permanently recorded on-chain for transparency and verification.

### Use Cases

- **Universities**: Issue tamper-proof digital academic certificates
- **Employers**: Instantly verify candidate credentials without contacting institutions
- **Students**: Own and share verifiable certificates without intermediaries
- **Government**: Audit academic credential issuance transparently

### Tech Stack

**Frontend**: Next.js 14, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Zustand, ethers.js  
**Backend**: NestJS, TypeScript, ethers.js  
**Blockchain**: Ethereum (Quorum), Solidity smart contracts, IBFT 2.0 consensus  
**Authentication**: Wallet signatures (no passwords), JWT tokens

---

## Quick Start

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- Git

### 1. Start Quorum Blockchain Network

```bash
cd quorum-test-network
./run.sh

# Wait 30 seconds for initialization
# Verify: docker ps should show 4 running nodes
```

### 2. Deploy Smart Contracts & Seed Admin

```bash
cd blockchain
npm install
npx hardhat run scripts/seed-admin.js --network quorum

# Copy contract addresses from output
```

### 3. Start Backend

```bash
cd backend
npm install
cp .env.example .env

# Edit .env and paste contract addresses
npm run start:dev

# Backend running at http://localhost:3001
```

### 4. Start Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local

# Edit .env.local with backend URL
npm run dev

# Frontend running at http://localhost:3000
```

### 5. Login as Admin

**Default Admin Wallet**: `0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73`  
**Private Key**: Get from `seed-admin.js` output

1. Import private key to MetaMask/Rabby wallet
2. Go to http://localhost:3000/login
3. Connect wallet and sign login message

---

## Project Structure

```
proposed/
├── blockchain/          # Smart contracts & deployment scripts
├── backend/            # NestJS API server
├── frontend/           # Next.js web application
├── quorum-test-network/ # Ethereum blockchain network
└── TESTING_GUIDE.md    # Complete API documentation
```

---

## Key Features

- **No Passwords**: Cryptographic wallet signature authentication
- **No Database**: User data stored on blockchain (username, email, roles)
- **Immutable Records**: Certificates cannot be altered after issuance
- **Version Control**: Track certificate revisions per student
- **Public Verification**: Anyone can verify certificates without authentication
- **Role-Based Access**: Admin and regular user permissions enforced on-chain
- **Audit Trail**: Complete blockchain history of all certificate actions

---

## Documentation

- [Backend Setup](./backend/README.md) - Detailed backend installation
- [Frontend Setup](./frontend/README.md) - Detailed frontend installation
- [API Documentation](./TESTING_GUIDE.md) - Complete API reference with examples

---

## Troubleshooting

**Blockchain not responding:**

```bash
cd quorum-test-network
./stop.sh && ./run.sh
```

**Backend connection error:**

```bash
# Verify contract addresses in backend/.env
# Check Quorum running: curl http://localhost:8545
```

**Frontend wallet connection fails:**

```bash
# Install MetaMask/Rabby wallet extension
# Add custom network: RPC http://localhost:8545, Chain ID 1337
```
