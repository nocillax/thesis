const hre = require("hardhat");

async function main() {
  const userRegistryAddress = "0x47b33c2D3e928FDf2c0A82FcD7042Ae0cFd5862A";
  const walletToRegister = "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73";
  
  console.log("Registering wallet as admin...");
  
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = UserRegistry.attach(userRegistryAddress);
  
  const tx = await userRegistry.registerUser(
    walletToRegister,
    "admin2",
    "admin2@university.edu",
    true
  );
  await tx.wait();
  
  console.log("✅ Registered:", walletToRegister);
}

main().then(() => process.exit(0)).catch(console.error);
