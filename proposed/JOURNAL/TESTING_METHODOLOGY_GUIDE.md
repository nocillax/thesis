# Comprehensive Testing Methodology for Journal Section 8

# NXCertify Blockchain Certificate Management System

**Purpose:** This guide provides step-by-step instructions for collecting ALL metrics needed to fill in the placeholders in Section 8 (Evaluation and Performance Analysis) of the journal paper.

**Target Sections:** Section 8.1 through 8.8

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Performance Benchmarks](#2-performance-benchmarks)
3. [Security Validation](#3-security-validation)
4. [Scalability Analysis](#4-scalability-analysis)
5. [User Experience Metrics](#5-user-experience-metrics)
6. [Reliability Testing](#6-reliability-testing)
7. [Data Recording Templates](#7-data-recording-templates)

---

## 1. Environment Setup

### 1.1 Document Infrastructure Specifications

**What to measure:**

- Server hardware specifications
- Network configuration
- Software versions

**How to measure:**

```bash
# Server CPU info
lscpu | grep -E "Model name|CPU\(s\)|Thread"

# Memory info
free -h

# Disk info
df -h
lsblk

# Docker info
docker --version
docker-compose --version

# Node.js version
node --version
npm --version

# PostgreSQL version
docker exec -it postgres psql -U postgres -c "SELECT version();"

# Network interface info
ifconfig or ip addr show
```

**Record in Section 8.1:**

- Hardware specs (CPU model, cores, RAM)
- Storage type and capacity
- Network bandwidth and latency
- Docker/Node.js/PostgreSQL versions

### 1.2 Generate Test Data

**Objective:** Create synthetic dataset for realistic testing

**Steps:**

1. **Create test users** (via API or blockchain scripts):

   ```bash
   # Create 10 admin users
   # Create 50 staff users
   # Use the /users/register endpoint
   ```

2. **Create test certificates:**

   ```bash
   # Issue 100 certificates with varying states
   # Use the /certificates endpoint
   ```

3. **Create verification logs:**
   ```bash
   # Simulate 500 verification attempts
   # Use the /verifier/verify endpoint
   ```

**Record:**

- Total users created: X admins, Y staff
- Total certificates created: Z active, W revoked
- Total verification attempts: N

---

## 2. Performance Benchmarks

### 2.1 Transaction Latency Analysis

#### Test 2.1.1: Certificate Issuance Latency

**Objective:** Measure end-to-end time for certificate issuance

**Tool:** Custom Node.js script with `console.time()`

**Script:** `test-issuance-latency.js`

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3001";
const TOKEN = "YOUR_JWT_TOKEN";

async function measureIssuanceLatency() {
  const iterations = 100; // Run 100 times
  const latencies = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${API_URL}/api/blockchain/certificates`,
        {
          student_id: `TEST-${Date.now()}-${i}`,
          student_name: `Test Student ${i}`,
          degree_program: "Computer Science",
          cgpa: 3.85,
          issuing_authority: "Test University",
        },
        {
          headers: { Authorization: `Bearer ${TOKEN}` },
        }
      );

      const endTime = Date.now();
      const latency = endTime - startTime;
      latencies.push(latency);

      console.log(`Iteration ${i + 1}: ${latency} ms`);

      // Wait 2 seconds between requests to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error in iteration ${i + 1}:`, error.message);
    }
  }

  // Calculate statistics
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const sorted = latencies.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const stdDev = Math.sqrt(
    latencies.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / latencies.length
  );

  console.log("\n=== RESULTS ===");
  console.log(
    `Average: ${avg.toFixed(2)} ms (${(avg / 1000).toFixed(2)} seconds)`
  );
  console.log(
    `Median: ${median.toFixed(2)} ms (${(median / 1000).toFixed(2)} seconds)`
  );
  console.log(
    `95th Percentile: ${p95.toFixed(2)} ms (${(p95 / 1000).toFixed(2)} seconds)`
  );
  console.log(
    `99th Percentile: ${p99.toFixed(2)} ms (${(p99 / 1000).toFixed(2)} seconds)`
  );
  console.log(`Min: ${min.toFixed(2)} ms (${(min / 1000).toFixed(2)} seconds)`);
  console.log(`Max: ${max.toFixed(2)} ms (${(max / 1000).toFixed(2)} seconds)`);
  console.log(`Std Dev: ±${stdDev.toFixed(2)} ms`);

  return { avg, median, p95, p99, min, max, stdDev };
}

measureIssuanceLatency();
```

**Record in Section 8.2.1 (Certificate Issuance Latency table)**

**Phase Breakdown:** To measure individual phases, add timing logs in backend code:

```typescript
// In CertificateBlockchainService.issueCertificate()
const t0 = Date.now();
// Student validation
const t1 = Date.now();
console.log(`Student validation: ${t1 - t0} ms`);

// Hash computation
const t2 = Date.now();
console.log(`Hash computation: ${t2 - t1} ms`);

// Signature generation
const t3 = Date.now();
console.log(`Signature: ${t3 - t2} ms`);

// Transaction submission
const t4 = Date.now();
console.log(`TX submission: ${t4 - t3} ms`);

// Wait for confirmation
const t5 = Date.now();
console.log(`Consensus: ${t5 - t4} ms`);
```

Run the issuance test and collect logs to fill the breakdown table.

---

#### Test 2.1.2: Certificate Verification Latency

**Script:** `test-verification-latency.js`

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3001";
const CERT_HASHES = [
  "0xabcd1234...", // Replace with actual certificate hashes
  "0xefgh5678...",
  // Add more...
];

async function measureVerificationLatency() {
  const iterations = 100;
  const latencies = [];

  for (let i = 0; i < iterations; i++) {
    const hash = CERT_HASHES[i % CERT_HASHES.length];
    const startTime = Date.now();

    try {
      await axios.get(`${API_URL}/api/blockchain/certificates/verify/${hash}`);
      const endTime = Date.now();
      latencies.push(endTime - startTime);

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  // Calculate statistics (same as above)
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const sorted = latencies.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  console.log(`Average: ${avg.toFixed(2)} ms`);
  console.log(`Median: ${median.toFixed(2)} ms`);
  console.log(`95th Percentile: ${p95.toFixed(2)} ms`);

  return { avg, median, p95 };
}

measureVerificationLatency();
```

**Record in Section 8.2.1 (Certificate Verification Latency table)**

---

#### Test 2.1.3: Revocation/Reactivation Latency

**Script:** `test-status-change-latency.js`

```javascript
// Similar to issuance test, but for revoke/reactivate operations
// POST to /certificates/:hash/revoke
// POST to /certificates/:hash/reactivate
// Measure latency for each operation
```

**Record in Section 8.2.1 (Status Change Performance table)**

---

### 2.2 Throughput Analysis

#### Test 2.2.1: Certificate Issuance Throughput

**Objective:** Measure certificates issued per second under varying concurrent load

**Tool:** Apache JMeter OR k6

**Using k6:**

Create `load-test-issuance.js`:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

const API_URL = "http://localhost:3001";
const TOKEN = "YOUR_JWT_TOKEN";

export let options = {
  stages: [
    { duration: "1m", target: 1 }, // 1 concurrent user
    { duration: "1m", target: 5 }, // 5 concurrent users
    { duration: "1m", target: 10 }, // 10 concurrent users
    { duration: "1m", target: 20 }, // 20 concurrent users
    { duration: "1m", target: 50 }, // 50 concurrent users
  ],
};

export default function () {
  const payload = JSON.stringify({
    student_id: `LOAD-${Date.now()}-${__VU}-${__ITER}`,
    student_name: `Load Test Student ${__VU}`,
    degree_program: "Computer Science",
    cgpa: 3.75,
    issuing_authority: "Test University",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  };

  const response = http.post(
    `${API_URL}/api/blockchain/certificates`,
    payload,
    params
  );

  check(response, {
    "is status 200 or 201": (r) => r.status === 200 || r.status === 201,
  });

  sleep(2); // Wait 2 seconds between requests per user
}
```

**Run:**

```bash
k6 run load-test-issuance.js
```

**Analyze k6 output:**

- http_req_duration: Response time
- http_reqs: Total requests
- Certificates per second = http_reqs / duration
- Success rate = checks passed / checks total

**Record in Section 8.2.2 (Throughput Under Load table):**

- For each concurrency level (1, 5, 10, 20, 50)
- Certificates/second
- Success rate
- Average response time

---

#### Test 2.2.2: Verification Throughput

**Script:** `load-test-verification.js`

```javascript
import http from "k6/http";
import { check } from "k6";

const API_URL = "http://localhost:3001";
const CERT_HASHES = ["0xabc...", "0xdef..."]; // Add real hashes

export let options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 200 },
  ],
};

export default function () {
  const hash = CERT_HASHES[Math.floor(Math.random() * CERT_HASHES.length)];
  const response = http.get(
    `${API_URL}/api/blockchain/certificates/verify/${hash}`
  );

  check(response, {
    "is status 200": (r) => r.status === 200,
  });
}
```

**Run and record in Section 8.2.2 (Verification Endpoint Throughput table)**

---

### 2.3 Gas Cost Analysis

#### Test 2.3.1: Measure Gas Consumption

**Objective:** Extract gas used for each operation from transaction receipts

**Script:** `measure-gas-costs.js`

```javascript
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("http://localhost:8545");

async function analyzeGasCosts() {
  // Get recent transactions
  const latestBlock = await provider.getBlockNumber();
  const transactions = [];

  // Fetch last 100 blocks
  for (let i = latestBlock; i > latestBlock - 100; i--) {
    const block = await provider.getBlock(i, true);
    if (block && block.transactions) {
      transactions.push(...block.transactions);
    }
  }

  // Categorize by function signature
  const gasByOperation = {
    registerUser: [],
    issueCertificate: [],
    revokeCertificate: [],
    reactivateCertificate: [],
    grantAdmin: [],
    revokeUser: [],
  };

  for (const tx of transactions) {
    if (!tx.data) continue;

    const funcSig = tx.data.slice(0, 10);
    const receipt = await provider.getTransactionReceipt(tx.hash);

    // Match function signatures (you need to get these from your contract ABIs)
    // Example: issueCertificate = 0x12345678
    if (funcSig === "0x...") {
      // registerUser signature
      gasByOperation["registerUser"].push(receipt.gasUsed);
    } else if (funcSig === "0x...") {
      // issueCertificate signature
      gasByOperation["issueCertificate"].push(receipt.gasUsed);
    }
    // ... repeat for other operations
  }

  // Calculate statistics
  for (const [operation, gasValues] of Object.entries(gasByOperation)) {
    if (gasValues.length === 0) continue;

    const avg =
      gasValues.reduce((a, b) => Number(a) + Number(b), 0) / gasValues.length;
    const sorted = gasValues.sort((a, b) => Number(a) - Number(b));
    const median = sorted[Math.floor(sorted.length / 2)];

    console.log(`${operation}:`);
    console.log(`  Average Gas: ${Math.round(avg)}`);
    console.log(`  Median Gas: ${median.toString()}`);
  }
}

analyzeGasCosts();
```

**Alternative:** Check backend logs where transaction receipts are logged:

```bash
# grep for "gasUsed" in backend logs
docker logs backend_container | grep gasUsed
```

**Record in Section 8.2.3 (Gas Consumption table)**

**Cost Calculation:**

```javascript
// Calculate Ethereum costs
const gasUsed = 150000; // example
const gasPriceGwei = 30; // 30 gwei
const ethPrice = 3000; // $3000 per ETH

const gasCostEth = (gasUsed * gasPriceGwei) / 1e9;
const gasCostUSD = gasCostEth * ethPrice;

console.log(`Cost: ${gasCostUSD.toFixed(4)} USD`);
```

Repeat for gas prices: 30, 100, 200 gwei

**Record in Section 8.2.3 (Cost Projection table)**

---

### 2.4 Database Query Performance

#### Test 2.4.1: Enable PostgreSQL Query Stats

**Steps:**

1. Enable pg_stat_statements:

```sql
-- Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d certificate_db

-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify
SELECT * FROM pg_stat_statements LIMIT 5;
```

2. Run system under normal load for 1 hour

3. Query statistics:

```sql
-- Top queries by execution time
SELECT
  query,
  calls,
  total_exec_time::numeric(10,2) as total_time_ms,
  mean_exec_time::numeric(10,2) as avg_time_ms,
  stddev_exec_time::numeric(10,2) as stddev_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Record in Section 8.2.4 (Database Query Performance table)**

Look for queries related to:

- Student eligibility checks (`SELECT ... FROM students WHERE student_id = ...`)
- Verification log inserts (`INSERT INTO verification_logs ...`)
- Session tracking (`SELECT ... FROM admin_sessions WHERE ...`)
- Audit aggregation (`SELECT ... FROM ... JOIN ...`)

---

### 2.5 API Endpoint Response Times

#### Test 2.5.1: Measure Individual Endpoints

**Tool:** Postman with Collection Runner OR custom script

**Script:** `measure-api-latency.js`

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3001";
const TOKEN = "YOUR_JWT_TOKEN";

const endpoints = [
  {
    method: "POST",
    path: "/api/auth/wallet-login",
    body: {
      /* ... */
    },
  },
  {
    method: "POST",
    path: "/api/blockchain/users/register",
    body: {
      /* ... */
    },
  },
  {
    method: "POST",
    path: "/api/blockchain/certificates",
    body: {
      /* ... */
    },
  },
  { method: "GET", path: "/api/blockchain/certificates/verify/0xabcd..." },
  {
    method: "PATCH",
    path: "/api/blockchain/certificates/0xabcd.../revoke",
    body: { reason: "Test" },
  },
  { method: "GET", path: "/api/blockchain/certificates/audit-logs" },
  { method: "GET", path: "/api/blockchain/certificates/0xabcd.../download" },
];

async function measureEndpointLatency(endpoint) {
  const iterations = 50;
  const latencies = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();

    try {
      const config = {
        method: endpoint.method,
        url: `${API_URL}${endpoint.path}`,
        headers: { Authorization: `Bearer ${TOKEN}` },
      };

      if (endpoint.body) {
        config.data = endpoint.body;
      }

      await axios(config);
      latencies.push(Date.now() - startTime);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const sorted = latencies.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  console.log(`${endpoint.method} ${endpoint.path}:`);
  console.log(
    `  Avg: ${avg.toFixed(
      2
    )} ms, Median: ${median} ms, 95th: ${p95} ms, 99th: ${p99} ms`
  );

  return { endpoint, avg, median, p95, p99 };
}

async function measureAllEndpoints() {
  const results = [];
  for (const endpoint of endpoints) {
    const result = await measureEndpointLatency(endpoint);
    results.push(result);
  }
  console.table(results);
}

measureAllEndpoints();
```

**Record in Section 8.2.5 (API Endpoint Performance table)**

---

## 3. Security Validation

### 3.1 Authentication Security Testing

#### Test 3.1.1: Valid/Invalid Signature Testing

**Script:** `test-authentication-security.js`

```javascript
const { ethers } = require("ethers");
const axios = require("axios");

const API_URL = "http://localhost:3001";

async function testAuthenticationSecurity() {
  const wallet = ethers.Wallet.createRandom();
  const message = `Login to Certificate System at ${new Date().toISOString()}`;

  // Test 1: Valid signature
  const validSignature = await wallet.signMessage(message);
  let result = await axios.post(`${API_URL}/api/auth/wallet-login`, {
    walletAddress: wallet.address,
    message,
    signature: validSignature,
  });
  console.log(
    "Test 1 (Valid signature):",
    result.status === 200 ? "PASS" : "FAIL"
  );

  // Test 2: Invalid signature (tampered)
  const tamperedSignature = validSignature.slice(0, -2) + "ff";
  try {
    await axios.post(`${API_URL}/api/auth/wallet-login`, {
      walletAddress: wallet.address,
      message,
      signature: tamperedSignature,
    });
    console.log("Test 2 (Tampered signature): FAIL (should reject)");
  } catch (error) {
    console.log("Test 2 (Tampered signature): PASS (rejected)");
  }

  // Test 3: Replayed signature (old timestamp)
  const oldMessage = `Login to Certificate System at 2020-01-01T00:00:00Z`;
  const oldSignature = await wallet.signMessage(oldMessage);
  try {
    await axios.post(`${API_URL}/api/auth/wallet-login`, {
      walletAddress: wallet.address,
      message: oldMessage,
      signature: oldSignature,
    });
    console.log("Test 3 (Replay attack): FAIL (should reject)");
  } catch (error) {
    console.log("Test 3 (Replay attack): PASS (rejected)");
  }

  // Test 4: Signature from different wallet
  const wallet2 = ethers.Wallet.createRandom();
  const signature2 = await wallet2.signMessage(message);
  try {
    await axios.post(`${API_URL}/api/auth/wallet-login`, {
      walletAddress: wallet.address, // Using wallet1 address
      message,
      signature: signature2, // But wallet2 signature
    });
    console.log("Test 4 (Wrong wallet): FAIL (should reject)");
  } catch (error) {
    console.log("Test 4 (Wrong wallet): PASS (rejected)");
  }

  // Test 5: Unauthorized user (not registered on blockchain)
  const unauthorizedWallet = ethers.Wallet.createRandom();
  const unauthorizedSig = await unauthorizedWallet.signMessage(message);
  try {
    await axios.post(`${API_URL}/api/auth/wallet-login`, {
      walletAddress: unauthorizedWallet.address,
      message,
      signature: unauthorizedSig,
    });
    console.log("Test 5 (Unauthorized user): FAIL (should reject)");
  } catch (error) {
    console.log("Test 5 (Unauthorized user): PASS (rejected)");
  }

  // Test 6: Revoked user
  // (You need to manually revoke a user first, then test login)

  console.log("\nAll authentication security tests completed.");
}

testAuthenticationSecurity();
```

**Record in Section 8.3.1 (Authentication Test Results table)**

---

### 3.2 Authorization Bypass Attempts

#### Test 3.2.1: Frontend Bypass Attempt

**Manual Test:**

1. Login as non-admin user
2. Open browser DevTools > Console
3. Try to access admin-only endpoints:

```javascript
fetch("/api/blockchain/users/register", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_NON_ADMIN_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "attacker",
    email: "attacker@test.com",
    is_admin: true,
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

Expected: 403 Forbidden (backend rejects)

**Record in Section 8.3.2 (Authorization Bypass Tests table):** ✅ BLOCKED

---

#### Test 3.2.2: JWT Token Manipulation

**Manual Test:**

1. Get a valid JWT token
2. Decode it (using jwt.io)
3. Modify claims (change is_admin: false → true)
4. Re-encode with a different secret (won't match server secret)
5. Try to use modified token

Expected: 401 Unauthorized (signature validation fails)

**Record in Section 8.3.2:** ✅ BLOCKED

---

#### Test 3.2.3: Direct Smart Contract Call

**Script:** `test-contract-bypass.js`

```javascript
const { ethers } = require("ethers");

// Attacker wallet (not admin, not authorized)
const attackerWallet = new ethers.Wallet("0x...private_key...", provider);

// Try to call admin-only function
const userRegistry = new ethers.Contract(
  "USER_REGISTRY_ADDRESS",
  ["function registerUser(address, string, string, bool) external"],
  attackerWallet
);

try {
  const tx = await userRegistry.registerUser(
    "0x1234...",
    "hacker",
    "hacker@test.com",
    true
  );
  console.log("FAIL: Transaction succeeded (should have been blocked)");
} catch (error) {
  if (
    error.message.includes("Only admin") ||
    error.message.includes("revert")
  ) {
    console.log("PASS: Smart contract rejected unauthorized call");
  }
}
```

**Record in Section 8.3.2:** ✅ BLOCKED

---

### 3.3 Rate Limiting Effectiveness

#### Test 3.3.1: Rate Limit Testing

**Script:** `test-rate-limiting.js`

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3001";
const CERT_HASH = "0xabcd1234...";

async function testRateLimiting() {
  const results = [];

  // Send 6 verification requests rapidly (limit is 3 per 15 min)
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(`${API_URL}/verifier/verify`, {
        name: "Test Verifier",
        email: "test@test.com",
        institution: "Test Corp",
        website: "https://test.com",
        cert_hash: CERT_HASH,
      });

      results.push({
        attempt: i,
        status: response.status,
        remainingAttempts: response.data.remaining_attempts,
        blocked: false,
      });
    } catch (error) {
      results.push({
        attempt: i,
        status: error.response.status,
        message: error.response.data.message,
        blocked: error.response.status === 429 || error.response.status === 403,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.table(results);

  // Verify expected behavior:
  // Attempts 1-3: 200 OK
  // Attempt 4: 429 Too Many Requests
  // Attempts 5-6: 403 Forbidden (IP blocked)
}

testRateLimiting();
```

**Record in Section 8.3.3 (Rate Limiting Test Results table)**

---

### 3.4 Cryptographic Validation

#### Test 3.4.1: Hash Collision Testing

**Script:** `test-hash-collisions.js`

```javascript
const { ethers } = require("ethers");

function generateCertificateHash(
  studentId,
  name,
  degree,
  program,
  cgpa,
  date,
  version
) {
  const packed = ethers.solidityPacked(
    ["string", "string", "string", "string", "uint16", "uint256", "uint256"],
    [studentId, name, degree, program, cgpa * 100, date, version]
  );
  return ethers.keccak256(packed);
}

async function testHashCollisions() {
  const iterations = 10000;
  const hashes = new Set();
  const certificates = [];

  for (let i = 0; i < iterations; i++) {
    const cert = {
      studentId: `STU-${i}`,
      name: `Student ${i}`,
      degree: "BS",
      program: "CS",
      cgpa: Math.random() * 4,
      date: Date.now() + i,
      version: 1,
    };

    const hash = generateCertificateHash(
      cert.studentId,
      cert.name,
      cert.degree,
      cert.program,
      cert.cgpa,
      cert.date,
      cert.version
    );

    if (hashes.has(hash)) {
      console.log(`COLLISION FOUND! Iteration ${i}`);
      console.log(
        "Certificate 1:",
        certificates.find((c) => c.hash === hash)
      );
      console.log("Certificate 2:", cert);
      break;
    }

    hashes.add(hash);
    certificates.push({ ...cert, hash });
  }

  console.log(`\nGenerated ${iterations} certificates`);
  console.log(`Unique hashes: ${hashes.size}`);
  console.log(`Collision rate: ${(1 - hashes.size / iterations) * 100}%`);
}

testHashCollisions();
```

**Record in Section 8.3.4 (Hash Collision Testing table)**

Expected: 0% collision rate (Keccak-256 has 2^-128 collision probability)

---

#### Test 3.4.2: Signature Verification Performance

**Script:** `test-signature-performance.js`

```javascript
const { ethers } = require("ethers");

async function testSignaturePerformance() {
  const wallet = ethers.Wallet.createRandom();
  const message = "Test message";
  const iterations = 1000;

  // Sign
  const signTimes = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await wallet.signMessage(message);
    signTimes.push(Date.now() - start);
  }

  const signature = await wallet.signMessage(message);

  // Verify
  const verifyTimes = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    ethers.verifyMessage(message, signature);
    verifyTimes.push(Date.now() - start);
  }

  const avgSign = signTimes.reduce((a, b) => a + b, 0) / signTimes.length;
  const avgVerify = verifyTimes.reduce((a, b) => a + b, 0) / verifyTimes.length;

  console.log(`Average signature time: ${avgSign.toFixed(2)} ms`);
  console.log(`Average verification time: ${avgVerify.toFixed(2)} ms`);
}

testSignaturePerformance();
```

**Record in Section 8.3.4 (Signature Security table)**

---

## 4. Scalability Analysis

### 4.1 Concurrent User Simulation

#### Test 4.1.1: Full System Load Test

**Tool:** k6 with mixed scenarios

**Script:** `load-test-mixed-operations.js`

```javascript
import http from "k6/http";
import { check, sleep } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

const API_URL = "http://localhost:3001";
const TOKENS = [
  "ADMIN_TOKEN_1",
  "STAFF_TOKEN_1",
  "STAFF_TOKEN_2",
  // Add more tokens...
];

export let options = {
  stages: [
    { duration: "2m", target: 10 },
    { duration: "5m", target: 25 },
    { duration: "5m", target: 50 },
    { duration: "5m", target: 100 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% of requests must complete within 5s
    http_req_failed: ["rate<0.1"], // Less than 10% failure rate
  },
};

export default function () {
  const token = TOKENS[randomIntBetween(0, TOKENS.length - 1)];

  // Randomize operation type
  const operation = randomIntBetween(1, 4);

  if (operation === 1) {
    // Issue certificate
    const payload = JSON.stringify({
      student_id: `LOAD-${Date.now()}-${__VU}`,
      student_name: `Student ${__VU}`,
      degree_program: "Computer Science",
      cgpa: 3.5 + Math.random(),
      issuing_authority: "Test University",
    });

    const res = http.post(`${API_URL}/api/blockchain/certificates`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    check(res, {
      "issuance success": (r) => r.status === 200 || r.status === 201,
    });
  } else if (operation === 2) {
    // Verify certificate
    const res = http.get(
      `${API_URL}/api/blockchain/certificates/verify/0x${Math.random()
        .toString(16)
        .substring(2, 10)}...`
    );
    check(res, {
      "verification success": (r) => r.status === 200 || r.status === 404,
    });
  } else if (operation === 3) {
    // View audit logs
    const res = http.get(`${API_URL}/api/blockchain/certificates/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check(res, { "audit logs success": (r) => r.status === 200 });
  } else {
    // List certificates
    const res = http.get(`${API_URL}/api/blockchain/certificates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check(res, { "list success": (r) => r.status === 200 });
  }

  sleep(randomIntBetween(1, 3));
}
```

**Run:**

```bash
k6 run --out csv=results.csv load-test-mixed-operations.js
```

**Monitor system resources during test:**

```bash
# In separate terminals:

# Monitor blockchain node CPU/memory
docker stats validator1 validator2 validator3 rpc-node

# Monitor backend CPU/memory
docker stats backend

# Monitor database CPU/memory
docker stats postgres
```

**Record in Section 8.4.1 (Concurrent User Performance table)**

Capture:

- Operations per minute (from k6 output)
- Success rate (from k6 checks)
- Average response time (from k6 metrics)
- CPU usage per component (from docker stats)

---

### 4.2 Storage Growth Projection

#### Test 4.2.1: Measure Blockchain Storage

**Script:** `measure-blockchain-storage.js`

```javascript
const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.JsonRpcProvider("http://localhost:8545");

async function measureBlockchainStorage() {
  const latestBlock = await provider.getBlockNumber();

  let totalSize = 0;
  let userRecords = 0;
  let certRecords = 0;
  let eventLogs = 0;

  // Sample recent blocks
  for (let i = latestBlock; i > Math.max(0, latestBlock - 1000); i--) {
    const block = await provider.getBlock(i, true);

    if (!block) continue;

    // Estimate block size (transactions + metadata)
    const blockJSON = JSON.stringify(block);
    totalSize += Buffer.byteLength(blockJSON, "utf8");

    // Count transactions
    for (const tx of block.transactions) {
      // Identify transaction type by function signature
      const funcSig = tx.data.slice(0, 10);

      if (funcSig === "0x...") userRecords++; // registerUser
      if (funcSig === "0x...") certRecords++; // issueCertificate
    }

    // Count events (estimate)
    const receipt = await provider.getTransactionReceipt(
      block.transactions[0]?.hash
    );
    if (receipt) {
      eventLogs += receipt.logs.length;
    }
  }

  console.log(
    `Total blockchain size (sample): ${(totalSize / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`User records: ${userRecords}`);
  console.log(`Certificate records: ${certRecords}`);
  console.log(`Event logs: ${eventLogs}`);

  // Calculate per-item size
  const avgUserSize = userRecords > 0 ? totalSize / userRecords : 0;
  const avgCertSize = certRecords > 0 ? totalSize / certRecords : 0;
  const avgEventSize = eventLogs > 0 ? totalSize / eventLogs : 0;

  console.log(`\nAverage sizes:`);
  console.log(`User record: ${(avgUserSize / 1024).toFixed(2)} KB`);
  console.log(`Certificate record: ${(avgCertSize / 1024).toFixed(2)} KB`);
  console.log(`Event log: ${avgEventSize.toFixed(2)} bytes`);
}

measureBlockchainStorage();
```

**Alternative:** Check GoQuorum data directory size:

```bash
# Check blockchain data size
docker exec -it validator1 du -sh /data
docker exec -it validator2 du -sh /data
docker exec -it validator3 du -sh /data
```

**Project 5-year growth:**

```
Year 1: 1,000 certificates × avg_cert_size = X MB
Year 3: 3,000 certificates × avg_cert_size = X MB
Year 5: 5,000 certificates × avg_cert_size = X MB
```

**Record in Section 8.4.2 (Storage Growth table and 5-Year Projection)**

---

### 4.3 Network Scalability

#### Test 4.3.1: QBFT Consensus Performance

**Measure block time under load:**

```bash
# Monitor blockchain for 10 minutes during load test
watch -n 1 "curl -s -X POST http://localhost:8545 \
  -H 'Content-Type: application/json' \
  -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' \
  | jq '.result'"
```

Track block number every second, calculate block time:

- Block time = (timestamp_block_N - timestamp_block_N-1)

**Record in Section 8.4.3 (Consensus Performance table)**

---

## 5. User Experience Metrics

### 5.1 Task Completion Time

#### Test 5.1.1: User Task Testing

**Recruit 10-20 test participants** (or time yourself performing tasks)

**Tasks to measure:**

1. **Issue first certificate:**

   - Start: Login screen
   - End: Certificate successfully issued and confirmation shown
   - Steps: Login → Navigate to certificates → Click issue → Fill form → Submit → Wait for confirmation

2. **Verify certificate via QR:**

   - Start: Verification page
   - End: Certificate details displayed
   - Steps: Upload PDF → Scan QR code → View result

3. **Verify certificate via hash:**

   - Start: Verification page
   - End: Certificate details displayed
   - Steps: Paste hash → Click verify → View result

4. **Revoke certificate:**

   - Start: Certificate list
   - End: Certificate revoked confirmation
   - Steps: Find certificate → Click revoke → Enter reason → Submit

5. **View audit logs:**
   - Start: Dashboard
   - End: Audit timeline displayed
   - Steps: Click audit logs → Wait for loading

**Record each participant's time** and calculate:

- Average time
- User satisfaction (survey: 1-5 rating)

**Record in Section 8.5.1 (User Task Performance table)**

---

### 5.2 PDF Generation and QR Code

#### Test 5.2.1: PDF Performance

**Script:** `measure-pdf-generation.js`

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3001";
const TOKEN = "YOUR_TOKEN";
const CERT_HASH = "0xabcd...";

async function measurePDFGeneration() {
  const iterations = 50;
  const times = [];
  const sizes = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    const response = await axios.get(
      `${API_URL}/api/blockchain/certificates/${CERT_HASH}/download`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        responseType: "arraybuffer",
      }
    );

    const time = Date.now() - start;
    const size = response.data.byteLength;

    times.push(time);
    sizes.push(size);

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;

  console.log(
    `Average PDF generation time: ${avgTime.toFixed(2)} ms (${(
      avgTime / 1000
    ).toFixed(2)} seconds)`
  );
  console.log(`Average PDF file size: ${(avgSize / 1024).toFixed(2)} KB`);
}

measurePDFGeneration();
```

**Record in Section 8.5.2 (PDF Generation table)**

---

#### Test 5.2.2: QR Code Scanning

**Manual Test:**

1. Generate 20 test PDFs with QR codes
2. Test QR scanning on different platforms:

   - iOS Safari
   - Android Chrome
   - Desktop Chrome
   - Desktop Firefox

3. For each test:

   - Start timer when file upload begins
   - End timer when certificate details display
   - Record success/failure

4. Calculate:
   - Success rate per platform
   - Average scan time per platform

**Record in Section 8.5.2 (QR Scan Compatibility table)**

---

### 5.3 UI Responsiveness

#### Test 5.3.1: Lighthouse Performance Audit

**Steps:**

1. Build production frontend:

```bash
cd frontend
npm run build
npm run start
```

2. Run Lighthouse audits:

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audits for each page
lighthouse http://localhost:3000/login --output html --output-path ./reports/login.html
lighthouse http://localhost:3000/dashboard --output html --output-path ./reports/dashboard.html
lighthouse http://localhost:3000/certificates --output html --output-path ./reports/certificates.html
lighthouse http://localhost:3000/verify --output html --output-path ./reports/verify.html
lighthouse http://localhost:3000/audit-logs --output html --output-path ./reports/audit.html
```

3. Extract metrics from reports:
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
   - Lighthouse Score (Performance)

**Record in Section 8.5.3 (Frontend Performance Metrics table)**

---

## 6. Reliability Testing

### 6.1 Byzantine Fault Tolerance

#### Test 6.1.1: Node Failure Simulation

**Manual Tests:**

**Test 1: Normal operation (3/3 nodes)**

```bash
# All nodes running
docker ps | grep validator

# Issue certificate
# Record: Consensus achieved? YES/NO

# Check consensus in logs
docker logs validator1 | grep -i consensus
```

**Test 2: 1 node crash (2/3 nodes)**

```bash
# Stop one validator
docker stop validator3

# Issue certificate
# Record: Consensus achieved? YES/NO

# Measure impact on block time
# Record any increase in latency

# Restart node
docker start validator3
```

**Test 3: 1 node Byzantine (malicious)**

```bash
# This requires modifying validator code to send incorrect proposals
# Or disconnecting node from network while it continues running
docker network disconnect quorum-network validator3

# Issue certificate
# Record: Consensus achieved? YES/NO

# Reconnect
docker network connect quorum-network validator3
```

**Test 4: 2 nodes crash (1/3 nodes)**

```bash
# Stop two validators
docker stop validator2 validator3

# Try to issue certificate
# Record: Consensus achieved? NO (expected failure)

# Restart nodes
docker start validator2 validator3
```

**Record in Section 8.6.1 (Fault Tolerance Tests table)**

---

### 6.2 Component Failure Recovery

#### Test 6.2.1: Failure Recovery Time

**Script:** `test-component-recovery.sh`

```bash
#!/bin/bash

# Test RPC Node recovery
echo "Testing RPC Node failure..."
docker stop rpc-node
START_TIME=$(date +%s)
docker start rpc-node
# Wait until healthy
while ! curl -s http://localhost:8545 > /dev/null; do sleep 1; done
END_TIME=$(date +%s)
echo "RPC Node recovery time: $((END_TIME - START_TIME)) seconds"

# Test Backend API recovery
echo "Testing Backend API failure..."
docker stop backend
START_TIME=$(date +%s)
docker start backend
# Wait until healthy
while ! curl -s http://localhost:3001/health > /dev/null; do sleep 1; done
END_TIME=$(date +%s)
echo "Backend API recovery time: $((END_TIME - START_TIME)) seconds"

# Test PostgreSQL recovery
echo "Testing PostgreSQL failure..."
docker stop postgres
START_TIME=$(date +%s)
docker start postgres
# Wait until healthy
while ! docker exec postgres pg_isready > /dev/null 2>&1; do sleep 1; done
END_TIME=$(date +%s)
echo "PostgreSQL recovery time: $((END_TIME - START_TIME)) seconds"

# Test data loss (check recent transaction)
# Issue a certificate, crash backend, restart, check if certificate exists
```

**Record in Section 8.6.2 (Failure Recovery Testing table)**

---

## 7. Data Recording Templates

### 7.1 Results Spreadsheet Template

Create `evaluation-results.xlsx` with following sheets:

**Sheet 1: Transaction Latency**
| Operation | Iteration | Latency (ms) | Notes |
|-----------|-----------|--------------|-------|
| Issue Cert | 1 | ... | ... |
| Issue Cert | 2 | ... | ... |
| ... | ... | ... | ... |

**Sheet 2: Throughput**
| Concurrent Users | Duration (min) | Total Ops | Success Rate (%) | Avg Response (ms) |
|------------------|----------------|-----------|------------------|-------------------|
| 1 | 5 | ... | ... | ... |
| ... | ... | ... | ... | ... |

**Sheet 3: Gas Costs**
| Operation | TX Hash | Gas Used | Block Number |
|-----------|---------|----------|--------------|
| Register User | 0x... | ... | ... |
| ... | ... | ... | ... |

**Sheet 4: Security Tests**
| Test Name | Expected Result | Actual Result | Status |
|-----------|-----------------|---------------|--------|
| Valid signature | Accept | ... | ... |
| ... | ... | ... | ... |

**Sheet 5: User Testing**
| Participant | Task | Time (sec) | Satisfaction (1-5) | Notes |
|-------------|------|------------|-------------------|-------|
| User 1 | Issue cert | ... | ... | ... |
| ... | ... | ... | ... | ... |

---

### 7.2 Automated Data Collection

**Create master test script:** `run-all-tests.sh`

```bash
#!/bin/bash

echo "Starting comprehensive evaluation..."

# Create results directory
mkdir -p evaluation-results
cd evaluation-results

# Run performance tests
echo "Running performance tests..."
node ../test-issuance-latency.js > issuance-latency.txt
node ../test-verification-latency.js > verification-latency.txt
node ../test-status-change-latency.js > status-change-latency.txt

# Run load tests
echo "Running load tests..."
k6 run ../load-test-issuance.js > load-issuance.txt
k6 run ../load-test-verification.js > load-verification.txt
k6 run ../load-test-mixed-operations.js > load-mixed.txt

# Run security tests
echo "Running security tests..."
node ../test-authentication-security.js > auth-security.txt
node ../test-rate-limiting.js > rate-limiting.txt
node ../test-hash-collisions.js > hash-collisions.txt
node ../test-signature-performance.js > signature-performance.txt

# Measure gas costs
echo "Measuring gas costs..."
node ../measure-gas-costs.js > gas-costs.txt

# Measure storage
echo "Measuring storage..."
node ../measure-blockchain-storage.js > storage.txt
docker exec validator1 du -sh /data > blockchain-storage.txt
docker exec postgres psql -U postgres -d certificate_db -c "SELECT pg_size_pretty(pg_database_size('certificate_db'));" > db-storage.txt

# Measure API performance
echo "Measuring API performance..."
node ../measure-api-latency.js > api-latency.txt

# Lighthouse audits
echo "Running Lighthouse audits..."
lighthouse http://localhost:3000/login --output json --output-path ./lighthouse-login.json
lighthouse http://localhost:3000/dashboard --output json --output-path ./lighthouse-dashboard.json
lighthouse http://localhost:3000/certificates --output json --output-path ./lighthouse-certificates.json

echo "All tests completed! Results in evaluation-results/"
```

---

### 7.3 Manual Testing Checklist

Print this checklist and check off as you complete:

- [ ] Document environment specifications (8.1)
- [ ] Generate test data (100 certs, 60 users)
- [ ] Run issuance latency test (100 iterations)
- [ ] Run verification latency test (100 iterations)
- [ ] Run status change latency test
- [ ] Run throughput test (k6, 1-50 concurrent users)
- [ ] Measure gas costs for all operations
- [ ] Query database performance statistics
- [ ] Measure API endpoint latencies
- [ ] Run authentication security tests (6 tests)
- [ ] Attempt authorization bypasses (5 attempts)
- [ ] Test rate limiting (6+ requests)
- [ ] Run hash collision test (10,000 iterations)
- [ ] Measure signature performance
- [ ] Run concurrent user load test (10-100 users)
- [ ] Measure blockchain storage growth
- [ ] Monitor consensus performance under load
- [ ] Conduct user task timing (10 participants minimum)
- [ ] Test PDF generation performance (50 iterations)
- [ ] Test QR code scanning (20 tests, 4 platforms)
- [ ] Run Lighthouse audits (5 pages)
- [ ] Test node failure scenarios (4 scenarios)
- [ ] Test component recovery (4 components)
- [ ] Compile all results into spreadsheet
- [ ] Fill placeholders in Section 8

---

## Summary

This testing guide provides:

1. **Exact commands** to run for each metric
2. **Scripts** for automated data collection
3. **Manual test procedures** where automation isn't feasible
4. **Recording templates** to organize results
5. **Checklist** to track progress

**Estimated Time to Complete All Tests:** 40-60 hours

**Priority Order (if time limited):**

1. Performance benchmarks (Section 8.2) - CRITICAL
2. Throughput analysis (Section 8.2.2) - HIGH
3. Security validation (Section 8.3) - HIGH
4. User experience metrics (Section 8.5) - MEDIUM
5. Scalability analysis (Section 8.4) - MEDIUM
6. Reliability testing (Section 8.6) - LOW

**Next Steps:**

1. Review this guide
2. Set up test environment
3. Run automated tests first (scripts provided)
4. Conduct manual tests
5. Record all results in spreadsheet
6. Fill placeholders in Section 8 of manuscript
7. Generate comparison charts/graphs if needed

Good luck with testing! 🚀
