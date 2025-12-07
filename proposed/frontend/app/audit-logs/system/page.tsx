"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  auditLogsAPI,
  AuditLogEntry,
  PaginatedAuditLogs,
} from "@/lib/api/auditLogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { SystemAuditTable } from "@/components/audit/SystemAuditTable";

const ITEMS_PER_PAGE = 20;

export default function SystemAuditLogsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.is_admin)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit-logs", "system", page],
    queryFn: () => auditLogsAPI.getAll(page, ITEMS_PER_PAGE),
    enabled: isAuthenticated && user?.is_admin,
    refetchInterval: 5000, // Poll every 5 seconds for audit logs
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const isPaginated = data && typeof data === "object" && "meta" in data;
  const logs: AuditLogEntry[] = isPaginated
    ? (data as PaginatedAuditLogs).data
    : (data as AuditLogEntry[] | undefined) || [];
  const meta = isPaginated ? (data as PaginatedAuditLogs).meta : undefined;

  if (authLoading || isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  if (isError) {
    return (
      <div className="container py-8">
        <ErrorMessage message={error?.message || "Failed to load audit logs"} />
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
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
            <h1 className="text-4xl font-bold tracking-tight mb-1">System Audit Logs</h1>
            <p className="text-muted-foreground font-medium">
              Complete system-wide activity log for all certificates
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          size="lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">All Certificate Actions</CardTitle>
            {meta && (
              <div className="text-sm text-muted-foreground font-medium">
                Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SystemAuditTable logs={logs} />

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground font-medium px-4">
                Page {page} of {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.has_more}
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
