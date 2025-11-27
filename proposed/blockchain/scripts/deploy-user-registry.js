const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying UserRegistry...");

  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();

  const address = await userRegistry.getAddress();

  console.log(`✅ UserRegistry deployed to: ${address}`);
  console.log("\n⚠️ IMPORTANT: Save this address!");
  console.log(`Add this to your backend .env file:`);
  console.log(`USER_REGISTRY_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
