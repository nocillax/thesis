import { UserFilters } from "@/lib/api/users";
import { CertificateFilters } from "@/lib/api/certificates";

const USERS_FILTER_KEY = "users_filters";
const CERTS_FILTER_KEY = "certificates_filters";
const USER_WALLET_KEY = "current_user_wallet";

/**
 * Save filters to localStorage with user-specific key
 * Automatically clears filters if user changes
 */
export function saveUserFilters(filters: UserFilters, walletAddress: string) {
  const stored = localStorage.getItem(USER_WALLET_KEY);

  // Clear filters if user changed
  if (stored && stored !== walletAddress) {
    localStorage.removeItem(USERS_FILTER_KEY);
    localStorage.removeItem(CERTS_FILTER_KEY);
  }

  localStorage.setItem(USER_WALLET_KEY, walletAddress);
  localStorage.setItem(USERS_FILTER_KEY, JSON.stringify(filters));
}

export function saveCertificateFilters(
  filters: CertificateFilters,
  walletAddress: string
) {
  const stored = localStorage.getItem(USER_WALLET_KEY);

  // Clear filters if user changed
  if (stored && stored !== walletAddress) {
    localStorage.removeItem(USERS_FILTER_KEY);
    localStorage.removeItem(CERTS_FILTER_KEY);
  }

  localStorage.setItem(USER_WALLET_KEY, walletAddress);
  localStorage.setItem(CERTS_FILTER_KEY, JSON.stringify(filters));
}

export function loadUserFilters(walletAddress: string): UserFilters | null {
  const stored = localStorage.getItem(USER_WALLET_KEY);

  // Clear if user changed
  if (stored && stored !== walletAddress) {
    localStorage.removeItem(USERS_FILTER_KEY);
    localStorage.removeItem(CERTS_FILTER_KEY);
    localStorage.setItem(USER_WALLET_KEY, walletAddress);
    return null;
  }

  const filtersStr = localStorage.getItem(USERS_FILTER_KEY);
  if (!filtersStr) return null;

  try {
    return JSON.parse(filtersStr);
  } catch {
    return null;
  }
}

export function loadCertificateFilters(
  walletAddress: string
): CertificateFilters | null {
  const stored = localStorage.getItem(USER_WALLET_KEY);

  // Clear if user changed
  if (stored && stored !== walletAddress) {
    localStorage.removeItem(USERS_FILTER_KEY);
    localStorage.removeItem(CERTS_FILTER_KEY);
    localStorage.setItem(USER_WALLET_KEY, walletAddress);
    return null;
  }

  const filtersStr = localStorage.getItem(CERTS_FILTER_KEY);
  if (!filtersStr) return null;

  try {
    return JSON.parse(filtersStr);
  } catch {
    return null;
  }
}

export function clearAllFilters() {
  localStorage.removeItem(USERS_FILTER_KEY);
  localStorage.removeItem(CERTS_FILTER_KEY);
}
