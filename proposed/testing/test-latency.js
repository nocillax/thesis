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

async function measureLatency(name, fn) {
  console.log(`\n📊 Testing: ${name}`);
  const results = [];
  const iterations = 30;
  for (let i = 0; i < iterations; i++) {
    process.stdout.write(`  Run ${i + 1}/${iterations}... `);
    const start = Date.now();
    await fn(i);
    const latency = (Date.now() - start) / 1000;
    results.push(latency);
    console.log(`${latency.toFixed(2)}s`);
  }
  const avg = results.reduce((a, b) => a + b) / results.length;
  const sorted = results.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const stdDev = Math.sqrt(
    results.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / results.length
  );
  console.log(
    `  ✅ Average: ${avg.toFixed(2)}s | Median: ${median.toFixed(
      2
    )}s | StdDev: ±${stdDev.toFixed(2)}s`
  );
  return { avg, median, stdDev };
}

(async () => {
  console.log("🚀 Starting Transaction Latency Tests");
  console.log(
    "⏱️  Each test runs 30 iterations for statistical significance\n"
  );

  const timestamp = Date.now();

  const registerLatency = await measureLatency(
    "User Registration",
    async (i) => {
      const newWallet = ethers.Wallet.createRandom();
      const tx = await userContract.registerUser(
        newWallet.address,
        `user${timestamp}${i}`,
        `user${timestamp}${i}@test.com`,
        false
      );
      await tx.wait();
    }
  );

  const issueLatency = await measureLatency(
    "Certificate Issuance",
    async (i) => {
      const hash = ethers.keccak256(
        ethers.toUtf8Bytes(`cert${timestamp}-${i}`)
      );
      const sig = await wallet.signMessage(ethers.getBytes(hash));
      const tx = await certContract.issueCertificate(
        hash,
        `STU${timestamp}${i}`,
        `Student${timestamp}${i}`,
        "BS",
        "CS",
        350,
        "Test Uni",
        sig,
        wallet.address
      );
      await tx.wait();
    }
  );

  const verifyLatency = await measureLatency(
    "Certificate Verification",
    async (i) => {
      const events = await certContract.queryFilter(
        certContract.filters.CertificateIssued()
      );
      if (events.length > 0) {
        await certContract.verifyCertificate(events[0].args.cert_hash);
      }
    }
  );

  const revokeLatency = await measureLatency(
    "Certificate Revocation",
    async (i) => {
      const events = await certContract.queryFilter(
        certContract.filters.CertificateIssued()
      );
      if (events[i]) {
        const tx = await certContract.revokeCertificate(
          events[i].args.cert_hash,
          wallet.address,
          "Test revoke"
        );
        await tx.wait();
      }
    }
  );

  console.log("\n" + "=".repeat(60));
  console.log("📈 FINAL RESULTS (n=30)");
  console.log("=".repeat(60));
  console.log(
    `User Registration:        ${registerLatency.avg.toFixed(
      2
    )}s ± ${registerLatency.stdDev.toFixed(2)}s`
  );
  console.log(
    `Certificate Issuance:     ${issueLatency.avg.toFixed(
      2
    )}s ± ${issueLatency.stdDev.toFixed(2)}s`
  );
  console.log(
    `Certificate Verification: ${verifyLatency.avg.toFixed(
      2
    )}s ± ${verifyLatency.stdDev.toFixed(2)}s`
  );
  console.log(
    `Certificate Revocation:   ${revokeLatency.avg.toFixed(
      2
    )}s ± ${revokeLatency.stdDev.toFixed(2)}s`
  );
  console.log("=".repeat(60));
})();
