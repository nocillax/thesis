const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function getConfiguredPrivateKey() {
  const networkConfig = hre.config.networks?.[hre.network.name];
  if (
    networkConfig &&
    Array.isArray(networkConfig.accounts) &&
    typeof networkConfig.accounts[0] === "string"
  ) {
    return networkConfig.accounts[0];
  }

  if (process.env.PRIVATE_KEY) {
    return process.env.PRIVATE_KEY;
  }

  // Hardhat built-in account #0 (dev only fallback).
  if (hre.network.name === "hardhat") {
    return "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  }

  throw new Error(
    `No deployer private key found for network '${hre.network.name}'. Set PRIVATE_KEY in backend/.env or configure networks.${hre.network.name}.accounts[0].`,
  );
}

async function main() {
  console.log("🚀 DEV DEPLOYMENT - Full reset\n");
  console.log(`🌐 Network: ${hre.network.name}`);

  const deployerPrivateKey = getConfiguredPrivateKey();
  const deployer = new hre.ethers.Wallet(
    deployerPrivateKey,
    hre.ethers.provider,
  );
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await hre.ethers.provider.getBalance(deployerAddress);

  if (deployerBalance === 0n) {
    throw new Error(
      `Configured deployer ${deployerAddress} has 0 balance on '${hre.network.name}'.`,
    );
  }

  console.log(`👤 Deployer: ${deployerAddress}\n`);

  const UserRegistry = await hre.ethers.getContractFactory(
    "UserRegistry",
    deployer,
  );
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log(`✅ UserRegistry: ${userRegistryAddress}`);

  const CertificateRegistry = await hre.ethers.getContractFactory(
    "CertificateRegistry",
    deployer,
  );
  const certificateRegistry = await CertificateRegistry.deploy(
    userRegistryAddress,
  );
  await certificateRegistry.waitForDeployment();
  const certificateRegistryAddress = await certificateRegistry.getAddress();
  console.log(`✅ CertificateRegistry: ${certificateRegistryAddress}`);

  const tx = await userRegistry.registerUser(
    deployerAddress,
    "admin",
    "admin@university.edu",
    true,
  );
  await tx.wait();
  console.log(`✅ Admin registered: ${deployerAddress}`);

  const backendAbisPath = path.join(
    __dirname,
    "../../backend/src/blockchain/abis",
  );
  if (!fs.existsSync(backendAbisPath)) {
    fs.mkdirSync(backendAbisPath, { recursive: true });
  }

  const certAbiSource = path.join(
    __dirname,
    "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json",
  );
  const certAbiDest = path.join(backendAbisPath, "CertificateRegistry.json");
  fs.copyFileSync(certAbiSource, certAbiDest);

  const userAbiSource = path.join(
    __dirname,
    "../artifacts/contracts/UserRegistry.sol/UserRegistry.json",
  );
  const userAbiDest = path.join(backendAbisPath, "UserRegistry.json");
  fs.copyFileSync(userAbiSource, userAbiDest);
  console.log(`✅ ABIs copied to backend\n`);

  console.log("⚠️  Update backend .env:");
  console.log(`USER_REGISTRY_ADDRESS=${userRegistryAddress}`);
  console.log(`CONTRACT_ADDRESS=${certificateRegistryAddress}`);
  console.log(`ADMIN_WALLET_ADDRESS=${deployerAddress}\n`);
  console.log(`PRIVATE_KEY=${deployerPrivateKey}\n`);

  console.log("🎉 Done! Restart backend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
