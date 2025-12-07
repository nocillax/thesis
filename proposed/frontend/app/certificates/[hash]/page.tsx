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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { certificatesAPI } from "@/lib/api/certificates";
import {
  useRevokeCertificate,
  useReactivateCertificate,
} from "@/lib/hooks/useCertificates";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { CopyButton } from "@/components/common/CopyButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatCGPA, truncateHash } from "@/lib/utils/format";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CertificateDetailPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

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

  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

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
                {certificate.is_revoked ? (
                  <Button
                    variant="outline"
                    onClick={() => reactivate(certificate.cert_hash)}
                    disabled={isReactivating}
                    size="lg"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => revoke(certificate.cert_hash)}
                    disabled={isRevoking}
                    size="lg"
                  >
                    <Ban className="mr-2 h-5 w-5" />
                    Revoke
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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

      {/* Additional Information Section */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Certificate Metadata */}
        <Card>
          <CardHeader className="pb-3">
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
          <CardHeader className="pb-3">
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
              <p className="font-bold text-lg">
                {formatCGPA(certificate.cgpa)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Program Details */}
        <Card>
          <CardHeader className="pb-3">
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
            <Button variant="outline" asChild className="flex-1" size="lg">
              <Link href={`/certificates/student/${certificate.student_id}`}>
                Show All Versions
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1" size="lg">
              <Link href={`/audit-logs/certificate/${certificate.cert_hash}`}>
                Audit Logs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
