const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateRegistry to Quorum network...");

  const CertificateRegistry = await hre.ethers.getContractFactory(
    "CertificateRegistry"
  );
  const registry = await CertificateRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`\n✅ CertificateRegistry deployed to: ${address}`);
  console.log("\n⚠️  IMPORTANT: Save this address!");
  console.log(`Add this to your backend .env file:`);
  console.log(`CONTRACT_ADDRESS=${address}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
