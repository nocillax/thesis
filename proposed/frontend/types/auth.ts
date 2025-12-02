// Auth types
export interface WalletLoginRequest {
  walletAddress: string;
  message: string;
  signature: string;
}

export interface WalletLoginResponse {
  success: boolean;
  access_token: string;
}
