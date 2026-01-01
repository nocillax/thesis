import { apiClient } from "./client";

export interface BlockchainEvent {
  action: string;
  cert_hash: string;
  timestamp: string;
  actor_wallet_address: string;
}

export interface OfflineActivity {
  offline_start: string;
  offline_end: string;
  duration_minutes: number;
  blockchain_events: BlockchainEvent[];
}

export const offlineActivitiesAPI = {
  get: async (
    startDate?: string,
    endDate?: string
  ): Promise<OfflineActivity[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await apiClient.get(
      `/offline-activities${params.toString() ? "?" + params.toString() : ""}`
    );
    return response.data;
  },

  getCount: async (): Promise<number> => {
    const response = await apiClient.get("/offline-activities/count");
    return response.data.count;
  },
};
