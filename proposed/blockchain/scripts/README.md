# Deployment Scripts

## Development (Quick Reset)

**Use this during development** when you don't care about preserving data:

```bash
npx hardhat run scripts/deploy-dev.js --network quorum
```

This deploys both contracts, seeds admin, and copies ABIs. Update `.env` with printed addresses, then restart backend.

---

## Production (Preserve Users)

**Use these for thesis defense** to show proper deployment workflow:

### 1. Initial Setup (Run Once)

```bash
# Deploy UserRegistry
npx hardhat run scripts/deploy-user-registry.js --network quorum

# Update backend/.env with USER_REGISTRY_ADDRESS and ADMIN_WALLET_ADDRESS

# Seed admin user
npx hardhat run scripts/seed-admin.js --network quorum
```

### 2. Deploy Certificate Contract

```bash
# Deploy CertificateRegistry (uses existing UserRegistry)
npx hardhat run scripts/deploy-certificate-registry.js --network quorum

# Update backend/.env with CONTRACT_ADDRESS
# Restart backend
```

### 3. Redeploy After Changes

**When you change CertificateRegistry.sol:**

```bash
npx hardhat run scripts/deploy-certificate-registry.js --network quorum
# Update CONTRACT_ADDRESS in .env, restart backend
# ✅ All users preserved!
```

**When you change UserRegistry.sol:**

```bash
# Redeploy UserRegistry
npx hardhat run scripts/deploy-user-registry.js --network quorum
# Update USER_REGISTRY_ADDRESS in .env

# Re-seed admin
npx hardhat run scripts/seed-admin.js --network quorum

# Redeploy CertificateRegistry (needs new UserRegistry address)
npx hardhat run scripts/deploy-certificate-registry.js --network quorum
# Update CONTRACT_ADDRESS in .env, restart backend
```

---

## Why Two Workflows?

- **Development**: Fast iteration, no data preservation needed
- **Production**: Modular deployment, preserves user data when only certificate logic changes
