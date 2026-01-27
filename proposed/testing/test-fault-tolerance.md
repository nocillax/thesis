T5: Fault Tolerance Test - Exact Steps
What you're testing: QBFT consensus continues with 1 node down, fails with 2 nodes down (needs 3 out of 4 validators)

Step 1: Baseline Test (All nodes running)

# Terminal 1: Check all validators are running

cd proposed/quorum-test-network
docker ps | grep validator

# Should see validator1, validator2, validator3, validator4 all "Up"

# Terminal 2: Issue a certificate (use backend API or direct contract call)

cd proposed/backend
curl -X POST http://localhost:3001/api/blockchain/certificates \
 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"student_id":"FT-BASELINE","student_name":"Baseline Test","degree":"BS","program":"CS","cgpa":3.5,"issuing_authority":"Test University"}'

# Record: Transaction hash + block number from response

# Expected: SUCCESS

Step 2: Single Node Failure (2/3 consensus still possible)

# Terminal 1: Stop one validator

docker stop validator4

# Verify it's down

docker ps | grep validator

# Should see only validator1, validator2, validator3

# Terminal 2: Issue another certificate immediately

curl -X POST http://localhost:3001/api/blockchain/certificates \
 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"student_id":"FT-ONEDOWN","student_name":"One Node Down","degree":"BS","program":"CS","cgpa":3.6,"issuing_authority":"Test University"}'

# Record:

# - Transaction hash + block number

# - Time taken (should be similar to baseline)

# Expected: SUCCESS (3 validators still reach consensus)

Step 3: Check Block Consistency

# Check block numbers match on running validators

docker exec validator1 geth --exec "eth.blockNumber" attach /data/geth.ipc
docker exec validator2 geth --exec "eth.blockNumber" attach /data/geth.ipc
docker exec validator3 geth --exec "eth.blockNumber" attach /data/geth.ipc

# All three should return SAME block number

# Record: Block number (e.g., 145, 145, 145)

Step 4: Restart Failed Node

# Start validator4 again

docker start validator4

# Wait 10 seconds for it to sync

# Check its block number

docker exec validator4 geth --exec "eth.blockNumber" attach /data/geth.ipc

# Should match other validators (it syncs automatically)

# Record: Block number matches? YES/NO

Step 5: Two Nodes Down (Should FAIL - not enough for consensus)

# Stop TWO validators (leaves only 2 running)

docker stop validator3 validator4

# Verify only 2 remain

docker ps | grep validator

# Should see only validator1, validator2

# Try to issue certificate

curl -X POST http://localhost:3001/api/blockchain/certificates \
 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"student_id":"FT-TWODOWN","student_name":"Two Nodes Down","degree":"BS","program":"CS","cgpa":3.7,"issuing_authority":"Test University"}'

# Record:

# - Does it timeout? (YES - expected)

# - Error message

# Expected: FAILURE or TIMEOUT (2/4 validators cannot reach QBFT consensus)

Step 6: Restore System

# Restart all validators

docker start validator3 validator4

# Verify all running

docker ps | grep validator

# Check all block numbers match

docker exec validator1 geth --exec "eth.blockNumber" attach /data/geth.ipc
docker exec validator2 geth --exec "eth.blockNumber" attach /data/geth.ipc
docker exec validator3 geth --exec "eth.blockNumber" attach /data/geth.ipc
docker exec validator4 geth --exec "eth.blockNumber" attach /data/geth.ipc

# Record: Ledger divergence? NO (all blocks should be identical)

What to Record in Journal
Scenario Validators Running Result Observation
Baseline 4/4 ✅ Success TX confirmed in ~2.X seconds
Single node failure 3/4 ✅ Success TX confirmed in ~2.X seconds (no delay)
Post-failure sync 4/4 (after restart) ✅ Synced validator4 caught up to same block number
Two nodes down 2/4 ❌ Failure Timeout after 30s (consensus impossible)
Ledger divergence N/A ✅ None All validators at identical block height
Key Points for Journal:

QBFT tolerates f = (n-1)/3 failures (1 out of 4 validators)
System maintains availability with 3/4 nodes
Failed nodes sync automatically on restart
No ledger divergence observed
Finality preserved (no block reorganization)
