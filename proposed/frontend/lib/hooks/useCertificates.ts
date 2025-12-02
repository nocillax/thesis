import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { certificatesAPI } from "@/lib/api/certificates";
import { toast } from "sonner";

// Infinite query for certificates list
export function useCertificates(status?: "active" | "revoked") {
  return useInfiniteQuery({
    queryKey: ["certificates", status],
    queryFn: ({ pageParam = 1 }) =>
      certificatesAPI.getAll(pageParam, 20, status),
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined,
    initialPageParam: 1,
    refetchInterval: 15000, // Poll every 15 seconds
  });
}

// Single certificate query
export function useCertificate(hash: string) {
  return useQuery({
    queryKey: ["certificate", hash],
    queryFn: () => certificatesAPI.verify(hash),
    enabled: !!hash,
  });
}

// Student certificates query
export function useStudentCertificates(studentId: string) {
  return useQuery({
    queryKey: ["certificates", "student", studentId],
    queryFn: () => certificatesAPI.getAllVersions(studentId),
    enabled: !!studentId,
  });
}

// Issue certificate mutation
export function useIssueCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: certificatesAPI.issue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate issued successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to issue certificate";
      toast.error(message);
    },
  });
}

// Revoke certificate mutation
export function useRevokeCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: certificatesAPI.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate revoked");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to revoke certificate";
      toast.error(message);
    },
  });
}

// Reactivate certificate mutation
export function useReactivateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: certificatesAPI.reactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate reactivated");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to reactivate certificate";
      toast.error(message);
    },
  });
}

// Bulk revoke mutation
export function useBulkRevokeCertificates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hashes: string[]) => {
      const results = [];
      const errors = [];

      for (const hash of hashes) {
        try {
          await certificatesAPI.revoke(hash);
          results.push(hash);
        } catch (error) {
          errors.push(hash);
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });

      if (results.length > 0 && errors.length === 0) {
        toast.success(`${results.length} certificate(s) revoked`);
      } else if (results.length > 0 && errors.length > 0) {
        toast.warning(`${results.length} revoked, ${errors.length} failed`);
      } else {
        toast.error("Failed to revoke certificates");
      }
    },
    onError: () => {
      toast.error("Failed to revoke certificates");
    },
  });
}

// Bulk reactivate mutation
export function useBulkReactivateCertificates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hashes: string[]) => {
      const results = [];
      const errors = [];

      for (const hash of hashes) {
        try {
          await certificatesAPI.reactivate(hash);
          results.push(hash);
        } catch (error) {
          errors.push(hash);
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });

      if (results.length > 0 && errors.length === 0) {
        toast.success(`${results.length} certificate(s) reactivated`);
      } else if (results.length > 0 && errors.length > 0) {
        toast.warning(`${results.length} reactivated, ${errors.length} failed`);
      } else {
        toast.error("Failed to reactivate certificates");
      }
    },
    onError: () => {
      toast.error("Failed to reactivate certificates");
    },
  });
}
