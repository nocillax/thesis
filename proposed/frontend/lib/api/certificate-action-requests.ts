import { apiClient } from "./client";

export type CertificateAction = "revoke" | "reactivate";
export type RequestStatus = "pending" | "processing" | "completed" | "rejected";

export interface CertificateActionRequest {
  id: number;
  cert_hash: string;
  student_id: string;
  action_type: CertificateAction;
  reason: string;
  status: RequestStatus;
  requested_by_wallet_address: string;
  requested_by_name: string;
  taken_by_wallet_address: string | null;
  rejection_reason: string | null;
  requested_at: string;
  updated_at: string;
}

export interface CreateCertificateActionRequestDto {
  cert_hash: string;
  action_type: CertificateAction;
  reason: string;
}

export const certificateActionRequestsAPI = {
  create: async (data: CreateCertificateActionRequestDto) => {
    const response = await apiClient.post("/certificate-action-requests", data);
    return response.data;
  },

  getAll: async (status?: RequestStatus, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const response = await apiClient.get(
      `/certificate-action-requests?${params.toString()}`
    );
    return response.data;
  },

  getLatest: async (limit: number = 5) => {
    const response = await apiClient.get(
      `/certificate-action-requests/latest?limit=${limit}`
    );
    return response.data;
  },

  getPendingCount: async () => {
    const response = await apiClient.get(
      "/certificate-action-requests/pending/count"
    );
    return response.data.count;
  },

  getMyNonCompletedCount: async () => {
    const response = await apiClient.get(
      "/certificate-action-requests/my/non-completed/count"
    );
    return response.data.count;
  },

  getByCertHash: async (certHash: string) => {
    const response = await apiClient.get(
      `/certificate-action-requests/certificate/${certHash}`
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/certificate-action-requests/${id}`);
    return response.data;
  },

  getMyRequests: async (
    status?: RequestStatus,
    page?: number,
    limit?: number
  ) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const response = await apiClient.get(
      `/certificate-action-requests/my?${params.toString()}`
    );
    return response.data;
  },

  take: async (id: number) => {
    const response = await apiClient.patch(
      `/certificate-action-requests/${id}/take`
    );
    return response.data;
  },

  release: async (id: number) => {
    const response = await apiClient.patch(
      `/certificate-action-requests/${id}/release`
    );
    return response.data;
  },

  complete: async (id: number) => {
    const response = await apiClient.patch(
      `/certificate-action-requests/${id}/complete`
    );
    return response.data;
  },

  reject: async (id: number, reason: string) => {
    const response = await apiClient.patch(
      `/certificate-action-requests/${id}/reject`,
      { reason }
    );
    return response.data;
  },

  cancel: async (id: number) => {
    const response = await apiClient.patch(
      `/certificate-action-requests/${id}/cancel`
    );
    return response.data;
  },
};
