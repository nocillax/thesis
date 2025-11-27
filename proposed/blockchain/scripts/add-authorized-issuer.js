const hre = require("hardhat");

async function main() {
  const contractAddress = "0xe135783649BfA7c9c4c6F8E528C7f56166efC8a6";

  // Wallets to authorize (from database)
  const walletsToAuthorize = [
    "0x08Bd40C733bC5fA1eDD5ae391d2FAC32A42910E2", // admin user
    "0x5e341B101a456973b5d97243f49A93A3989dAdF9", // asif user
  ];

  console.log(`📝 Contract: ${contractAddress}`);

  const CertificateRegistry = await hre.ethers.getContractFactory(
    "CertificateRegistry"
  );
  const contract = CertificateRegistry.attach(contractAddress);

  for (const wallet of walletsToAuthorize) {
    console.log(`🔑 Authorizing wallet: ${wallet}...`);
    const tx = await contract.addAuthorizedIssuer(wallet);
    await tx.wait();
    console.log(`✅ Wallet ${wallet} is now authorized!`);
  }

  console.log("\n✅ All wallets authorized!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
