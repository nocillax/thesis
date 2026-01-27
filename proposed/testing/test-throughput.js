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

  console.log(
    `\n📈 Testing: ${txPerMin} tx/min (1 tx every ${interval.toFixed(0)}ms)`
  );

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
      console.log(`❌ failed`);
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  const successRate = ((success / txPerMin) * 100).toFixed(2);
  console.log(
    `  ✅ Result: ${success}/${txPerMin} successful (${successRate}%)`
  );
  return successRate;
}

(async () => {
  console.log("🚀 Starting Throughput Analysis");
  console.log("📊 Testing system capacity under varying load\n");

  const rate10 = await testThroughput(10, "run1");
  const rate50 = await testThroughput(50, "run2");
  const rate100 = await testThroughput(100, "run3");

  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL THROUGHPUT RESULTS");
  console.log("=".repeat(60));
  console.log(`10 tx/min:   ${rate10}% success rate`);
  console.log(`50 tx/min:   ${rate50}% success rate`);
  console.log(`100 tx/min:  ${rate100}% success rate`);
  console.log("=".repeat(60));
})();
