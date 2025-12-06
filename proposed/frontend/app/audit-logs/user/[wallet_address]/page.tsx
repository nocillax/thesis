"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  auditLogsAPI,
  AuditLogEntry,
  PaginatedAuditLogs,
} from "@/lib/api/auditLogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { UserAuditTable } from "@/components/audit/UserAuditTable";
import { truncateAddress } from "@/lib/utils/format";

const ITEMS_PER_PAGE = 20;

export default function UserAuditLogsPage({
  params,
}: {
  params: Promise<{ wallet_address: string }>;
}) {
  const { wallet_address } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit-logs", "user", wallet_address, page],
    queryFn: () => auditLogsAPI.getByUser(wallet_address, page, ITEMS_PER_PAGE),
  });

  const isPaginated = data && typeof data === "object" && "meta" in data;
  const logs: AuditLogEntry[] = isPaginated
    ? (data as PaginatedAuditLogs).data
    : (data as AuditLogEntry[] | undefined) || [];
  const meta = isPaginated ? (data as PaginatedAuditLogs).meta : undefined;

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
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
            User Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            All certificate actions performed by this user
          </p>
        </div>
      </div>

      {/* Wallet Address */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
            <code className="text-xs bg-accent px-3 py-2 rounded border block overflow-x-auto">
              {wallet_address}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Action History</CardTitle>
            {meta && (
              <div className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.total_pages} (
                {meta.total_count} total)
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <UserAuditTable logs={logs} />

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.has_more}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
