const ethers = require('ethers');
const fs = require('fs');

const count = process.argv[2] || 5;
const wallets = [];

console.log(`🔐 Generating ${count} test wallets...\n`);

for (let i = 1; i <= count; i++) {
  const wallet = ethers.Wallet.createRandom();
  wallets.push({
    username: `user${i}`,
    address: wallet.address,
    privateKey: wallet.privateKey,
  });
  console.log(`${i}. ${wallet.address}`);
}

fs.writeFileSync('test-wallets.json', JSON.stringify(wallets, null, 2));
console.log(`\n✅ Saved to test-wallets.json`);
