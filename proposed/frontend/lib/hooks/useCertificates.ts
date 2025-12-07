import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { certificatesAPI, CertificateFilters } from "@/lib/api/certificates";
import { toast } from "sonner";

// Infinite query for certificates list
export function useCertificates(
  filters?: CertificateFilters,
  shouldPoll: boolean = true
) {
  return useInfiniteQuery({
    queryKey: ["certificates", filters],
    queryFn: ({ pageParam = 1 }) =>
      certificatesAPI.getAll(pageParam, 20, filters),
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined,
    initialPageParam: 1,
    refetchInterval: shouldPoll ? 15000 : false, // Poll every 15 seconds when enabled
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

// Single certificate query
export function useCertificate(hash: string, shouldPoll: boolean = true) {
  return useQuery({
    queryKey: ["certificate", hash],
    queryFn: () => certificatesAPI.verify(hash),
    enabled: !!hash,
    refetchInterval: shouldPoll ? 5000 : false, // Poll every 5 seconds for individual cert
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

// Student certificates query
export function useStudentCertificates(
  studentId: string,
  shouldPoll: boolean = true
) {
  return useQuery({
    queryKey: ["certificates", "student", studentId],
    queryFn: () => certificatesAPI.getAllVersions(studentId),
    enabled: !!studentId,
    refetchInterval: shouldPoll ? 5000 : false, // Poll every 5 seconds for student certs
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
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
      // Sequential processing to avoid race conditions on blockchain
      for (const hash of hashes) {
        await certificatesAPI.revoke(hash);
      }
      return hashes.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success(`${count} certificate(s) revoked`);
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
      // Sequential processing to avoid race conditions on blockchain
      for (const hash of hashes) {
        await certificatesAPI.reactivate(hash);
      }
      return hashes.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success(`${count} certificate(s) reactivated`);
    },
    onError: () => {
      toast.error("Failed to reactivate certificates");
    },
  });
}
