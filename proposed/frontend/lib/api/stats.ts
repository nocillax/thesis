import { apiClient } from "./client";
import { AuditLogEntry } from "./auditLogs";

export interface Stats {
  active_certificates: number;
  authorized_users: number;
  certificates_issued_by_me: number;
  recent_activity: AuditLogEntry[];
}

export const statsAPI = {
  get: async (): Promise<Stats> => {
    const response = await apiClient.get<Stats>("/api/blockchain/stats");
    return response.data;
  },
};
