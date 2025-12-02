import { apiClient } from "./client";
import { WalletLoginRequest, WalletLoginResponse } from "@/types/auth";

export const authAPI = {
  walletLogin: async (
    data: WalletLoginRequest
  ): Promise<WalletLoginResponse> => {
    const response = await apiClient.post("/api/auth/wallet-login", data);
    return response.data;
  },
};
