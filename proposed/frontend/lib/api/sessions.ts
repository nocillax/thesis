import { apiClient } from "./client";

export interface AdminSession {
  id: number;
  wallet_address: string;
  user_name: string;
  login_at: string;
  logout_at: string | null;
  session_status: "active" | "logged_out" | "expired";
  ip_address: string | null;
  user_agent: string | null;
}

export interface OfflinePeriod {
  start: string;
  end: string;
  duration_minutes: number;
}

export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  logged_out_sessions: number;
  expired_sessions: number;
  total_login_time_minutes: number;
}

export const sessionsAPI = {
  recordLogin: async () => {
    const response = await apiClient.post("/sessions/login");
    return response.data;
  },

  recordLogout: async () => {
    const response = await apiClient.post("/sessions/logout");
    return response.data;
  },

  getMySessions: async (limit: number = 10): Promise<AdminSession[]> => {
    const response = await apiClient.get(
      `/sessions/my-sessions?limit=${limit}`
    );
    return response.data;
  },

  getOfflinePeriods: async (
    startDate?: string,
    endDate?: string
  ): Promise<OfflinePeriod[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await apiClient.get(
      `/sessions/offline-periods${
        params.toString() ? "?" + params.toString() : ""
      }`
    );
    return response.data;
  },

  getLastOfflinePeriod: async (): Promise<OfflinePeriod | null> => {
    const response = await apiClient.get("/sessions/last-offline-period");
    return response.data;
  },

  getStats: async (): Promise<SessionStats> => {
    const response = await apiClient.get("/sessions/stats");
    return response.data;
  },

  getActiveSession: async (): Promise<AdminSession | null> => {
    const response = await apiClient.get("/sessions/active");
    return response.data;
  },

  getAllSessions: async (page: number = 1, limit: number = 50) => {
    const response = await apiClient.get(
      `/sessions?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};
