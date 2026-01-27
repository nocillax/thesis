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

async function measureGas(name, fn) {
  console.log(`\n⛽ Testing: ${name}`);
  const results = [];
  const iterations = 10;
  for (let i = 0; i < iterations; i++) {
    process.stdout.write(`  Run ${i + 1}/${iterations}... `);
    const receipt = await fn(i);
    const gas = Number(receipt.gasUsed);
    results.push(gas);
    console.log(`${gas.toLocaleString()} gas`);
  }
  const avg = Math.round(results.reduce((a, b) => a + b) / results.length);
  const min = Math.min(...results);
  const max = Math.max(...results);
  console.log(
    `  ✅ Average: ${avg.toLocaleString()} gas (min: ${min.toLocaleString()}, max: ${max.toLocaleString()})`
  );
  return avg;
}

(async () => {
  console.log("🚀 Starting Gas Cost Analysis");
  console.log("⛽ Each test runs 10 iterations\n");

  const timestamp = Date.now();

  const regGas = await measureGas("User Registration", async (i) => {
    const w = ethers.Wallet.createRandom();
    const tx = await userContract.registerUser(
      w.address,
      `gas${timestamp}${i}`,
      `gas${timestamp}${i}@test.com`,
      false
    );
    return await tx.wait();
  });

  const issueGas = await measureGas("Certificate Issuance", async (i) => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(`gas-${timestamp}-${i}`));
    const sig = await wallet.signMessage(ethers.getBytes(hash));
    const tx = await certContract.issueCertificate(
      hash,
      `GAS${timestamp}${i}`,
      `GasTest${timestamp}${i}`,
      "BS",
      "CS",
      350,
      "Test",
      sig,
      wallet.address
    );
    return await tx.wait();
  });

  // Get events for verification test
  const events = await certContract.queryFilter(
    certContract.filters.CertificateIssued()
  );

  console.log("\n⛽ Testing: Certificate Verification");
  if (events.length > 0) {
    // Estimate gas if called from another contract
    const estimatedGas = await certContract.verifyCertificate.estimateGas(
      events[0].args.cert_hash
    );
    console.log(`  ℹ️  View function - 0 gas when called off-chain`);
    console.log(
      `  ℹ️  Estimated ${Number(
        estimatedGas
      ).toLocaleString()} gas if called from contract`
    );
  }

  const revokeGas = await measureGas("Certificate Revocation", async (i) => {
    const events = await certContract.queryFilter(
      certContract.filters.CertificateIssued()
    );
    const tx = await certContract.revokeCertificate(
      events[i].args.cert_hash,
      wallet.address,
      "Gas test"
    );
    return await tx.wait();
  });

  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL GAS RESULTS (n=10)");
  console.log("=".repeat(60));
  console.log(`User Registration:        ${regGas.toLocaleString()} gas`);
  console.log(`Certificate Issuance:     ${issueGas.toLocaleString()} gas`);
  console.log(
    `Certificate Verification: 0 gas (view function - free off-chain)`
  );
  console.log(`Certificate Revocation:   ${revokeGas.toLocaleString()} gas`);
  console.log("=".repeat(60));
})();
