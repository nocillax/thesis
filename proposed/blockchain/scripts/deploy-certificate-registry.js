const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../backend/.env") });

async function main() {
  console.log("🚀 Deploying CertificateRegistry\n");

  const userRegistryAddress = process.env.USER_REGISTRY_ADDRESS;

  if (!userRegistryAddress) {
    console.error("❌ USER_REGISTRY_ADDRESS not found in backend .env");
    console.log("Run deploy-user-registry.js first!\n");
    process.exit(1);
  }

  console.log(`Using UserRegistry: ${userRegistryAddress}`);

  const CertificateRegistry = await hre.ethers.getContractFactory(
    "CertificateRegistry"
  );
  const certificateRegistry = await CertificateRegistry.deploy(
    userRegistryAddress
  );
  await certificateRegistry.waitForDeployment();
  const certificateRegistryAddress = await certificateRegistry.getAddress();
  console.log(`✅ CertificateRegistry: ${certificateRegistryAddress}`);

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
  console.log(`✅ ABI copied to backend\n`);

  console.log("⚠️  Update backend .env:");
  console.log(`CONTRACT_ADDRESS=${certificateRegistryAddress}\n`);

  console.log("🎉 Done! All users preserved. Restart backend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
