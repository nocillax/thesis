const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts and seeding admin...\n");

  // Get deployer wallet (from PRIVATE_KEY in hardhat config)
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`Deployer wallet: ${deployerAddress}\n`);

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

  // Register the deployer wallet as admin (same wallet that backend uses)
  console.log("3. Registering deployer as admin on blockchain...");
  console.log(`   Admin wallet: ${deployerAddress}`);
  
  const tx = await userRegistry.registerUser(
    deployerAddress,
    "admin",
    "admin@university.edu",
    true  // is_admin = true
  );
  await tx.wait();
  
  console.log(`✅ Admin registered successfully!\n`);

  // Verify admin registration
  const [username, email, registrationDate, isAuthorized, isAdmin] = await userRegistry.getUser(deployerAddress);
  console.log("4. Verifying admin registration:");
  console.log(`   Username: ${username}`);
  console.log(`   Email: ${email}`);
  console.log(`   Is Admin: ${isAdmin}`);
  console.log(`   Is Authorized: ${isAuthorized}\n`);

  console.log("⚠️  IMPORTANT: Save these values!");
  console.log("Add these to your backend .env file:");
  console.log(`USER_REGISTRY_ADDRESS=${userRegistryAddress}`);
  console.log(`CONTRACT_ADDRESS=${certificateRegistryAddress}`);
  console.log(`ADMIN_WALLET_ADDRESS=${deployerAddress}\n`);
  
  console.log("🎉 Setup complete! Admin can now login with wallet signature.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
