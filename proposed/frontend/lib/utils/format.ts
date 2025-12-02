import { format } from "date-fns";

// Truncate Ethereum address for display
export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Truncate hash for display
export function truncateHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

// Format date to human-readable string
export function formatDate(dateString: string | Date): string {
  if (!dateString) return "";
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return format(date, "MMM dd, yyyy");
}

// Format date with time
export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return "";
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return format(date, "MMM dd, yyyy HH:mm");
}

// Format CGPA for display (backend already divides by 100)
export function formatCGPA(cgpa: number): string {
  return cgpa.toFixed(2);
}

// Parse CGPA from decimal (3.85) to integer (385) for backend
export function parseCGPA(cgpa: number): number {
  return Math.round(cgpa * 100);
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}
