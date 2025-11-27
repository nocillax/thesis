const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Quorum network...\n");

  // Deploy UserRegistry first
  console.log("1. Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log(`✅ UserRegistry deployed to: ${userRegistryAddress}\n`);

  // Deploy CertificateRegistry with UserRegistry address
  console.log("2. Deploying CertificateRegistry...");
  const CertificateRegistry = await hre.ethers.getContractFactory(
    "CertificateRegistry"
  );
  const certificateRegistry = await CertificateRegistry.deploy(
    userRegistryAddress
  );
  await certificateRegistry.waitForDeployment();
  const certificateRegistryAddress = await certificateRegistry.getAddress();
  console.log(
    `✅ CertificateRegistry deployed to: ${certificateRegistryAddress}\n`
  );

  console.log("⚠️  IMPORTANT: Save these addresses!");
  console.log("Add these to your backend .env file:");
  console.log(`USER_REGISTRY_ADDRESS=${userRegistryAddress}`);
  console.log(`CONTRACT_ADDRESS=${certificateRegistryAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
