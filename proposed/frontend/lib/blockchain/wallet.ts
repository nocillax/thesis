import { ethers } from "ethers";

export interface WalletConnection {
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
}

// Check if wallet extension is installed (window.ethereum)
export function isWalletInstalled(): boolean {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
}

// Connect to Rabby wallet
export async function connectWallet(): Promise<string> {
  if (!isWalletInstalled()) {
    throw new Error("No wallet extension found. Please install Rabby wallet.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request account access
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return address;
}

// Sign message for authentication
export async function signMessage(message: string): Promise<string> {
  if (!isWalletInstalled()) {
    throw new Error("No wallet extension found.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);

  return signature;
}

// Create login message with timestamp
export function createLoginMessage(): string {
  const timestamp = new Date().toISOString();
  return `Login to Certificate System at ${timestamp}`;
}

// Truncate address for display (0x1234...5678)
export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Listen for account changes
export function onAccountsChanged(
  callback: (accounts: string[]) => void
): void {
  if (isWalletInstalled()) {
    window.ethereum.on("accountsChanged", callback);
  }
}

// Listen for chain changes
export function onChainChanged(callback: (chainId: string) => void): void {
  if (isWalletInstalled()) {
    window.ethereum.on("chainChanged", callback);
  }
}

// Remove listeners
export function removeWalletListeners(): void {
  if (isWalletInstalled()) {
    window.ethereum.removeAllListeners("accountsChanged");
    window.ethereum.removeAllListeners("chainChanged");
  }
}
