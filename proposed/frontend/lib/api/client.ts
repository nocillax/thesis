import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401 for login endpoint - let the login page handle it
    const isLoginEndpoint = error.config?.url?.includes("/auth/wallet-login");

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isLoginEndpoint
    ) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
