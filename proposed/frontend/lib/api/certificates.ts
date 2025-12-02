import { apiClient } from "./client";
import {
  Certificate,
  IssueCertificateDTO,
  PaginatedResponse,
} from "@/types/certificate";

export const certificatesAPI = {
  // Get all certificates with pagination
  getAll: async (
    page: number = 1,
    limit: number = 20,
    status?: "active" | "revoked"
  ): Promise<PaginatedResponse<Certificate>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);
    const response = await apiClient.get(
      `/api/blockchain/certificates?${params}`
    );
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
