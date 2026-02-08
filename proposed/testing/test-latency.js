const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const PRIVATE_KEY =
  "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const USER_REGISTRY = "0x42699A7612A82f1d9C36148af9C77354759b210b";
const CERT_REGISTRY = "0xa50a51c09a5c451C52BB714527E1974b686D8e77";

const userABI = JSON.parse(
  fs.readFileSync(
    "../blockchain/artifacts/contracts/UserRegistry.sol/UserRegistry.json"
  )
).abi;
const certABI = JSON.parse(
  fs.readFileSync(
    "../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  )
).abi;

const userContract = new ethers.Contract(USER_REGISTRY, userABI, wallet);
const certContract = new ethers.Contract(CERT_REGISTRY, certABI, wallet);

async function measureConcurrentLatency(name, concurrency, fn) {
  console.log(`\n📊 Testing: ${name} (${concurrency} concurrent transactions)`);
  const results = [];

  // Get starting nonce BEFORE creating promises
  const startingNonce = await wallet.getNonce();
  console.log(`  🔢 Starting nonce: ${startingNonce}`);

  const promises = [];
  const startTime = Date.now();

  for (let i = 0; i < concurrency; i++) {
    process.stdout.write(`  Starting TX ${i + 1}/${concurrency}... `);
    const txStart = Date.now();
    const assignedNonce = startingNonce + i; // Each tx gets unique nonce

    const promise = fn(i, assignedNonce)
      .then(() => {
        const latency = (Date.now() - txStart) / 1000;
        results.push(latency);
        console.log(`✅ ${latency.toFixed(2)}s`);
        return latency;
      })
      .catch((err) => {
        console.log(`❌ Failed: ${err.message.substring(0, 50)}`);
        return null;
      });
    promises.push(promise);
  }

  console.log(
    `  ⏳ Waiting for all ${concurrency} transactions to complete...`
  );
  await Promise.all(promises);

  const totalTime = (Date.now() - startTime) / 1000;
  const validResults = results.filter((r) => r !== null);

  if (validResults.length === 0) {
    console.log(`  ❌ All transactions failed!`);
    return { avg: 0, p95: 0, totalTime: totalTime, successRate: 0 };
  }

  const avg = validResults.reduce((a, b) => a + b) / validResults.length;
  const sorted = validResults.sort((a, b) => a - b);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p95 = sorted[p95Index] || sorted[sorted.length - 1];
  const successRate = ((validResults.length / concurrency) * 100).toFixed(1);

  console.log(
    `  ✅ Average: ${avg.toFixed(2)}s | P95: ${p95.toFixed(
      2
    )}s | Total Time: ${totalTime.toFixed(2)}s | Success: ${successRate}%`
  );
  return { avg, p95, totalTime, successRate: parseFloat(successRate) };
}

(async () => {
  console.log(
    "🚀 Starting Concurrency Latency Tests - Finding the Knee of the Curve"
  );
  console.log(
    "⏱️  Testing concurrency tiers: 1, 10, 40, 80, 150, 250, 350, 500 transactions\n"
  );
  console.log("⚠️  This test will take approximately 20-30 minutes\n");

  const timestamp = Date.now();
  const concurrencyLevels = [1, 10, 40, 80, 150, 250, 350, 500];
  const results = {};

  console.log("\n" + "=".repeat(80));
  console.log("TEST: Certificate Issuance Under Concurrent Load");
  console.log("=".repeat(80));

  for (const concurrency of concurrencyLevels) {
    let counter = 0;
    const result = await measureConcurrentLatency(
      "Certificate Issuance",
      concurrency,
      async (i, nonce) => {
        const uniqueId = `${timestamp}_c${concurrency}_${counter++}`;
        const hash = ethers.keccak256(
          ethers.toUtf8Bytes(`cert-concurrent-${uniqueId}`)
        );
        const sig = await wallet.signMessage(ethers.getBytes(hash));
        const tx = await certContract.issueCertificate(
          hash,
          `CC${uniqueId}`,
          `Concurrent${uniqueId}`,
          "BS",
          "CS",
          350,
          "Test Uni",
          sig,
          wallet.address,
          { nonce } // Explicitly set nonce for concurrent transactions
        );
        await tx.wait();
      }
    );
    results[concurrency] = result;

    // Add delay between tiers
    if (concurrency < 500) {
      const pauseTime = concurrency >= 250 ? 15 : concurrency >= 150 ? 10 : 5;
      console.log(`  ⏸️  Pausing ${pauseTime} seconds before next tier...\n`);
      await new Promise((r) => setTimeout(r, pauseTime * 1000));
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 KNEE OF THE CURVE ANALYSIS");
  console.log("=".repeat(80));
  console.log(
    "Concurrency | Avg Latency | P95 Latency | Total Time | Success Rate | vs Baseline"
  );
  console.log("-".repeat(80));

  const baseline = results[1];
  let kneeFound = false;
  let kneePoint = null;
  let softKnee = null;

  for (const concurrency of concurrencyLevels) {
    const r = results[concurrency];
    const latencyIncrease = baseline
      ? (((r.avg - baseline.avg) / baseline.avg) * 100).toFixed(1)
      : 0;

    // Detect soft knee (30% increase) and hard knee (100% increase)
    let marker = "";
    if (latencyIncrease > 100 && !kneeFound) {
      marker = " 💥 HARD KNEE";
      kneeFound = true;
      kneePoint = concurrency;
    } else if (latencyIncrease > 30 && !softKnee && !kneeFound) {
      marker = " ⚠️  SOFT KNEE";
      softKnee = concurrency;
    }

    if (r.successRate < 100) {
      marker += " ❌ FAILURES";
    }

    console.log(
      `${String(concurrency).padEnd(11)} | ${r.avg
        .toFixed(2)
        .padEnd(11)}s | ${r.p95.toFixed(2).padEnd(11)}s | ${r.totalTime
        .toFixed(2)
        .padEnd(10)}s | ${r.successRate.toFixed(1).padEnd(12)}% | +${String(
        latencyIncrease
      ).padEnd(7)}%${marker}`
    );
  }

  console.log("=".repeat(80));
  if (kneePoint) {
    console.log(
      `\n🎯 HARD KNEE OF THE CURVE: ${kneePoint} concurrent transactions`
    );
    console.log(`   Latency increased by >100% (doubled) compared to baseline`);
  } else if (softKnee) {
    console.log(
      `\n⚠️  SOFT KNEE OF THE CURVE: ${softKnee} concurrent transactions`
    );
    console.log(`   Latency increased by >30% compared to baseline`);
    console.log(`   System still functional but performance degrading`);
  } else {
    console.log(
      `\n✅ NO KNEE DETECTED: System handles up to 500 concurrent transactions efficiently`
    );
    console.log(`   This indicates excellent horizontal scalability`);
  }

  console.log("\n💡 NOTE: Performance benefits from private GoQuorum network:");
  console.log("   - No network latency (localhost)");
  console.log("   - No gas competition or mempool congestion");
  console.log("   - Dedicated validator nodes");
  console.log("   - Optimized 2-second block time");
  console.log("   - Public networks would show degradation much earlier");
  console.log("=".repeat(80));
})();
