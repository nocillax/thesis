const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying UserRegistry\n");

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log(`✅ UserRegistry: ${userRegistryAddress}`);

  const backendAbisPath = path.join(
    __dirname,
    "../../backend/src/blockchain/abis"
  );
  if (!fs.existsSync(backendAbisPath)) {
    fs.mkdirSync(backendAbisPath, { recursive: true });
  }

  const userAbiSource = path.join(
    __dirname,
    "../artifacts/contracts/UserRegistry.sol/UserRegistry.json"
  );
  const userAbiDest = path.join(backendAbisPath, "UserRegistry.json");
  fs.copyFileSync(userAbiSource, userAbiDest);
  console.log(`✅ ABI copied to backend\n`);

  console.log("⚠️  Update backend .env:");
  console.log(`USER_REGISTRY_ADDRESS=${userRegistryAddress}`);
  console.log(`ADMIN_WALLET_ADDRESS=${deployerAddress}\n`);

  console.log(
    "📝 Next: Run seed-admin.js, then deploy-certificate-registry.js"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
