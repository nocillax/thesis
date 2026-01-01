import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usersAPI } from "@/lib/api/users";
import { sessionsAPI } from "@/lib/api/sessions";
import { User } from "@/types/user";

interface AuthState {
  isAuthenticated: boolean;
  walletAddress: string | null;
  token: string | null;
  user: User | null;
  isLoading: boolean;

  setAuth: (data: {
    isAuthenticated: boolean;
    walletAddress: string;
    token: string;
  }) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      walletAddress: null,
      token: null,
      user: null,
      isLoading: true,

      setAuth: (data) => {
        // Store token in localStorage for API client
        if (typeof window !== "undefined" && data.token) {
          localStorage.setItem("access_token", data.token);
        }
        set({
          isAuthenticated: data.isAuthenticated,
          walletAddress: data.walletAddress,
          token: data.token,
          isLoading: true,
        });
        // Fetch user immediately after setting auth
        get().fetchUser();
      },

      setUser: (user) => set({ user }),

      logout: async () => {
        // Record logout session BEFORE clearing token
        if (typeof window !== "undefined") {
          const isAuthenticated = get().isAuthenticated;
          if (isAuthenticated) {
            try {
              await sessionsAPI.recordLogout();
            } catch (error) {
              console.error("Failed to record logout:", error);
            }
          }

          localStorage.removeItem("access_token");
          // Clear user polling interval
          const existingInterval = (window as any).__userPollingInterval;
          if (existingInterval) {
            clearInterval(existingInterval);
            delete (window as any).__userPollingInterval;
          }
        }
        set({
          isAuthenticated: false,
          walletAddress: null,
          token: null,
          user: null,
        });
      },

      fetchUser: async () => {
        try {
          const walletAddress = get().walletAddress;
          if (!walletAddress) {
            set({ isLoading: false });
            return;
          }

          set({ isLoading: true });
          const user = await usersAPI.getByAddress(walletAddress);
          set({ user, isLoading: false });

          // Set up polling for privilege changes (every 30 seconds)
          if (typeof window !== "undefined") {
            // Clear any existing polling interval
            const existingInterval = (window as any).__userPollingInterval;
            if (existingInterval) {
              clearInterval(existingInterval);
            }

            // Start new polling interval
            (window as any).__userPollingInterval = setInterval(async () => {
              try {
                const currentWalletAddress = get().walletAddress;
                if (currentWalletAddress) {
                  const updatedUser = await usersAPI.getByAddress(
                    currentWalletAddress
                  );
                  const currentUser = get().user;

                  // Check if admin status or authorization changed
                  if (
                    currentUser &&
                    updatedUser &&
                    (currentUser.is_admin !== updatedUser.is_admin ||
                      currentUser.is_authorized !== updatedUser.is_authorized)
                  ) {
                    // Privileges changed - update user data
                    set({ user: updatedUser });

                    // If user was revoked or lost admin while viewing admin pages, they'll be redirected by route guards
                  } else if (updatedUser) {
                    set({ user: updatedUser });
                  }
                }
              } catch (error) {
                console.error("Failed to poll user data:", error);
              }
            }, 30000); // Poll every 30 seconds
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        walletAddress: state.walletAddress,
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Keep loading true if we need to fetch user
          if (state.isAuthenticated && state.walletAddress && !state.user) {
            state.isLoading = true;
            state.fetchUser();
          } else {
            state.isLoading = false;
          }
        }
      },
    }
  )
);
