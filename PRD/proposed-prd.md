# PRD – Blockchain Certificate Verification System (Experimental System)

## 1. Project Summary

Build a permissioned blockchain-based certificate issuance + verification system using Quorum (IBFT), smart contracts, and a NestJS backend.

Backend: NestJS + Ethers.js  
Chain: 4-node Quorum  
Contract: Solidity (CertificateRegistry.sol)  
Frontend: Next.js + Tailwind + shadcn

## 2. Core Features (Backend)

### 2.1 Certificate Issuance (on-chain)

- POST /api/blockchain/certificates
- Auth required (JWT)
- Backend tasks:
  - Compute SHA-256 or keccak256 hash of certificate data
  - Sign hash with private key
  - Call contract.issueCertificate()
  - Return certHash + transactionHash

### 2.2 Certificate Verification

- GET /api/blockchain/certificates/:hash
- No auth
- Reads smart contract state
- Returns:
  - certificate data
  - issuer address
  - isRevoked flag
  - cryptographic signature

### 2.3 Certificate Revocation

- PATCH /api/blockchain/certificates/:hash/revoke
- Auth required
- Calls contract.revokeCertificate()

### 2.4 Blockchain Service Layer

- ethers.js provider configuration
- Contract wrapper
- Utility functions: signCertificate(), computeHash()

---

## 3. Smart Contract Requirements

### 3.1 Contract: CertificateRegistry.sol

Functions:

- issueCertificate(bytes32, string, string, uint8, bytes)
- verifyCertificate(bytes32)
- revokeCertificate(bytes32)

Storage:

- mapping(bytes32 → Certificate struct)

Events:

- CertificateIssued(certHash, issuer)
- CertificateRevoked(certHash)

Rules:

- Only authorized issuers can issue/revoke
- ECDSA signature stored on chain

### 3.2 Design Principles

- No inheritance
- No custom modifiers except onlyAuthorized
- Keep structs small
- No dynamic arrays for storage
- Use bytes32 hash as primary key

---

## 4. Frontend Requirements (Next.js)

### 4.1 Pages

- /issue (blockchain)
- /verify (blockchain)
- /revoke (blockchain)

### 4.2 UI Guidelines

- Clean card-based layout
- Display:
  - certHash
  - blockchain txHash
  - signature preview
  - issuer address
  - revoked status
- Use consistent components from centralized system UI

### 4.3 Blockchain Feedback

- Loading states (“finalizing block…”)
- Success card with txn details
- Error alerts with readable messages

---

## 5. Non-Functional Requirements

- Verification time < 150ms
- Transaction finality < 5–15 seconds (IBFT)
- Smart contract must be deterministic and simple
- Node configuration must support:
  - 4 nodes (3 validators + 1 observer)
  - 5s block time

---

## 6. Out of Scope

- No NFT-style certificates
- No on-chain storage of PDFs
- No decentralized identity (DID)
- No secondary smart contracts
