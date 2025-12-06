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
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mt-2 flex items-center gap-2">
            <History className="h-8 w-8" />
            Certificate Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete history of actions for this certificate
          </p>
        </div>
      </div>

      {/* Certificate Hash */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Certificate Hash
            </p>
            <code className="text-xs bg-accent px-3 py-2 rounded border block overflow-x-auto">
              {hash}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Action History</CardTitle>
        </CardHeader>
        <CardContent>
          <CertificateAuditTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
