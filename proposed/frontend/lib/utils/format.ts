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
export function formatDate(dateString: string | Date | number): string {
  if (!dateString) return "";
  const date =
    typeof dateString === "string"
      ? new Date(dateString)
      : typeof dateString === "number"
      ? new Date(dateString)
      : dateString;
  return format(date, "MMM dd, yyyy");
}

// Format date with time - "12 Nov, 2025 05:43 AM"
export function formatDateTime(dateString: string | Date | number): string {
  if (!dateString) return "";

  try {
    let date: Date;
    if (typeof dateString === "string") {
      // Check if string is purely numeric (Unix timestamp string)
      const numericTimestamp = parseInt(dateString, 10);
      if (
        !isNaN(numericTimestamp) &&
        /^\d+$/.test(dateString) && // Only digits, no other characters
        dateString.length >= 10
      ) {
        // It's a Unix timestamp string from bigint column
        date = new Date(numericTimestamp * 1000);
      } else {
        // It's a regular ISO date string or other format
        date = new Date(dateString);
      }
    } else if (typeof dateString === "number") {
      // If it's a Unix timestamp in seconds (like blockchain timestamps)
      date = new Date(dateString * 1000);
    } else {
      date = dateString;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return format(date, "dd MMM, yyyy hh:mm a");
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid date";
  }
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

// Format IP address for display (convert localhost IPs to readable format)
export function formatIpAddress(ip: string): string {
  if (!ip) return "";
  // Convert IPv6 localhost to readable format
  if (ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "127.0.0.1") {
    return "localhost";
  }
  return ip;
}
