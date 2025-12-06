const hre = require("hardhat");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../backend/.env") });

async function main() {
  console.log("🌱 Seeding admin\n");

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  const userRegistryAddress = process.env.USER_REGISTRY_ADDRESS;

  if (!userRegistryAddress) {
    console.error("❌ USER_REGISTRY_ADDRESS not found in backend .env");
    console.log("Run deploy-user-registry.js first!\n");
    process.exit(1);
  }

  console.log(`Using UserRegistry: ${userRegistryAddress}`);

  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = UserRegistry.attach(userRegistryAddress);

  // Check if admin already exists
  try {
    const existingUser = await userRegistry.getUser(deployerAddress);
    if (existingUser.username && existingUser.username.length > 0) {
      console.log(`⚠️  Admin already registered: ${existingUser.username}`);
      return;
    }
  } catch (error) {
    // User doesn't exist, proceed
  }

  const tx = await userRegistry.registerUser(
    deployerAddress,
    "admin",
    "admin@university.edu",
    true
  );
  await tx.wait();
  console.log(`✅ Admin registered: ${deployerAddress}\n`);

  console.log("🎉 Done! Admin can now login.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
