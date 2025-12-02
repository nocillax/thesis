import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { usersAPI } from "@/lib/api/users";
import { toast } from "sonner";

// Infinite query for users list with auto-refetch (polling)
export function useUsers(status?: "authorized" | "revoked" | "admin") {
  return useInfiniteQuery({
    queryKey: ["users", status],
    queryFn: ({ pageParam = 1 }) => usersAPI.getAll(pageParam, 20, status),
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined,
    initialPageParam: 1,
    refetchInterval: 15000, // Poll every 15 seconds for blockchain updates
  });
}

// Single user query
export function useUser(address: string) {
  return useQuery({
    queryKey: ["user", address],
    queryFn: () => usersAPI.getByAddress(address),
    enabled: !!address,
  });
}

// Register user mutation
export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersAPI.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User registered successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to register user";
      toast.error(message);
    },
  });
}

// Revoke user mutation
export function useRevokeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersAPI.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User revoked");
    },
    onError: () => {
      toast.error("Failed to revoke user");
    },
  });
}

// Reactivate user mutation
export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersAPI.reactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User reactivated");
    },
    onError: () => {
      toast.error("Failed to reactivate user");
    },
  });
}

// Grant admin mutation
export function useGrantAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersAPI.grantAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Admin privileges granted");
    },
    onError: () => {
      toast.error("Failed to grant admin privileges");
    },
  });
}

// Revoke admin mutation
export function useRevokeAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersAPI.revokeAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Admin privileges revoked");
    },
    onError: () => {
      toast.error("Failed to revoke admin privileges");
    },
  });
}

// Bulk revoke users mutation
export function useBulkRevokeUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addresses: string[]) => {
      const results = [];
      const errors = [];

      for (const addr of addresses) {
        try {
          await usersAPI.revoke(addr);
          results.push(addr);
        } catch (error: any) {
          errors.push({ address: addr, error: error.message });
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      if (errors.length === 0) {
        toast.success(`${results.length} user(s) revoked successfully`);
      } else if (results.length === 0) {
        toast.error(`Failed to revoke all users`);
      } else {
        toast.warning(
          `${results.length} user(s) revoked, ${errors.length} failed`
        );
      }
    },
    onError: () => {
      toast.error("Failed to revoke users");
    },
  });
}

// Bulk reactivate users mutation
export function useBulkReactivateUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addresses: string[]) => {
      const results = [];
      const errors = [];

      for (const addr of addresses) {
        try {
          await usersAPI.reactivate(addr);
          results.push(addr);
        } catch (error: any) {
          errors.push({ address: addr, error: error.message });
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      if (errors.length === 0) {
        toast.success(`${results.length} user(s) authorized successfully`);
      } else if (results.length === 0) {
        toast.error(`Failed to authorize all users`);
      } else {
        toast.warning(
          `${results.length} user(s) authorized, ${errors.length} failed`
        );
      }
    },
    onError: () => {
      toast.error("Failed to authorize users");
    },
  });
}

// Bulk grant admin mutation
export function useBulkGrantAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addresses: string[]) => {
      const results = [];
      const errors = [];

      for (const addr of addresses) {
        try {
          await usersAPI.grantAdmin(addr);
          results.push(addr);
        } catch (error: any) {
          errors.push({ address: addr, error: error.message });
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      if (errors.length === 0) {
        toast.success(`Admin granted to ${results.length} user(s)`);
      } else if (results.length === 0) {
        toast.error(`Failed to grant admin to all users`);
      } else {
        toast.warning(
          `Admin granted to ${results.length} user(s), ${errors.length} failed`
        );
      }
    },
    onError: () => {
      toast.error("Failed to grant admin privileges");
    },
  });
}

// Bulk revoke admin mutation
export function useBulkRevokeAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addresses: string[]) => {
      const results = [];
      const errors = [];

      for (const addr of addresses) {
        try {
          await usersAPI.revokeAdmin(addr);
          results.push(addr);
        } catch (error: any) {
          errors.push({ address: addr, error: error.message });
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      if (errors.length === 0) {
        toast.success(`Admin revoked from ${results.length} user(s)`);
      } else if (results.length === 0) {
        toast.error(`Failed to revoke admin from all users`);
      } else {
        toast.warning(
          `Admin revoked from ${results.length} user(s), ${errors.length} failed`
        );
      }
    },
    onError: () => {
      toast.error("Failed to revoke admin privileges");
    },
  });
}
