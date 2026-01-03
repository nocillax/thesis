"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  RefreshCw,
  Calendar,
  User,
  Award,
  Building,
  Blocks,
  FileSignature,
  Download,
  FileText,
  Send,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificatesAPI } from "@/lib/api/certificates";
import { certificateActionRequestsAPI } from "@/lib/api/certificate-action-requests";
import {
  useRevokeCertificate,
  useReactivateCertificate,
} from "@/lib/hooks/useCertificates";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { CopyButton } from "@/components/common/CopyButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RevokeDialog } from "@/components/certificates/RevokeDialog";
import { formatDate, formatCGPA, truncateHash } from "@/lib/utils/format";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CertificateDetailPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestAction, setRequestAction] = useState<"revoke" | "reactivate">(
    "revoke"
  );
  const [requestReason, setRequestReason] = useState("");

  const {
    data: certificate,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["certificate", hash],
    queryFn: () => certificatesAPI.verify(hash),
  });

  const { mutate: revoke, isPending: isRevoking } = useRevokeCertificate();
  const { mutate: reactivate, isPending: isReactivating } =
    useReactivateCertificate();

  const requestMutation = useMutation({
    mutationFn: () =>
      certificateActionRequestsAPI.create({
        cert_hash: hash,
        action_type: requestAction,
        reason: requestReason,
      }),
    onSuccess: () => {
      toast.success(
        `${
          requestAction === "revoke" ? "Revocation" : "Reactivation"
        } request submitted successfully`
      );
      setShowRequestDialog(false);
      setRequestReason("");
      queryClient.invalidateQueries({
        queryKey: ["cert-action-requests", hash],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit request");
    },
  });

  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  // Query for revoke reason if certificate is revoked
  const { data: revokeReason } = useQuery({
    queryKey: ["revoke-reason", hash],
    queryFn: () => certificatesAPI.getRevokeReason(hash),
    enabled: certificate?.is_revoked === true,
  });

  // Query for pending requests for this certificate
  const { data: certRequests } = useQuery({
    queryKey: ["cert-action-requests", hash],
    queryFn: () => certificateActionRequestsAPI.getByCertHash(hash),
    enabled: user?.is_authorized === true,
  });

  const hasPendingRequest = certRequests?.some(
    (req: any) => req.status === "pending"
  );

  const openRequestDialog = (action: "revoke" | "reactivate") => {
    setRequestAction(action);
    setShowRequestDialog(true);
  };

  const handleSubmitRequest = () => {
    if (requestReason.trim()) {
      requestMutation.mutate();
    }
  };

  const handleRevokeWithReason = (reason: string) => {
    revoke(
      { hash, reason },
      {
        onSuccess: () => {
          setShowRevokeDialog(false);
          // Refresh the page to show updated data
          router.refresh();
          queryClient.invalidateQueries({ queryKey: ["certificate", hash] });
          queryClient.invalidateQueries({ queryKey: ["revoke-reason", hash] });
        },
      }
    );
  };

  const handleReactivate = () => {
    if (!certificate) return;
    reactivate(certificate.cert_hash, {
      onSuccess: () => {
        // Refresh the page to show updated data
        router.refresh();
        queryClient.invalidateQueries({ queryKey: ["certificate", hash] });
        queryClient.invalidateQueries({ queryKey: ["revoke-reason", hash] });
      },
    });
  };

  const handleDownloadPDF = () => {
    const downloadUrl = `${API_BASE_URL}/api/blockchain/certificates/${hash}/download`;
    window.open(downloadUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div className="container py-8">
        <ErrorMessage message={error?.message || "Certificate not found"} />
        <Button onClick={() => router.push("/certificates")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Certificates
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">
              Certificate Details
            </h1>
            <p className="text-muted-foreground font-bold">
              {certificate.student_id}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.back()} size="lg">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
            {user?.is_authorized && (
              <>
                {user.is_admin ? (
                  // Admin: Direct revoke/reactivate buttons
                  <>
                    {certificate.is_revoked ? (
                      <Button
                        variant="outline"
                        onClick={handleReactivate}
                        disabled={isReactivating}
                        size="lg"
                      >
                        {isReactivating ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Reactivating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Reactivate
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={() => setShowRevokeDialog(true)}
                        disabled={isRevoking}
                        size="lg"
                      >
                        <Ban className="mr-2 h-5 w-5" />
                        Revoke
                      </Button>
                    )}
                  </>
                ) : (
                  // Non-admin: Request revoke/reactivate buttons
                  <>
                    {certificate.is_revoked ? (
                      <Button
                        variant="outline"
                        onClick={() => openRequestDialog("reactivate")}
                        disabled={hasPendingRequest}
                        size="lg"
                      >
                        <Send className="mr-2 h-5 w-5" />
                        {hasPendingRequest
                          ? "Request Pending"
                          : "Request Reactivation"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => openRequestDialog("revoke")}
                        disabled={hasPendingRequest}
                        size="lg"
                      >
                        <Send className="mr-2 h-5 w-5" />
                        {hasPendingRequest
                          ? "Request Pending"
                          : "Request Revocation"}
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Revoke Dialog */}
      <RevokeDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        onConfirm={handleRevokeWithReason}
        isPending={isRevoking}
        certificateHash={hash}
      />

      {/* Certificate Preview */}
      <div className="mb-6 w-full aspect-[297/210] relative overflow-hidden rounded-lg border">
        {isPreviewLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground font-medium">
                Generating certificate preview...
              </p>
            </div>
          </div>
        )}
        <img
          src={`${API_BASE_URL}/api/blockchain/certificates/${hash}/preview?t=${Date.now()}`}
          alt="Certificate Preview"
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={() => setIsPreviewLoading(false)}
        />
      </div>

      {/* Revocation Information Card - Shows above the 3-card grid */}
      {certificate.is_revoked && revokeReason && (
        <Card className="mb-6 border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-700">
              <Ban className="h-5 w-5" />
              Certificate Revocation Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-semibold">
                  Revoked By
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {revokeReason.revoked_by_name || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {revokeReason.revoked_by}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-semibold">
                  Revoked At
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {revokeReason.revoked_at}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                Revocation Reason
              </p>
              <p className="text-sm text-red-700 bg-white border border-red-200 rounded-lg p-3 leading-relaxed">
                {revokeReason.reason}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information Section */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Certificate Metadata */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Certificate Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Status
              </p>
              <StatusBadge isActive={!certificate.is_revoked} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Issuer
              </p>
              <p className="font-semibold">{certificate.issuer_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Version
              </p>
              <p className="font-mono font-semibold">v{certificate.version}</p>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Information */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5" />
              Academic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Student ID
              </p>
              <p className="font-mono font-semibold">
                {certificate.student_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Student Name
              </p>
              <p className="font-semibold">{certificate.student_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                CGPA
              </p>
              <p className="font-semibold ">{formatCGPA(certificate.cgpa)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Program Details */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Program Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Degree
              </p>
              <p className="font-semibold">{certificate.degree}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Program
              </p>
              <p className="font-semibold">{certificate.program}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Issuing Authority
              </p>
              <p className="font-semibold">{certificate.issuing_authority}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Blockchain Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Certificate Hash
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-accent px-2 py-1 rounded border flex-1 overflow-hidden break-all md:break-normal font-mono">
                <span className="hidden md:inline">
                  {certificate.cert_hash}
                </span>
                <span className="md:hidden">
                  {truncateHash(certificate.cert_hash)}
                </span>
              </code>
              <CopyButton text={certificate.cert_hash} label="Copy Hash" />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Issuer Wallet Address
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-accent px-2 py-1 rounded border flex-1 overflow-hidden break-all md:break-normal font-mono">
                <span className="hidden md:inline">{certificate.issuer}</span>
                <span className="md:hidden">
                  {truncateHash(certificate.issuer)}
                </span>
              </code>
              <CopyButton text={certificate.issuer} label="Copy Address" />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Digital Signature
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-accent px-2 py-1 rounded border flex-1 overflow-hidden break-all md:break-normal font-mono">
                <span className="hidden md:inline">
                  {certificate.signature}
                </span>
                <span className="md:hidden">
                  {truncateHash(certificate.signature)}
                </span>
              </code>
              <CopyButton text={certificate.signature} label="Copy Signature" />
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              variant="outline"
              asChild
              className="flex-1 font-semibold"
              size="lg"
            >
              <Link href={`/certificates/student/${certificate.student_id}`}>
                Show All Versions
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1 font-semibold"
              size="lg"
            >
              <Link href={`/audit-logs/certificate/${certificate.cert_hash}`}>
                Audit Logs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Request{" "}
              {requestAction === "revoke" ? "Revocation" : "Reactivation"}
            </DialogTitle>
            <DialogDescription>
              Submit a request to {requestAction} this certificate. An admin
              will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="request-reason">Reason *</Label>
              <Textarea
                id="request-reason"
                placeholder={`e.g., ${
                  requestAction === "revoke"
                    ? "Certificate contains errors, needs to be reissued..."
                    : "Issue has been resolved, certificate should be restored..."
                }`}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false);
                setRequestReason("");
              }}
              disabled={requestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={!requestReason.trim() || requestMutation.isPending}
            >
              {requestMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
