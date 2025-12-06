const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 DEV DEPLOYMENT - Full reset\n");

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log(`✅ UserRegistry: ${userRegistryAddress}`);

  const CertificateRegistry = await hre.ethers.getContractFactory(
    "CertificateRegistry"
  );
  const certificateRegistry = await CertificateRegistry.deploy(
    userRegistryAddress
  );
  await certificateRegistry.waitForDeployment();
  const certificateRegistryAddress = await certificateRegistry.getAddress();
  console.log(`✅ CertificateRegistry: ${certificateRegistryAddress}`);

  const tx = await userRegistry.registerUser(
    deployerAddress,
    "admin",
    "admin@university.edu",
    true
  );
  await tx.wait();
  console.log(`✅ Admin registered: ${deployerAddress}`);

  const backendAbisPath = path.join(
    __dirname,
    "../../backend/src/blockchain/abis"
  );
  if (!fs.existsSync(backendAbisPath)) {
    fs.mkdirSync(backendAbisPath, { recursive: true });
  }

  const certAbiSource = path.join(
    __dirname,
    "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  );
  const certAbiDest = path.join(backendAbisPath, "CertificateRegistry.json");
  fs.copyFileSync(certAbiSource, certAbiDest);

  const userAbiSource = path.join(
    __dirname,
    "../artifacts/contracts/UserRegistry.sol/UserRegistry.json"
  );
  const userAbiDest = path.join(backendAbisPath, "UserRegistry.json");
  fs.copyFileSync(userAbiSource, userAbiDest);
  console.log(`✅ ABIs copied to backend\n`);

  console.log("⚠️  Update backend .env:");
  console.log(`USER_REGISTRY_ADDRESS=${userRegistryAddress}`);
  console.log(`CONTRACT_ADDRESS=${certificateRegistryAddress}`);
  console.log(`ADMIN_WALLET_ADDRESS=${deployerAddress}\n`);

  console.log("🎉 Done! Restart backend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
