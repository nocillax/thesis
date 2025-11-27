# Docker Network Architecture: How Your 4 Nodes Work Together

**Prerequisites:** Read `BLOCKCHAIN_FUNDAMENTALS.md` first.

**Goal:** Understand exactly how Docker hosts your 4 blockchain nodes, how they communicate, and how your backend connects to them.

---

## Table of Contents

1. [What is Docker?](#what-is-docker)
2. [Your Quorum Network Setup](#your-quorum-network-setup)
3. [The 4 Validator Nodes](#the-4-validator-nodes)
4. [Docker Compose Orchestration](#docker-compose-orchestration)
5. [Network Communication](#network-communication)
6. [Port Mappings](#port-mappings)
7. [RPC Endpoints](#rpc-endpoints)
8. [IBFT Consensus in Action](#ibft-consensus-in-action)
9. [Monitoring and Observability](#monitoring-and-observability)

---

## What is Docker?

### The Container Analogy

Think of Docker as **shipping containers for software**.

**Traditional way (without Docker):**

```
Your Computer
├── Operating System (Ubuntu/Windows/Mac)
├── Node.js installed globally
├── Go (for Quorum) installed globally
├── Python installed globally
└── Everything shares the same environment
    Problem: Version conflicts, "works on my machine" issues
```

**With Docker:**

```
Your Computer
├── Docker Engine (like a container ship)
│
├── Container 1: Validator Node 1
│   ├── Ubuntu Linux
│   ├── Go + Quorum software
│   └── Isolated from everything else
│
├── Container 2: Validator Node 2
│   ├── Ubuntu Linux
│   ├── Go + Quorum software
│   └── Isolated from everything else
│
└── ... (more containers)
```

**Key benefits:**

- **Isolation:** Each container is independent
- **Reproducibility:** Same environment on any computer
- **Easy cleanup:** Delete containers without affecting your system
- **Resource efficiency:** Lighter than virtual machines

### Why Docker for Your Blockchain?

**Your thesis needs 4 separate blockchain nodes.** Without Docker:

- Install 4 copies of Quorum manually
- Configure 4 different ports for each
- Manage 4 separate processes
- Complex networking setup

**With Docker:**

```bash
# One command starts everything:
cd quorum-test-network
./run.sh
```

All 4 nodes start automatically with proper configuration!

---

## Your Quorum Network Setup

### Directory Structure

Your Quorum network lives here:

```
/home/nocillax/Documents/GitHub/thesis/proposed/quorum-test-network/
├── docker-compose.yml          # Defines all containers
├── config/
│   ├── genesis.json            # Initial blockchain state
│   ├── quorum/
│   │   ├── validator1/
│   │   │   ├── nodekey         # Node's private key
│   │   │   ├── static-nodes.json
│   │   │   └── keys/           # Account keys
│   │   ├── validator2/
│   │   ├── validator3/
│   │   └── validator4/
├── run.sh                      # Startup script
├── stop.sh                     # Shutdown script
└── remove.sh                   # Cleanup script
```

### What Each File Does

**1. `genesis.json`** - The "birth certificate" of your blockchain

```json
{
  "config": {
    "chainId": 1337,
    "istanbul": {
      "epoch": 30000,
      "policy": 0,
      "ceil2Nby3Block": 0
    }
  },
  "difficulty": "0x1",
  "gasLimit": "0xE0000000",
  "alloc": {
    "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73": {
      "balance": "0x446c3b15f9926687d2c40534fdb564000000000000"
    }
  }
}
```

**Breaking it down:**

- **`chainId: 1337`**: Unique identifier for your blockchain network

  - Ethereum mainnet is `1`
  - Your private network is `1337`
  - Prevents transactions from one network being replayed on another

- **`istanbul`**: IBFT consensus configuration

  - `epoch: 30000`: How often validator set can change
  - `policy: 0`: Round-robin proposer selection

- **`difficulty: "0x1"`**: Mining difficulty (minimal for IBFT)

  - In Bitcoin/Ethereum PoW: High difficulty, hard to mine
  - In IBFT: No mining, so set to minimum

- **`gasLimit: "0xE0000000"`**: Maximum gas per block (huge number)

  - Your contract uses ~500,000 gas per certificate
  - This limit allows ~3,700 certificates per block

- **`alloc`**: Pre-funded accounts
  - Your backend wallet (0xfe3b557e8fb62b89f4916b721be55ceb828dbd73) gets initial balance
  - Balance is in "wei" (smallest ETH unit)
  - This account can pay for transactions (though gasPrice = 0 in Quorum)
  - Note: User wallets are generated dynamically and funded as needed

**2. `nodekey`** - Each node's identity

Each validator has a unique private key:

```
validator1/nodekey: 1be3b50b31734be48452c29d714941ba165ef0cbf3ccea8ca16c45e3d8d45fb0
validator2/nodekey: 9bdd6a2e7cc1ca4a4019029df3834d2633ea6e14034d6dcc3b944396fe13a08b
validator3/nodekey: 722f11686b2277dcbd72713d8a3c81c666b585c337d47f503c3c1f3c17cf001d
validator4/nodekey: 7f2f5f161143e5a4e1273d4f1e8a5d39c1f3e3d9ea2a3e4a5f3b3d3e4d4c4b4a
```

**What's this for?**

- Each node uses its private key to sign messages
- Other nodes verify signatures to confirm identity
- Part of the IBFT consensus protocol

**3. `static-nodes.json`** - Network topology

```json
[
  "enode://d73b857969c86415c0c000371bcebd9ed3cca6c376032b3f65e58e9e2b79276fbc6f59eb1e22fcd6356ab95f42a666f70afd4985933bd8f3e05beb1a2bf8fdde@validator1:30303?discport=0",
  "enode://1b8a4b067a88af61a11e8b82c1f3c9bca49c13f06c7d4e5c3e2d1f9a8b7c6d5e@validator2:30303?discport=0",
  "enode://4a2f0c0d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b@validator3:30303?discport=0",
  "enode://7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f@validator4:30303?discport=0"
]
```

**Format:** `enode://PUBLIC_KEY@HOSTNAME:PORT`

**What this means:**

- Each node knows about all other nodes from startup
- They automatically connect to each other
- Forms a **fully connected mesh network**:

```
    Validator1 ←→ Validator2
        ↕ ⤫         ⤫ ↕
    Validator3 ←→ Validator4
```

Every node talks to every other node directly.

---

## The 4 Validator Nodes

### Node Configuration

Each validator node is configured identically but with unique keys:

**Validator 1:**

```yaml
validator1:
  image: quorumengineering/quorum:24.4.0
  container_name: validator1
  ports:
    - "8545:8545" # RPC (JSON-RPC API)
    - "8546:8546" # WebSocket
    - "30303:30303" # P2P communication
  volumes:
    - ./config/quorum/validator1:/config
    - ./data/validator1:/data
  command: |
    --datadir /data
    --nodekey /config/nodekey
    --istanbul.blockperiod 1
    --syncmode full
    --mine
    --miner.threads 1
    --verbosity 3
    --port 30303
    --http
    --http.addr 0.0.0.0
    --http.port 8545
    --http.api admin,eth,debug,miner,net,txpool,personal,web3,istanbul
```

### Understanding the Command Flags

Let's break down each flag:

**1. `--datadir /data`**

- Where blockchain data is stored
- Contains: blocks, transactions, state database
- Persisted on your computer (survives container restart)

**2. `--nodekey /config/nodekey`**

- Path to node's private key
- Used for signing IBFT messages
- Each node has unique key

**3. `--istanbul.blockperiod 1`**

- **CRITICAL FOR PERFORMANCE**
- Create a new block every **1 second**
- Even if no transactions (empty blocks)
- Why? Fast finality for your thesis experiments

Compare to other blockchains:

- Bitcoin: 10 minutes per block
- Ethereum: 12 seconds per block
- Your Quorum: **1 second per block** ⚡

**4. `--syncmode full`**

- Download and validate every block
- Store complete blockchain history
- Alternative: "fast" or "light" sync (not for validators)

**5. `--mine`**

- Participate in block creation
- In IBFT: Doesn't mean "mining" like Bitcoin
- Means: "I'm a validator, include me in consensus"

**6. `--miner.threads 1`**

- How many CPU threads for validation
- 1 is enough for IBFT (no heavy computation)

**7. `--verbosity 3`**

- Logging level (0 = silent, 5 = trace)
- 3 = info level (shows important events)

**8. `--http` and `--http.addr 0.0.0.0`**

- Enable HTTP JSON-RPC server
- `0.0.0.0` means accept connections from anywhere
- Your backend connects here!

**9. `--http.port 8545`**

- RPC listens on port 8545 inside container
- Standard Ethereum RPC port

**10. `--http.api admin,eth,debug,miner,net,txpool,personal,web3,istanbul`**

- Which RPC APIs to enable
- `eth`: Read blockchain, send transactions
- `personal`: Manage accounts
- `istanbul`: IBFT-specific operations
- `admin`: Node management

### What Each Node Does

All 4 nodes do the same job, but in rotation:

```
Block #500 (Validator1 is proposer)
├── Validator1: "I propose these transactions: [Tx1, Tx2]"
├── Validator2: Validates and votes
├── Validator3: Validates and votes
├── Validator4: Validates and votes
└── Consensus reached → Block added

Block #501 (Validator2 is proposer)
├── Validator2: "I propose these transactions: [Tx3]"
├── Validator1: Validates and votes
├── Validator3: Validates and votes
├── Validator4: Validates and votes
└── Consensus reached → Block added
```

**Round-robin proposer selection:**

- Block 500 → Validator1 proposes
- Block 501 → Validator2 proposes
- Block 502 → Validator3 proposes
- Block 503 → Validator4 proposes
- Block 504 → Validator1 proposes (cycle repeats)

**Why round-robin?**

- Fair: Each validator gets equal chance
- Simple: No competition or randomness
- Predictable: Know who proposes next

---

## Docker Compose Orchestration

### The docker-compose.yml File

This file defines your entire network:

```yaml
version: "3.7"

services:
  validator1:
    # ... (as shown above)

  validator2:
    # ... (similar to validator1)

  validator3:
    # ... (similar to validator1)

  validator4:
    # ... (similar to validator1)

  explorer:
    # Blockchain explorer (like Etherscan)
    image: alethio/ethereum-lite-explorer:latest
    ports:
      - "25000:80"
    depends_on:
      - validator1

  prometheus:
    # Metrics collection
    image: prom/prometheus:latest
    ports:
      - "9090:9090"

  grafana:
    # Metrics visualization
    image: grafana/grafana:latest
    ports:
      - "3000:3000"

networks:
  default:
    name: quorum-network
```

### How Docker Compose Works

**1. Starting the network:**

```bash
docker-compose up -d
```

**What happens:**

1. Docker creates a virtual network called `quorum-network`
2. Starts validator1 container
3. Starts validator2 container
4. Starts validator3 container
5. Starts validator4 container
6. Starts explorer, prometheus, grafana
7. All containers can communicate via network

**2. Container networking:**

Docker creates a virtual network interface:

```
Your Computer (Host)
├── Physical Network: 192.168.1.100
└── Docker Bridge: 172.18.0.1
    ├── validator1: 172.18.0.2
    ├── validator2: 172.18.0.3
    ├── validator3: 172.18.0.4
    └── validator4: 172.18.0.5
```

Containers talk via internal IPs or hostnames:

```bash
# Inside validator1, can reach validator2 as:
validator2:30303         # By hostname (Docker DNS)
172.18.0.3:30303         # By IP
```

**3. Volume mounts:**

```yaml
volumes:
  - ./config/quorum/validator1:/config
  - ./data/validator1:/data
```

This maps host directories to container directories:

```
Host Computer                          Container
/home/nocillax/.../validator1/nodekey  →  /config/nodekey
/home/nocillax/.../validator1/geth/    →  /data/geth/
```

**Why?**

- Blockchain data persists even if container stops
- Easy to inspect blockchain data from host
- Configuration files can be edited outside container

---

## Network Communication

### The P2P Layer (Port 30303)

**Purpose:** Nodes gossip to sync blockchain state.

**What gets transmitted:**

```
Validator1 → Validator2
├── "Here's a new block I created"
├── "Here's a transaction I received"
├── "What's your latest block number?"
└── "Send me blocks #500-505"
```

**Protocol:** DevP2P (Ethereum's peer-to-peer protocol)

- Encrypted connections
- Node authentication via public keys
- Automatic peer discovery (via static-nodes.json)

**Message types:**

1. **Block propagation:**

```
Validator1: "New block #500 is ready!"
            ↓
Validator2, 3, 4: Receive and validate block
```

2. **Transaction propagation:**

```
Your Backend → Validator1: Send transaction "Issue Certificate"
Validator1 → Validator2, 3, 4: "Hey, I got a new transaction"
All validators: Add transaction to mempool (pending transactions)
```

3. **IBFT consensus messages:**

```
Validator1 (Proposer): "PREPREPARE: Here's block #500"
Validator2, 3, 4:      "PREPARE: I reviewed it, looks good"
All validators:         "COMMIT: Let's finalize it"
                        Block #500 is now immutable!
```

### The RPC Layer (Port 8545)

**Purpose:** Your backend communicates with the blockchain.

**Architecture:**

```
Your NestJS Backend (Port 3001)
    ↓ HTTP Request
    ↓ http://localhost:8545
Validator1 RPC Server
    ↓ Processes request
    ↓ Queries blockchain
    ↓ Returns response
Your Backend receives response
```

**Example RPC call:**

```typescript
// Your backend code
const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const blockNumber = await provider.getBlockNumber();
```

**What happens under the hood:**

1. **Backend sends HTTP POST:**

```http
POST http://localhost:8545
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

2. **Validator1 processes:**

- Reads latest block from database
- Returns block number

3. **Validator1 responds:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1f4" // 500 in hex
}
```

4. **ethers.js parses response:**

```javascript
blockNumber = 500;
```

### Why Only Connect to Validator1?

**Your backend config:**

```typescript
BLOCKCHAIN_RPC_URL=http://localhost:8545  // Only validator1
```

**Question:** Why not connect to all 4 validators?

**Answer:** **Validators sync automatically!**

```
Your Backend → Validator1: "Issue certificate"
                    ↓
Validator1: Creates transaction, proposes block
                    ↓
Validator2, 3, 4: Receive block via P2P
                    ↓
All 4 validators have the same state
```

**Benefits:**

- Simpler backend code (one connection)
- Validator1 is always running (in your setup)
- If validator1 dies, you can change RPC to validator2:8545

**For production:**

- Use a load balancer
- Connect to multiple validators for redundancy
- Automatically failover if one node is down

---

## Port Mappings

### Understanding Port Mapping

**Port mapping** connects container ports to host ports:

```yaml
ports:
  - "8545:8545"
```

**Format:** `HOST_PORT:CONTAINER_PORT`

**What this means:**

```
Your Computer (Host)              Docker Container
Port 8545                    →    Port 8545 (Validator1 RPC)
├── Listens on localhost:8545
└── Forwards to container's 8545
```

### Your Network's Port Map

| Service        | Host Port | Container Port | Purpose                              |
| -------------- | --------- | -------------- | ------------------------------------ |
| Validator1 RPC | 8545      | 8545           | JSON-RPC API (backend connects here) |
| Validator1 WS  | 8546      | 8546           | WebSocket (for event subscriptions)  |
| Validator1 P2P | 30303     | 30303          | Node communication                   |
| Validator2 RPC | 8547      | 8545           | JSON-RPC API (alternative)           |
| Validator3 RPC | 8548      | 8545           | JSON-RPC API (alternative)           |
| Validator4 RPC | 8549      | 8545           | JSON-RPC API (alternative)           |
| Explorer       | 25000     | 80             | Blockchain explorer web UI           |
| Prometheus     | 9090      | 9090           | Metrics API                          |
| Grafana        | 3000      | 3000           | Monitoring dashboard                 |

### Why Different Ports for Validators?

**Inside containers:**

- All validators use port 8545 (no conflict, isolated)

**On host:**

- Can't have 4 services on same port
- Map to different ports: 8545, 8547, 8548, 8549

**Testing different validators:**

```bash
# Connect to Validator1
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Connect to Validator2
curl http://localhost:8547 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Both should return the same block number (synchronized)!

---

## RPC Endpoints

### Available RPC Methods

Your backend uses these RPC methods:

**1. eth_blockNumber** - Get latest block

```javascript
await provider.getBlockNumber();
// RPC: {"method": "eth_blockNumber", "params": []}
// Response: "0x1f4" (block 500)
```

**2. eth_call** - Read from contract (no transaction)

```javascript
await contract.verifyCertificate(cert_hash);
// RPC: {"method": "eth_call", "params": [{"to": "0x42699...", "data": "0x..."}, "latest"]}
// Response: Certificate data
```

**3. eth_sendRawTransaction** - Submit signed transaction

```javascript
await contract.issueCertificate(...)
// RPC: {"method": "eth_sendRawTransaction", "params": ["0xf86c..."]}
// Response: "0xabc..." (transaction hash)
```

**4. eth_getTransactionReceipt** - Check if transaction succeeded

```javascript
await tx.wait();
// RPC: {"method": "eth_getTransactionReceipt", "params": ["0xabc..."]}
// Response: {status: "0x1", blockNumber: "0x1f5", ...}
```

**5. eth_getLogs** - Query events (audit logs)

```javascript
await contract.queryFilter(contract.filters.CertificateIssued());
// RPC: {"method": "eth_getLogs", "params": [{"address": "0x42699...", "topics": [...]}]}
// Response: Array of event logs
```

### RPC Request/Response Examples

**Example 1: Get block number**

Request:

```json
{
  "jsonrpc": "2.0",
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1f4"
}
```

**Example 2: Call contract (read-only)**

Request:

```json
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [
    {
      "to": "0x4261D524bc701dA4AC49339e5F8b299977045eA5",
      "data": "0x8a4f2c9d7f8a3c2b1e9d6f4a8c3b2e1d9f7a6c5b4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8"
    },
    "latest"
  ],
  "id": 2
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008..."
}
```

**Example 3: Send transaction**

Request:

```json
{
  "jsonrpc": "2.0",
  "method": "eth_sendRawTransaction",
  "params": [
    "0xf86c808504a817c800825208940000000000000000000000000000000000000000880de0b6b3a76400008025a0..."
  ],
  "id": 3
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": "0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b"
}
```

---

## IBFT Consensus in Action

### The Consensus Process (Step-by-Step)

Let's trace what happens when you issue a certificate:

**Step 1: Transaction submission**

```
Your Backend → Validator1 (via RPC)
Transaction: "issueCertificate(0x7f8a..., 'John Doe', ...)"
Signed by: User's wallet (backend decrypted private key)
```

**Step 2: Transaction enters mempool**

```
Validator1 receives transaction
├── Validates signature (is it from a registered user wallet?)
├── Checks nonce (transaction order correct?)
├── Checks gas (sufficient for execution?)
└── Adds to mempool (pending transactions pool)
Note: Backend authorization already checked before signing
```

**Step 3: Block proposal (assuming Validator1 is proposer for this round)**

```
Validator1 (Proposer):
├── Selects transactions from mempool
├── Creates block #500 with these transactions
├── Executes transactions locally (pre-validation)
├── Computes block hash
└── Broadcasts PREPREPARE message to all validators
```

PREPREPARE message:

```
From: Validator1
Type: PREPREPARE
Block: {
  number: 500,
  transactions: [issueCertificate(...)],
  parentHash: 0xabc...,  // Block #499's hash
  timestamp: 1700000000,
  proposer: Validator1
}
```

**Step 4: Validators prepare**

```
Validator2, Validator3, Validator4:
├── Receive PREPREPARE from Validator1
├── Validate block structure
├── Execute transactions locally
├── Verify all transactions are valid
└── Broadcast PREPARE message
```

PREPARE message:

```
From: Validator2 (also sent by V3 and V4)
Type: PREPARE
BlockHash: 0xdef...  // Hash of proposed block
Agreement: "I agree with Validator1's proposal"
```

**Step 5: Prepared phase**

```
All validators:
├── Validator1 receives PREPARE from V2, V3, V4
├── Validator2 receives PREPARE from V1, V3, V4
├── Validator3 receives PREPARE from V1, V2, V4
├── Validator4 receives PREPARE from V1, V2, V3
│
└── Each validator now has 4/4 PREPARE messages (100% agreement)
    State: "PREPARED"
```

**Step 6: Validators commit**

```
All validators:
├── Broadcast COMMIT message
└── "I'm ready to finalize this block"
```

COMMIT message:

```
From: Validator1 (also sent by V2, V3, V4)
Type: COMMIT
BlockHash: 0xdef...
Signature: (ECDSA signature of block hash)
```

**Step 7: Committed phase**

```
All validators:
├── Receive COMMIT from all others
├── Verify 4/4 COMMIT messages (100% agreement)
├── Add block #500 to blockchain
├── Update state database
└── Notify connected RPC clients
    State: "COMMITTED"
```

**Step 8: Finality**

```
Block #500 is now final and immutable!
├── Your backend receives transaction receipt
├── Certificate is permanently on blockchain
└── All 4 validators have identical state
```

### Message Flow Diagram

```
Time →

T0: Backend sends transaction to Validator1
    |
T1: Validator1 adds to mempool
    |
T2: Validator1's turn to propose (round begins)
    |
    Validator1 (Proposer)     Validator2        Validator3        Validator4
    |                         |                 |                 |
T3: PREPREPARE ──────────────→──────────────────→─────────────────→
    "Block #500"              |                 |                 |
    |                         |                 |                 |
T4: Execute locally          Execute locally   Execute locally   Execute locally
    Valid ✓                   Valid ✓           Valid ✓           Valid ✓
    |                         |                 |                 |
T5:  ←────────── PREPARE ─────|                 |                 |
     ←─────────────────────── PREPARE ──────────|                 |
     ←────────────────────────────────── PREPARE ────────────────|
    |                         |                 |                 |
T6: Prepared state            Prepared state    Prepared state    Prepared state
    (3/3 PREPARE received)    (3/3 received)    (3/3 received)    (3/3 received)
    |                         |                 |                 |
T7: COMMIT ───────────────────→─────────────────→─────────────────→
     ←────────── COMMIT ──────|                 |                 |
     ←─────────────────────── COMMIT ───────────|                 |
     ←────────────────────────────────── COMMIT ─────────────────|
    |                         |                 |                 |
T8: Committed state           Committed state   Committed state   Committed state
    (4/4 COMMIT received)     (4/4 received)    (4/4 received)    (4/4 received)
    |                         |                 |                 |
T9: Add Block #500            Add Block #500    Add Block #500    Add Block #500
    |                         |                 |                 |
T10: Notify backend          Sync complete      Sync complete     Sync complete
     "Transaction mined"
```

**Total time:** ~1-2 seconds (your `--istanbul.blockperiod 1` setting)

### Fault Tolerance Demonstration

**Scenario 1: Validator4 is offline**

```
Active: V1, V2, V3
Offline: V4

Consensus process:
├── V1 proposes block #500
├── V2 sends PREPARE ✓
├── V3 sends PREPARE ✓
├── V4 doesn't respond (offline)
│
└── 3/4 validators = 75% > 66% required
    Block is accepted! ✓
```

**Scenario 2: Validator3 and Validator4 are offline**

```
Active: V1, V2
Offline: V3, V4

Consensus process:
├── V1 proposes block #500
├── V2 sends PREPARE ✓
├── V3 doesn't respond (offline)
├── V4 doesn't respond (offline)
│
└── 2/4 validators = 50% < 66% required
    Block is REJECTED! ❌
    Network HALTS (no new blocks)
```

**Why 66% (2/3)?**

Byzantine Fault Tolerance theorem:

- Can tolerate up to `f` faulty nodes
- Requires `3f + 1` total nodes
- With 4 nodes: `f = 1` (tolerate 1 faulty node)
- Need `3f + 1 = 3 × 1 + 1 = 4` nodes minimum
- Consensus requires `2f + 1 = 3` nodes (75%)

---

## Monitoring and Observability

### Blockchain Explorer (Port 25000)

**URL:** http://localhost:25000

**What you can see:**

- Latest blocks
- Transactions in each block
- Contract addresses
- Account balances
- Transaction details

**Example: Finding your certificate transaction**

1. Open http://localhost:25000
2. Click on latest block
3. See transaction with your contract address `0x4261D524bc701dA4AC49339e5F8b299977045eA5`
4. Click transaction to see:
   - From: User's wallet (decrypted by backend)
   - To: CertificateRegistry contract
   - Input data: Encoded function call
   - Status: Success ✓
   - Gas used: ~500,000

### Checking Node Status via RPC

**Check if node is syncing:**

```bash
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'

# Response if synced:
{"jsonrpc":"2.0","id":1,"result":false}

# Response if syncing:
{"jsonrpc":"2.0","id":1,"result":{
  "currentBlock":"0x100",
  "highestBlock":"0x200"
}}
```

**Check connected peers:**

```bash
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Response:
{"jsonrpc":"2.0","id":1,"result":"0x3"}  // 3 peers connected
```

**Check if node is mining/validating:**

```bash
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_mining","params":[],"id":1}'

# Response:
{"jsonrpc":"2.0","id":1,"result":true}  // Yes, participating in consensus
```

### Docker Container Logs

**View logs for a validator:**

```bash
# Follow Validator1 logs
docker logs -f validator1

# Output:
INFO [11-26|10:00:00.000] Imported new chain segment    number=500 hash=0xabc...
INFO [11-26|10:00:01.000] Proposed new block            number=501 txs=1 gas=500000
INFO [11-26|10:00:01.500] Committed new block           number=501 hash=0xdef...
```

**View all containers:**

```bash
docker ps

# Output:
CONTAINER ID   IMAGE                    STATUS    PORTS
abc123         quorum:24.4.0            Up        0.0.0.0:8545->8545/tcp (validator1)
def456         quorum:24.4.0            Up        0.0.0.0:8547->8545/tcp (validator2)
...
```

---

## Summary: How It All Works Together

**The full picture:**

```
┌─────────────────────────────────────────────────────────────┐
│ Your Computer (Host)                                         │
│                                                              │
│  ┌────────────────┐                                         │
│  │ Your Backend   │                                         │
│  │ (NestJS)       │                                         │
│  │ Port 3001      │                                         │
│  └───────┬────────┘                                         │
│          │ HTTP POST                                         │
│          │ http://localhost:8545                            │
│          ↓                                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Docker Network: quorum-network                          │ │
│  │                                                         │ │
│  │  ┌──────────────┐  P2P   ┌──────────────┐             │ │
│  │  │ Validator1   │←──────→│ Validator2   │             │ │
│  │  │ :8545 (RPC)  │        │ :8547 (RPC)  │             │ │
│  │  │ :30303 (P2P) │        │ :30303 (P2P) │             │ │
│  │  └──────┬───────┘        └──────┬───────┘             │ │
│  │         │ P2P                   │ P2P                  │ │
│  │         │        ┌──────────────┼──────┐              │ │
│  │         │        │              │      │              │ │
│  │         ↓        ↓              ↓      ↓              │ │
│  │  ┌──────────────┐              ┌──────────────┐      │ │
│  │  │ Validator3   │←─────P2P────→│ Validator4   │      │ │
│  │  │ :8548 (RPC)  │              │ :8549 (RPC)  │      │ │
│  │  │ :30303 (P2P) │              │ :30303 (P2P) │      │ │
│  │  └──────────────┘              └──────────────┘      │ │
│  │                                                        │ │
│  │  All 4 validators share identical blockchain:         │ │
│  │  ├── Block #1 (genesis)                               │ │
│  │  ├── Block #2 ...                                     │ │
│  │  ├── Block #500 (your certificate transaction)        │ │
│  │  └── Block #501 ...                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Storage (persisted on disk):                               │
│  ├── ./data/validator1/geth/chaindata/  (blockchain)       │
│  ├── ./data/validator2/geth/chaindata/                     │
│  ├── ./data/validator3/geth/chaindata/                     │
│  └── ./data/validator4/geth/chaindata/                     │
└──────────────────────────────────────────────────────────────┘
```

**Key points:**

1. **Docker isolation:** Each validator runs in its own container
2. **Shared network:** All containers on `quorum-network` virtual network
3. **P2P mesh:** Every validator talks to every other (fully connected)
4. **RPC access:** Your backend connects to Validator1's port 8545
5. **Consensus:** IBFT ensures all 4 validators agree on blockchain state
6. **Persistence:** Blockchain data stored on host computer, survives restarts
7. **Monitoring:** Explorer, logs, and RPC methods for observability

**For your thesis defense:**

When explaining to supervisor:

1. Show `docker ps` - "These are my 4 validator nodes"
2. Open http://localhost:25000 - "This is the blockchain explorer"
3. Show logs: `docker logs validator1` - "Real-time consensus messages"
4. Stop a validator: `docker stop validator4` - "Network continues"
5. Stop two validators: `docker stop validator3` - "Network halts (need 75%)"

This demonstrates decentralization and fault tolerance!

---

## Next Documents

Now you understand the network architecture. Next documents will explain:

1. **SMART_CONTRACT_EXPLAINED.md:** Line-by-line Solidity code breakdown
2. **CRYPTOGRAPHY_EXPLAINED.md:** How keccak256 and ECDSA work
3. **ETHERS_INTEGRATION.md:** How your backend calls smart contract functions
4. **TRANSACTION_LIFECYCLE.md:** Complete flow from API to blockchain

Continue with these to understand the full system!
