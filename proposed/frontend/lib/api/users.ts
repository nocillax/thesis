import { apiClient } from "./client";
import { User, RegisterUserDTO } from "@/types/user";
import { PaginatedResponse } from "@/types/certificate";

export interface UserFilters {
  status?: "authorized" | "revoked";
  is_admin?: boolean;
  hide_revoked?: boolean;
}

export const usersAPI = {
  // Get all users with pagination (admin only)
  getAll: async (
    page: number = 1,
    limit: number = 20,
    filters?: UserFilters
  ): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.status) params.append("status", filters.status);
    if (filters?.is_admin !== undefined)
      params.append("is_admin", filters.is_admin.toString());
    if (filters?.hide_revoked) params.append("hide_revoked", "true");
    const response = await apiClient.get(`/api/blockchain/users?${params}`);
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
