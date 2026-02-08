const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const PRIVATE_KEY =
  "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const CERT_REGISTRY = "0xa50a51c09a5c451C52BB714527E1974b686D8e77";
const certABI = JSON.parse(
  fs.readFileSync(
    "../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  )
).abi;
const certContract = new ethers.Contract(CERT_REGISTRY, certABI, wallet);

async function testThroughput(txPerMin, testRun) {
  const interval = 60000 / txPerMin; // ms between each tx
  let success = 0,
    failed = 0;
  const runId = `${Date.now()}_${testRun}`;
  const errors = {};

  console.log(
    `\n📈 Testing: ${txPerMin} tx/min (1 tx every ${interval.toFixed(0)}ms)`
  );

  // For high loads (250+), use burst mode
  const useBurstMode = txPerMin >= 250;

  if (useBurstMode) {
    console.log(
      `  ⚡ BURST MODE: Sending all ${txPerMin} transactions rapidly`
    );

    // Get starting nonce BEFORE creating transactions
    const startingNonce = await wallet.getNonce();
    console.log(`  🔢 Starting nonce: ${startingNonce}`);

    const promises = [];

    for (let i = 0; i < txPerMin; i++) {
      const assignedNonce = startingNonce + i; // Each tx gets unique nonce

      const txPromise = (async (index, nonce) => {
        const txStart = Date.now();
        try {
          const uniqueId = `${runId}_${index}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const hash = ethers.keccak256(
            ethers.toUtf8Bytes(`throughput-${uniqueId}`)
          );
          const sig = await wallet.signMessage(ethers.getBytes(hash));
          const tx = await certContract.issueCertificate(
            hash,
            `THR${uniqueId}`.substring(0, 50),
            `Throughput${index}`,
            "BS",
            "CS",
            350,
            "Test",
            sig,
            wallet.address,
            { nonce } // Explicitly set nonce
          );
          await tx.wait();
          success++;
          if (index % 50 === 0 || index === txPerMin - 1) {
            console.log(
              `  ✅ TX ${index + 1}/${txPerMin} - ${Date.now() - txStart}ms`
            );
          }
        } catch (e) {
          failed++;
          const errorType = e.message.includes("nonce")
            ? "Nonce Error"
            : e.message.includes("timeout")
            ? "Timeout"
            : e.message.includes("replacement")
            ? "Replacement"
            : e.message.includes("already")
            ? "Duplicate"
            : "Other";
          errors[errorType] = (errors[errorType] || 0) + 1;
          if (index % 50 === 0 || index === txPerMin - 1) {
            console.log(`  ❌ TX ${index + 1}/${txPerMin} - ${errorType}`);
          }
        }
      })(i, assignedNonce);

      promises.push(txPromise);

      // Small delay to prevent overwhelming the system
      if (i % 10 === 9) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    console.log(`  ⏳ Waiting for all ${txPerMin} transactions to settle...`);
    await Promise.all(promises);
  } else {
    // Normal mode for lower loads
    for (let i = 0; i < txPerMin; i++) {
      process.stdout.write(`  TX ${i + 1}/${txPerMin}... `);
      const txStart = Date.now();
      try {
        const uniqueId = `${runId}_${i}_${txStart}`;
        const hash = ethers.keccak256(
          ethers.toUtf8Bytes(`throughput-${uniqueId}`)
        );
        const sig = await wallet.signMessage(ethers.getBytes(hash));
        const tx = await certContract.issueCertificate(
          hash,
          `THR${runId}${i}`,
          `Throughput${i}`,
          "BS",
          "CS",
          350,
          "Test",
          sig,
          wallet.address
        );
        await tx.wait();
        success++;
        console.log(`✅ ${Date.now() - txStart}ms`);
      } catch (e) {
        failed++;
        const errorType = e.message.includes("nonce")
          ? "Nonce"
          : e.message.includes("timeout")
          ? "Timeout"
          : e.message.includes("already")
          ? "Duplicate"
          : "Other";
        errors[errorType] = (errors[errorType] || 0) + 1;
        console.log(`❌ ${errorType}`);
      }
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  const successRate = ((success / txPerMin) * 100).toFixed(2);
  const failureRate = ((failed / txPerMin) * 100).toFixed(2);

  console.log(`  ✅ Success: ${success}/${txPerMin} (${successRate}%)`);
  console.log(`  ❌ Failures: ${failed}/${txPerMin} (${failureRate}%)`);

  if (Object.keys(errors).length > 0) {
    console.log(`  📋 Error Breakdown:`);
    for (const [type, count] of Object.entries(errors)) {
      console.log(`     - ${type}: ${count}`);
    }
  }

  return {
    successRate: parseFloat(successRate),
    failureRate: parseFloat(failureRate),
    errors,
  };
}

(async () => {
  console.log("🚀 Starting High-Intensity Throughput Stress Test");
  console.log("📊 Finding system breaking point across multiple load tiers\n");
  console.log("⚠️  WARNING: This test will take approximately 15-20 minutes\n");

  const tiers = [1, 10, 50, 100, 250, 500, 1000];
  const results = {};

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    console.log("\n" + "=".repeat(80));
    console.log(`TIER ${i + 1}/${tiers.length}: ${tier} tx/min`);
    console.log("=".repeat(80));

    const result = await testThroughput(tier, `tier${i + 1}`);
    results[tier] = result;

    // Pause between tiers
    if (i < tiers.length - 1) {
      console.log(`\n  ⏸️  Pausing 10 seconds before next tier...\n`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 STRESS TEST RESULTS - SYSTEM DEGRADATION ANALYSIS");
  console.log("=".repeat(80));
  console.log("Load (tx/min) | Success Rate | Failure Rate | Status");
  console.log("-".repeat(80));

  let breakingPoint = null;

  for (const tier of tiers) {
    const r = results[tier];
    const status =
      r.successRate >= 95
        ? "✅ Stable"
        : r.successRate >= 80
        ? "⚠️  Degraded"
        : r.successRate >= 50
        ? "❌ Unstable"
        : "💥 Collapsed";

    if (!breakingPoint && r.successRate < 80) {
      breakingPoint = tier;
    }

    console.log(
      `${String(tier).padEnd(13)} | ${String(r.successRate + "%").padEnd(
        12
      )} | ${String(r.failureRate + "%").padEnd(12)} | ${status}`
    );

    if (Object.keys(r.errors).length > 0) {
      for (const [type, count] of Object.entries(r.errors)) {
        console.log(`              └─ ${type}: ${count} occurrences`);
      }
    }
  }

  console.log("=".repeat(80));
  if (breakingPoint) {
    console.log(
      `\n💥 SYSTEM BREAKING POINT: ${breakingPoint} tx/min (success rate dropped below 80%)`
    );
  } else {
    console.log(
      `\n✅ SYSTEM STABLE: Handled all tiers up to 1000 tx/min with >80% success`
    );
  }
  console.log("=".repeat(80));
})();
