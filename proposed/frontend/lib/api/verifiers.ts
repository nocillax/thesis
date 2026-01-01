import { apiClient } from "./client";

export interface VerifierInfo {
  name: string;
  email: string;
  institution: string;
  website: string;
}

export interface VerificationLog {
  id: number;
  verifier_id: number;
  cert_hash: string;
  ip_address: string;
  user_agent: string | null;
  verified_at: string;
  verifier: {
    id: number;
    name: string;
    email: string;
    institution: string;
    website: string;
  };
}

export interface BlockedVerifier {
  id: number;
  ip_address: string;
  blocked_until: string;
  reason: string;
  blocked_by_wallet_address: string;
  created_at: string;
}

export const verifierAPI = {
  submit: async (
    data: VerifierInfo & { cert_hash: string }
  ): Promise<{
    success: boolean;
    verifier_id: number;
    remaining_attempts: number;
  }> => {
    const response = await apiClient.post("/verifiers/submit", data);
    return response.data;
  },

  getLogs: async (
    page: number = 1,
    limit: number = 10,
    sortBy: string = "verified_at",
    sortOrder: "ASC" | "DESC" = "DESC"
  ) => {
    const response = await apiClient.get(
      `/verifiers/logs?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    return response.data;
  },

  getBlocked: async () => {
    const response = await apiClient.get("/verifiers/blocked");
    return response.data;
  },

  block: async (ipAddress: string, durationMinutes: number, reason: string) => {
    const response = await apiClient.post("/verifiers/block", {
      ip_address: ipAddress,
      duration_minutes: durationMinutes,
      reason,
    });
    return response.data;
  },

  unblock: async (ipAddress: string) => {
    const response = await apiClient.delete(`/verifiers/unblock/${ipAddress}`);
    return response.data;
  },
};
