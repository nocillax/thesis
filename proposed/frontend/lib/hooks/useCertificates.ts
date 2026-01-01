import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificatesAPI, CertificateFilters } from "@/lib/api/certificates";
import { toast } from "sonner";

// Paginated query for certificates list
export function useCertificates(
  page: number = 1,
  filters?: CertificateFilters,
  shouldPoll: boolean = true
) {
  return useQuery({
    queryKey: ["certificates", page, filters],
    queryFn: () => certificatesAPI.getAll(page, 20, filters),
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
    mutationFn: ({ hash, reason }: { hash: string; reason: string }) =>
      certificatesAPI.revoke(hash, reason),
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
