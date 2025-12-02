# Frontend Technical Specification - Blockchain Certificate Management System

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Architecture](#project-architecture)
3. [API Integration](#api-integration)
4. [Authentication Flow](#authentication-flow)
5. [State Management](#state-management)
6. [Routing & Navigation](#routing--navigation)
7. [Component Structure](#component-structure)
8. [Data Fetching Patterns](#data-fetching-patterns)
9. [Form Handling & Validation](#form-handling--validation)
10. [Blockchain Integration](#blockchain-integration)
11. [Error Handling](#error-handling)
12. [Styling Guidelines](#styling-guidelines)
13. [Performance Optimization](#performance-optimization)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Configuration](#deployment-configuration)

---

## Technology Stack

### Core Framework

- **Next.js 14+** (App Router)
  - Server Components for initial data fetching
  - Client Components for interactive features
  - Server Actions for form submissions
  - API Routes for proxying backend requests (optional)

### UI Libraries

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components built on Radix UI
- **Lucide React** - Icon library (blockchain-themed icons available)
- **React Hook Form** - Form state management and validation
- **Zod** - TypeScript-first schema validation

### Blockchain Integration

- **Ethers.js v6** - Ethereum wallet interaction
- **Wagmi** (optional) - React hooks for Ethereum
- **RainbowKit** (optional alternative) - Wallet connection UI

### State Management

- **Zustand** - Lightweight state management
- **TanStack Query (React Query)** - Server state management, caching, and synchronization

### Additional Libraries

- **date-fns** - Date formatting and manipulation
- **react-hot-toast** - Toast notifications
- **framer-motion** - Animations and transitions
- **clsx** / **tailwind-merge** - Conditional CSS classes

---

## Project Architecture

### Directory Structure

```
proposed/frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (header, footer)
│   ├── page.tsx                  # Landing page (/)
│   ├── login/
│   │   └── page.tsx              # Wallet login page
│   ├── dashboard/
│   │   └── page.tsx              # User dashboard
│   ├── certificates/
│   │   ├── page.tsx              # All certificates list
│   │   ├── issue/
│   │   │   └── page.tsx          # Issue certificate form
│   │   ├── verify/
│   │   │   └── page.tsx          # Verify certificate (public)
│   │   ├── [hash]/
│   │   │   └── page.tsx          # Certificate detail page
│   │   └── student/
│   │       └── [studentId]/
│   │           └── page.tsx      # Student certificates page
│   ├── users/
│   │   ├── page.tsx              # User management (admin)
│   │   ├── register/
│   │   │   └── page.tsx          # Register new user (admin)
│   │   └── profile/
│   │       └── page.tsx          # My profile
│   └── api/                      # API routes (optional proxy)
│       └── auth/
│           └── [...]/route.ts
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx           # Optional
│   │   └── Container.tsx
│   ├── auth/                     # Authentication components
│   │   ├── WalletConnectButton.tsx
│   │   ├── SignMessageDialog.tsx
│   │   └── AuthGuard.tsx
│   ├── certificates/             # Certificate components
│   │   ├── CertificateCard.tsx
│   │   ├── CertificateTable.tsx
│   │   ├── CertificateDetail.tsx
│   │   ├── CertificateTemplate.tsx
│   │   ├── IssueCertificateForm.tsx
│   │   ├── VerifyCertificateForm.tsx
│   │   └── VersionTimeline.tsx
│   ├── users/                    # User management components
│   │   ├── UserTable.tsx
│   │   ├── RegisterUserForm.tsx
│   │   ├── UserCard.tsx
│   │   └── UserActions.tsx
│   └── common/                   # Shared components
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── StatusBadge.tsx
│       ├── CopyButton.tsx
│       ├── BlockchainStatusIndicator.tsx
│       ├── TransactionModal.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── api/                      # API client functions
│   │   ├── client.ts             # Axios/fetch configuration
│   │   ├── auth.ts               # Auth API calls
│   │   ├── certificates.ts       # Certificate API calls
│   │   └── users.ts              # User API calls
│   ├── blockchain/               # Blockchain utilities
│   │   ├── wallet.ts             # Wallet connection logic
│   │   ├── signature.ts          # Message signing
│   │   └── contracts.ts          # Contract ABIs and addresses
│   ├── utils/                    # Utility functions
│   │   ├── format.ts             # Date, address, hash formatting
│   │   ├── validation.ts         # Custom validators
│   │   └── constants.ts          # App constants
│   └── hooks/                    # Custom React hooks
│       ├── useAuth.ts            # Authentication hook
│       ├── useWallet.ts          # Wallet connection hook
│       ├── useCertificates.ts    # Certificate data fetching
│       └── useUsers.ts           # User data fetching
├── stores/
│   ├── authStore.ts              # Zustand store for auth state
│   ├── walletStore.ts            # Zustand store for wallet state
│   └── uiStore.ts                # Zustand store for UI state
├── types/
│   ├── certificate.ts            # Certificate type definitions
│   ├── user.ts                   # User type definitions
│   ├── auth.ts                   # Auth type definitions
│   └── api.ts                    # API response types
├── styles/
│   └── globals.css               # Global styles, Tailwind imports
├── public/
│   ├── images/
│   └── icons/
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

## API Integration

### Base Configuration

**File:** `lib/api/client.ts`

```typescript
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints

**File:** `lib/api/auth.ts`

```typescript
import { apiClient } from "./client";

export interface WalletLoginRequest {
  walletAddress: string;
  message: string;
  signature: string;
}

export interface WalletLoginResponse {
  success: boolean;
  access_token: string;
}

export const authAPI = {
  walletLogin: async (
    data: WalletLoginRequest
  ): Promise<WalletLoginResponse> => {
    const response = await apiClient.post("/api/auth/wallet-login", data);
    return response.data;
  },
};
```

**File:** `lib/api/certificates.ts`

```typescript
import { apiClient } from "./client";
import { Certificate, IssueCertificateDTO } from "@/types/certificate";

export const certificatesAPI = {
  // Get all certificates
  getAll: async (): Promise<Certificate[]> => {
    const response = await apiClient.get("/api/blockchain/certificates");
    return response.data;
  },

  // Issue new certificate
  issue: async (data: IssueCertificateDTO) => {
    const response = await apiClient.post("/api/blockchain/certificates", data);
    return response.data;
  },

  // Verify certificate by hash
  verify: async (hash: string): Promise<Certificate> => {
    const response = await apiClient.get(
      `/api/blockchain/certificates/verify/${hash}`
    );
    return response.data;
  },

  // Get active certificate by student ID
  getActiveByStudentId: async (studentId: string): Promise<Certificate> => {
    const response = await apiClient.get(
      `/api/blockchain/certificates/student/${studentId}/active`
    );
    return response.data;
  },

  // Get all versions by student ID
  getAllVersions: async (studentId: string): Promise<Certificate[]> => {
    const response = await apiClient.get(
      `/api/blockchain/certificates/student/${studentId}/versions`
    );
    return response.data;
  },

  // Revoke certificate
  revoke: async (hash: string) => {
    const response = await apiClient.patch(
      `/api/blockchain/certificates/${hash}/revoke`
    );
    return response.data;
  },

  // Reactivate certificate
  reactivate: async (hash: string) => {
    const response = await apiClient.patch(
      `/api/blockchain/certificates/${hash}/reactivate`
    );
    return response.data;
  },

  // Get audit logs
  getAuditLogs: async (certHash: string) => {
    const response = await apiClient.get(
      `/api/blockchain/certificates/audit-logs?cert_hash=${certHash}`
    );
    return response.data;
  },
};
```

**File:** `lib/api/users.ts`

```typescript
import { apiClient } from "./client";
import { User, RegisterUserDTO } from "@/types/user";

export const usersAPI = {
  // Get all users (admin only)
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get("/api/blockchain/users");
    return response.data;
  },

  // Get user by wallet address
  getByAddress: async (address: string): Promise<User> => {
    const response = await apiClient.get(`/api/blockchain/users/${address}`);
    return response.data;
  },

  // Register new user (admin only)
  register: async (data: RegisterUserDTO) => {
    const response = await apiClient.post(
      "/api/blockchain/users/register",
      data
    );
    return response.data;
  },

  // Revoke user (admin only)
  revoke: async (address: string) => {
    const response = await apiClient.patch(
      `/api/blockchain/users/${address}/revoke`
    );
    return response.data;
  },

  // Reactivate user (admin only)
  reactivate: async (address: string) => {
    const response = await apiClient.patch(
      `/api/blockchain/users/${address}/reactivate`
    );
    return response.data;
  },

  // Grant admin privileges (admin only)
  grantAdmin: async (address: string) => {
    const response = await apiClient.patch(
      `/api/blockchain/users/${address}/grant-admin`
    );
    return response.data;
  },

  // Revoke admin privileges (admin only)
  revokeAdmin: async (address: string) => {
    const response = await apiClient.patch(
      `/api/blockchain/users/${address}/revoke-admin`
    );
    return response.data;
  },
};
```

---

## Authentication Flow

### Wallet Connection & Login

**File:** `lib/blockchain/wallet.ts`

```typescript
import { ethers } from "ethers";

export interface WalletConnection {
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
}

export const walletUtils = {
  // Check if wallet extension is installed
  isWalletInstalled: (): boolean => {
    return (
      typeof window !== "undefined" && typeof window.ethereum !== "undefined"
    );
  },

  // Connect to wallet
  connect: async (): Promise<WalletConnection> => {
    if (!walletUtils.isWalletInstalled()) {
      throw new Error(
        "No wallet extension found. Please install Rabby or MetaMask."
      );
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // Request account access
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { address, provider, signer };
  },

  // Sign login message
  signMessage: async (
    signer: ethers.JsonRpcSigner,
    message: string
  ): Promise<string> => {
    const signature = await signer.signMessage(message);
    return signature;
  },

  // Create login message
  createLoginMessage: (): string => {
    const timestamp = new Date().toISOString();
    return `Login to Certificate System at ${timestamp}`;
  },

  // Truncate address for display
  truncateAddress: (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },
};
```

**File:** `components/auth/WalletConnectButton.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { walletUtils } from "@/lib/blockchain/wallet";
import { authAPI } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export function WalletConnectButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Step 1: Connect wallet
      const { address, signer } = await walletUtils.connect();
      toast.success(
        `Wallet connected: ${walletUtils.truncateAddress(address)}`
      );

      // Step 2: Create and sign message
      const message = walletUtils.createLoginMessage();
      const signature = await walletUtils.signMessage(signer, message);

      // Step 3: Send to backend for verification
      const response = await authAPI.walletLogin({
        walletAddress: address,
        message,
        signature,
      });

      // Step 4: Store token and update state
      localStorage.setItem("access_token", response.access_token);
      setAuth({
        isAuthenticated: true,
        walletAddress: address,
        token: response.access_token,
      });

      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Wallet connection error:", error);

      if (error.message.includes("No wallet extension")) {
        toast.error("Please install Rabby or MetaMask wallet.");
      } else if (error.message.includes("rejected")) {
        toast.error("Wallet connection rejected.");
      } else if (error.response?.status === 404) {
        toast.error("Wallet not registered. Contact administrator.");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={isConnecting} size="lg">
      {isConnecting ? (
        <>
          <div className="animate-spin mr-2">⏳</div>
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-5 w-5" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
```

### Auth Guard

**File:** `components/auth/AuthGuard.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

    if (!isLoading && isAuthenticated && requireAdmin && !user?.is_admin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, isLoading, requireAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && !user?.is_admin) {
    return null;
  }

  return <>{children}</>;
}
```

---

## State Management

### Auth Store (Zustand)

**File:** `stores/authStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usersAPI } from "@/lib/api/users";

interface User {
  wallet_address: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_authorized: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  walletAddress: string | null;
  token: string | null;
  user: User | null;
  isLoading: boolean;

  setAuth: (data: {
    isAuthenticated: boolean;
    walletAddress: string;
    token: string;
  }) => void;
  setUser: (user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      walletAddress: null,
      token: null,
      user: null,
      isLoading: true,

      setAuth: (data) => {
        set({
          isAuthenticated: data.isAuthenticated,
          walletAddress: data.walletAddress,
          token: data.token,
        });
        // Fetch user data after auth
        get().fetchUser();
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem("access_token");
        set({
          isAuthenticated: false,
          walletAddress: null,
          token: null,
          user: null,
        });
      },

      fetchUser: async () => {
        try {
          const walletAddress = get().walletAddress;
          if (!walletAddress) return;

          const user = await usersAPI.getByAddress(walletAddress);
          set({ user, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch user:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        walletAddress: state.walletAddress,
        token: state.token,
      }),
    }
  )
);
```

---

## Routing & Navigation

### Route Structure

| Route                               | Page                   | Access        |
| ----------------------------------- | ---------------------- | ------------- |
| `/`                                 | Landing page           | Public        |
| `/login`                            | Wallet login           | Public        |
| `/verify`                           | Verify certificate     | Public        |
| `/dashboard`                        | User dashboard         | Authenticated |
| `/certificates`                     | All certificates       | Authenticated |
| `/certificates/issue`               | Issue certificate form | Authorized    |
| `/certificates/[hash]`              | Certificate detail     | Public        |
| `/certificates/student/[studentId]` | Student certificates   | Public        |
| `/users`                            | User management        | Admin         |
| `/users/register`                   | Register new user      | Admin         |
| `/users/profile`                    | My profile             | Authenticated |

### Header Navigation

**File:** `components/layout/Header.tsx`

```typescript
"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/auth/WalletConnectButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { Search } from "lucide-react";

export function Header() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">🔗 CertChain</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          <Link href="/verify" className="text-sm font-medium hover:underline">
            Verify
          </Link>

          {isAuthenticated && (
            <>
              <Link
                href="/certificates/issue"
                className="text-sm font-medium hover:underline"
              >
                Issue Certificate
              </Link>
              <Link
                href="/certificates"
                className="text-sm font-medium hover:underline"
              >
                All Certificates
              </Link>

              {user?.is_admin && (
                <Link
                  href="/users"
                  className="text-sm font-medium hover:underline"
                >
                  Users
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Search bar (when authenticated) */}
        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student ID..."
              className="w-64 px-3 py-1 text-sm border rounded-md"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  window.location.href = `/certificates/student/${e.currentTarget.value}`;
                }
              }}
            />
          </div>
        )}

        {/* Auth section */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? <UserMenu user={user} /> : <WalletConnectButton />}
        </div>
      </div>
    </header>
  );
}
```

---

## Component Structure

### Certificate Table Component

**File:** `components/certificates/CertificateTable.tsx`

```typescript
"use client";

import { useState } from "react";
import { Certificate } from "@/types/certificate";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, truncateHash } from "@/lib/utils/format";
import { certificatesAPI } from "@/lib/api/certificates";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface CertificateTableProps {
  certificates: Certificate[];
  onUpdate?: () => void;
}

export function CertificateTable({
  certificates,
  onUpdate,
}: CertificateTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(certificates.map((c) => c.cert_hash));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (certHash: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, certHash]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== certHash));
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      await Promise.all(
        selectedIds.map((hash) => certificatesAPI.revoke(hash))
      );
      toast.success(`${selectedIds.length} certificate(s) revoked`);
      setSelectedIds([]);
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to revoke certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReactivate = async () => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      await Promise.all(
        selectedIds.map((hash) => certificatesAPI.reactivate(hash))
      );
      toast.success(`${selectedIds.length} certificate(s) reactivated`);
      setSelectedIds([]);
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to reactivate certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center space-x-2">
          <Button
            onClick={handleBulkRevoke}
            disabled={isProcessing}
            variant="destructive"
          >
            Revoke Selected ({selectedIds.length})
          </Button>
          <Button onClick={handleBulkReactivate} disabled={isProcessing}>
            Reactivate Selected ({selectedIds.length})
          </Button>
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === certificates.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Degree Program</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.map((cert) => (
            <TableRow
              key={cert.cert_hash}
              className={cert.is_revoked ? "bg-red-50" : "bg-green-50"}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(cert.cert_hash)}
                  onCheckedChange={(checked) =>
                    handleSelect(cert.cert_hash, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/certificates/student/${cert.student_id}`}
                  className="font-medium hover:underline"
                >
                  {cert.student_id}
                </Link>
              </TableCell>
              <TableCell>{cert.student_name}</TableCell>
              <TableCell>{cert.degree_program}</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                  v{cert.version}
                </span>
              </TableCell>
              <TableCell>{formatDate(cert.issuance_date)}</TableCell>
              <TableCell>
                <StatusBadge isActive={!cert.is_revoked} />
              </TableCell>
              <TableCell>
                <Link href={`/certificates/${cert.cert_hash}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Issue Certificate Form

**File:** `components/certificates/IssueCertificateForm.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { certificatesAPI } from "@/lib/api/certificates";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { TransactionModal } from "@/components/common/TransactionModal";

const issueCertificateSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  student_name: z.string().min(1, "Student name is required"),
  degree_program: z.string().min(1, "Degree program is required"),
  cgpa: z.number().min(0).max(4, "CGPA must be between 0 and 4"),
  issuing_authority: z.string().min(1, "Issuing authority is required"),
});

type IssueCertificateForm = z.infer<typeof issueCertificateSchema>;

export function IssueCertificateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IssueCertificateForm>({
    resolver: zodResolver(issueCertificateSchema),
  });

  const onSubmit = async (data: IssueCertificateForm) => {
    setIsSubmitting(true);
    try {
      const result = await certificatesAPI.issue(data);
      setTxResult(result);
      toast.success("Certificate issued successfully!");
      reset();
    } catch (error: any) {
      console.error("Issue certificate error:", error);

      if (error.response?.data?.message?.includes("active certificate")) {
        toast.error(
          "Student already has an active certificate. Revoke it first."
        );
      } else if (error.response?.status === 403) {
        toast.error("You are not authorized to issue certificates.");
      } else {
        toast.error("Failed to issue certificate. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="student_id">Student ID *</Label>
          <Input
            id="student_id"
            placeholder="e.g., 22-46734-1"
            {...register("student_id")}
          />
          {errors.student_id && (
            <p className="text-sm text-red-500 mt-1">
              {errors.student_id.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="student_name">Student Name *</Label>
          <Input
            id="student_name"
            placeholder="e.g., Alice Johnson"
            {...register("student_name")}
          />
          {errors.student_name && (
            <p className="text-sm text-red-500 mt-1">
              {errors.student_name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="degree_program">Degree Program *</Label>
          <Input
            id="degree_program"
            placeholder="e.g., Computer Science"
            {...register("degree_program")}
          />
          {errors.degree_program && (
            <p className="text-sm text-red-500 mt-1">
              {errors.degree_program.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cgpa">CGPA (0.00 - 4.00) *</Label>
          <Input
            id="cgpa"
            type="number"
            step="0.01"
            placeholder="e.g., 3.85"
            {...register("cgpa", { valueAsNumber: true })}
          />
          {errors.cgpa && (
            <p className="text-sm text-red-500 mt-1">{errors.cgpa.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="issuing_authority">Issuing Authority *</Label>
          <Input
            id="issuing_authority"
            placeholder="e.g., Tech University"
            {...register("issuing_authority")}
          />
          {errors.issuing_authority && (
            <p className="text-sm text-red-500 mt-1">
              {errors.issuing_authority.message}
            </p>
          )}
        </div>

        <div className="flex space-x-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Issuing..." : "Issue Certificate"}
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()}>
            Clear Form
          </Button>
        </div>
      </form>

      {/* Transaction Result Modal */}
      {txResult && (
        <TransactionModal
          isOpen={!!txResult}
          onClose={() => setTxResult(null)}
          result={txResult}
          type="certificate-issued"
        />
      )}
    </>
  );
}
```

---

## Data Fetching Patterns

### Using TanStack Query (React Query)

**File:** `lib/hooks/useCertificates.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificatesAPI } from "@/lib/api/certificates";
import { toast } from "react-hot-toast";

export function useCertificates() {
  return useQuery({
    queryKey: ["certificates"],
    queryFn: certificatesAPI.getAll,
  });
}

export function useCertificate(hash: string) {
  return useQuery({
    queryKey: ["certificate", hash],
    queryFn: () => certificatesAPI.verify(hash),
    enabled: !!hash,
  });
}

export function useStudentCertificates(studentId: string) {
  return useQuery({
    queryKey: ["certificates", "student", studentId],
    queryFn: () => certificatesAPI.getAllVersions(studentId),
    enabled: !!studentId,
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: certificatesAPI.issue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate issued successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to issue certificate"
      );
    },
  });
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: certificatesAPI.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate revoked");
    },
    onError: () => {
      toast.error("Failed to revoke certificate");
    },
  });
}
```

**Usage in Component:**

```typescript
"use client";

import { useCertificates } from "@/lib/hooks/useCertificates";
import { CertificateTable } from "@/components/certificates/CertificateTable";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";

export default function CertificatesPage() {
  const { data: certificates, isLoading, error, refetch } = useCertificates();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load certificates" />;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">All Certificates</h1>
      <CertificateTable certificates={certificates || []} onUpdate={refetch} />
    </div>
  );
}
```

---

## Form Handling & Validation

### Zod Schemas

**File:** `types/certificate.ts`

```typescript
import { z } from "zod";

export const issueCertificateSchema = z.object({
  student_id: z.string().min(1, "Student ID is required").max(50),
  student_name: z.string().min(1, "Student name is required").max(100),
  degree_program: z.string().min(1, "Degree program is required").max(100),
  cgpa: z
    .number()
    .min(0, "CGPA cannot be negative")
    .max(4, "CGPA cannot exceed 4.00"),
  issuing_authority: z
    .string()
    .min(1, "Issuing authority is required")
    .max(200),
});

export type IssueCertificateDTO = z.infer<typeof issueCertificateSchema>;

export interface Certificate {
  cert_hash: string;
  student_id: string;
  version: number;
  student_name: string;
  degree_program: string;
  cgpa: number;
  issuing_authority: string;
  issuer: string;
  issuer_name: string;
  is_revoked: boolean;
  signature: string;
  issuance_date: string;
}
```

---

## Blockchain Integration

### Contract Addresses & ABIs

**File:** `lib/blockchain/contracts.ts`

```typescript
export const CONTRACTS = {
  CERTIFICATE_REGISTRY: {
    address:
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD",
    abi: [
      "function verifyCertificate(bytes32 cert_hash) external view returns (string student_id, uint256 version, string student_name, string degree_program, uint16 cgpa, string issuing_authority, address issuer, bool is_revoked, bytes signature, uint256 issuance_date)",
      // Add other functions as needed
    ],
  },
  USER_REGISTRY: {
    address:
      process.env.NEXT_PUBLIC_USER_REGISTRY_ADDRESS ||
      "0xECB550dE5c73e6690AB4521C03EC9D476617167E",
    abi: [
      "function getUser(address wallet_address) external view returns (string username, string email, uint256 registration_date, bool is_authorized, bool is_admin)",
    ],
  },
};

export const ADMIN_WALLET =
  process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
  "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73";
```

---

## Error Handling

### Error Types

**File:** `lib/utils/errors.ts`

```typescript
export class WalletNotInstalledError extends Error {
  constructor() {
    super("No wallet extension found. Please install Rabby or MetaMask.");
    this.name = "WalletNotInstalledError";
  }
}

export class WalletConnectionRejectedError extends Error {
  constructor() {
    super("Wallet connection was rejected by user.");
    this.name = "WalletConnectionRejectedError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class BlockchainError extends Error {
  constructor(message: string, public txHash?: string) {
    super(message);
    this.name = "BlockchainError";
  }
}
```

### Global Error Boundary

**File:** `app/error.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

---

## Styling Guidelines

### Tailwind Configuration

**File:** `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blockchain-themed colors
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          700: "#15803d",
        },
        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          700: "#b91c1c",
        },
        // Add more custom colors
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### Status Badge Component

**File:** `components/common/StatusBadge.tsx`

```typescript
interface StatusBadgeProps {
  isActive: boolean;
}

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isActive ? "🟢 Active" : "🔴 Revoked"}
    </span>
  );
}
```

---

## Performance Optimization

### Code Splitting & Lazy Loading

```typescript
import dynamic from "next/dynamic";

const CertificateTable = dynamic(
  () => import("@/components/certificates/CertificateTable"),
  { ssr: false, loading: () => <LoadingSpinner /> }
);
```

### Memoization

```typescript
import { memo } from "react";

export const CertificateCard = memo(function CertificateCard({ certificate }) {
  // Component logic
});
```

### Image Optimization

```typescript
import Image from "next/image";

<Image
  src="/blockchain-illustration.png"
  alt="Blockchain"
  width={800}
  height={600}
  priority
/>;
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from "vitest";
import { truncateAddress } from "@/lib/utils/format";

describe("truncateAddress", () => {
  it("should truncate Ethereum address correctly", () => {
    const address = "0x08Bd40C733f1f8cDb4E87a5C2e3e7F5dE07e6c8E";
    expect(truncateAddress(address)).toBe("0x08Bd...6c8E");
  });
});
```

### Component Tests (React Testing Library)

```typescript
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/common/StatusBadge";

describe("StatusBadge", () => {
  it("renders active badge", () => {
    render(<StatusBadge isActive={true} />);
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it("renders revoked badge", () => {
    render(<StatusBadge isActive={false} />);
    expect(screen.getByText(/revoked/i)).toBeInTheDocument();
  });
});
```

---

## Deployment Configuration

### Environment Variables

**File:** `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD
NEXT_PUBLIC_USER_REGISTRY_ADDRESS=0xECB550dE5c73e6690AB4521C03EC9D476617167E
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=quorum
```

### Next.js Configuration

**File:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["localhost"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Implementation Checklist

### Phase 1: Setup & Authentication

- [ ] Initialize Next.js project with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Install shadcn/ui components
- [ ] Set up project directory structure
- [ ] Create API client with Axios
- [ ] Implement wallet connection (Ethers.js)
- [ ] Create auth store (Zustand)
- [ ] Build wallet login page
- [ ] Create auth guard component
- [ ] Implement JWT token management

### Phase 2: Core Features (Certificates)

- [ ] Build landing page with hero section
- [ ] Create certificate table component
- [ ] Build issue certificate form
- [ ] Implement verify certificate page (public)
- [ ] Create certificate detail page
- [ ] Build student certificates page
- [ ] Implement certificate versioning UI
- [ ] Add bulk actions (revoke/reactivate)
- [ ] Create transaction modal for blockchain feedback
- [ ] Implement search by student ID

### Phase 3: User Management (Admin)

- [ ] Build user management page (admin only)
- [ ] Create user table component
- [ ] Build register new user form
- [ ] Implement user actions (revoke/reactivate/grant admin)
- [ ] Add private key display for new users
- [ ] Create user profile page
- [ ] Implement role-based access control

### Phase 4: UI/UX Polish

- [ ] Add loading states (skeletons)
- [ ] Implement error boundaries
- [ ] Add toast notifications
- [ ] Create empty states
- [ ] Add blockchain status indicator
- [ ] Implement responsive design (mobile/tablet)
- [ ] Add animations and transitions
- [ ] Create blockchain-themed illustrations

### Phase 5: Testing & Optimization

- [ ] Write unit tests for utilities
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Optimize bundle size
- [ ] Implement code splitting
- [ ] Add performance monitoring
- [ ] Test on multiple devices
- [ ] Accessibility audit (WCAG AA)

### Phase 6: Deployment

- [ ] Configure environment variables for production
- [ ] Set up CI/CD pipeline
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (optional)

---

## Notes for Implementation

1. **Start with UI/UX design from Gemini** - Once you have the visual design, implement page by page
2. **Use shadcn/ui components** - Pre-built, customizable, accessible
3. **Follow the testing guide API responses** - All data structures are already defined
4. **Blockchain transactions take 5-15 seconds** - Always show loading states
5. **Wallet addresses and hashes** - Always truncate for display, provide copy button
6. **CGPA conversion** - Backend sends 385, display as 3.85
7. **Certificate versioning** - Group by student_id, show version badges
8. **Status visual cues** - Green for active/authorized, red for revoked
9. **Admin features** - Guard with `requireAdmin` prop in AuthGuard
10. **Public pages** - Verify certificate and student search don't require login

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Ethers.js v6**: https://docs.ethers.org/v6/
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

---

This technical specification provides everything needed to implement the frontend. Once Gemini provides the UI/UX design, follow this spec to build each feature systematically. Good luck! 🚀
