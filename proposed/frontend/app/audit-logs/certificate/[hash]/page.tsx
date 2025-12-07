"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { auditLogsAPI } from "@/lib/api/auditLogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { CertificateAuditTable } from "@/components/audit/CertificateAuditTable";
import { CopyButton } from "@/components/common/CopyButton";
import { truncateHash } from "@/lib/utils/format";

export default function CertificateAuditLogsPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = use(params);
  const router = useRouter();

  const {
    data: logs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["audit-logs", "certificate", hash],
    queryFn: () => auditLogsAPI.getByCertificate(hash),
    refetchInterval: 5000, // Poll every 5 seconds for audit logs
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !logs) {
    return (
      <div className="container py-8">
        <ErrorMessage message={error?.message || "Failed to load audit logs"} />
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
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
            <History className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">Certificate Audit Logs</h1>
            <p className="text-muted-foreground font-medium">
              Complete history of actions for this certificate
            </p>
          </div>
        </div>

        <Button variant="ghost" onClick={() => router.back()} size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-3">
            <CardTitle className="text-2xl font-bold">Action History</CardTitle>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Certificate Hash
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-accent px-3 py-1.5 rounded border font-mono break-all md:break-normal">
                  <span className="hidden md:inline">{hash}</span>
                  <span className="md:hidden">{truncateHash(hash)}</span>
                </code>
                <CopyButton text={hash} label="Copy Hash" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CertificateAuditTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
