import { apiClient } from "./client";

export interface AuditLogEntry {
  action: "ISSUED" | "REVOKED" | "REACTIVATED";
  cert_hash: string;
  student_id?: string;
  version?: number;
  issuer?: string;
  revoked_by?: string;
  reactivated_by?: string;
  block_number: number;
  transaction_hash: string;
  timestamp: string;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_more: boolean;
  };
}

export const auditLogsAPI = {
  // Get audit logs for a specific certificate
  getByCertificate: async (certHash: string): Promise<AuditLogEntry[]> => {
    const response = await apiClient.get<AuditLogEntry[]>(
      `/api/blockchain/certificates/audit-logs?cert_hash=${certHash}`
    );
    return response.data;
  },

  // Get all audit logs (system-wide) with pagination
  getAll: async (
    page?: number,
    limit?: number
  ): Promise<AuditLogEntry[] | PaginatedAuditLogs> => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const url = `/api/blockchain/certificates/audit-logs${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await apiClient.get<AuditLogEntry[] | PaginatedAuditLogs>(
      url
    );
    return response.data;
  },

  // Get audit logs for a specific user with pagination
  getByUser: async (
    walletAddress: string,
    page?: number,
    limit?: number
  ): Promise<AuditLogEntry[] | PaginatedAuditLogs> => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const url = `/api/blockchain/certificates/audit-logs/user/${walletAddress}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await apiClient.get<AuditLogEntry[] | PaginatedAuditLogs>(
      url
    );
    return response.data;
  },
};
