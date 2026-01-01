"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { sessionsAPI } from "@/lib/api/sessions";
import {
  auditLogsAPI,
  AuditLogEntry,
  PaginatedAuditLogs,
} from "@/lib/api/auditLogs";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { SystemAuditTable } from "@/components/audit/SystemAuditTable";
import { formatDateTime } from "@/lib/utils/format";

const ITEMS_PER_PAGE = 20;

export default function OfflineActivitiesPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.is_admin)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Get the last offline period
  const { data: offlinePeriod, isLoading: periodLoading } = useQuery({
    queryKey: ["last-offline-period"],
    queryFn: () => sessionsAPI.getLastOfflinePeriod(),
    enabled: isAuthenticated && user?.is_admin,
  });

  // Get audit logs for that period
  const {
    data,
    isLoading: logsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["offline-audit-logs", page, offlinePeriod],
    queryFn: () => {
      if (!offlinePeriod) return { data: [], meta: null };
      return auditLogsAPI.getByTimeRange(
        offlinePeriod.start,
        offlinePeriod.end,
        page,
        ITEMS_PER_PAGE
      );
    },
    enabled:
      isAuthenticated &&
      user?.is_admin &&
      offlinePeriod !== null &&
      offlinePeriod !== undefined,
  });

  const isPaginated = data && typeof data === "object" && "meta" in data;
  const logs: AuditLogEntry[] = isPaginated
    ? (data as PaginatedAuditLogs).data
    : (data as AuditLogEntry[] | undefined) || [];
  const meta = isPaginated ? (data as PaginatedAuditLogs).meta : undefined;

  const isLoading = authLoading || periodLoading || logsLoading;

  if (isLoading) {
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
        <ErrorMessage
          message={error?.message || "Failed to load offline activities"}
        />
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
            <Clock className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">
              While You Were Away
            </h1>
            {offlinePeriod ? (
              <p className="text-muted-foreground font-medium">
                Activity from{" "}
                <span className="font-semibold">
                  {formatDateTime(offlinePeriod.start)}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {formatDateTime(offlinePeriod.end)}
                </span>{" "}
                ({offlinePeriod.duration_minutes} minutes offline)
              </p>
            ) : (
              <p className="text-muted-foreground font-medium">
                No offline period detected - this is your first login or you
                haven't logged out yet
              </p>
            )}
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

      {/* Content */}
      {!offlinePeriod ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Offline Period</h3>
              <p className="text-muted-foreground">
                This is either your first login, or you haven't logged out from
                your previous session yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Offline Period Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Offline From
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatDateTime(offlinePeriod.start)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Back Online At
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatDateTime(offlinePeriod.end)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Time Offline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {offlinePeriod.duration_minutes < 60
                    ? `${offlinePeriod.duration_minutes} min`
                    : `${Math.floor(offlinePeriod.duration_minutes / 60)}h ${
                        offlinePeriod.duration_minutes % 60
                      }m`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Audit Logs */}
          {logs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Activity While Away
                  </h3>
                  <p className="text-muted-foreground">
                    There were no certificate actions during your offline
                    period.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">
                    Certificate Actions During Offline Period
                  </CardTitle>
                  {meta && (
                    <div className="text-sm text-muted-foreground font-medium">
                      Page {meta.current_page} of {meta.total_pages} (
                      {meta.total_count} total)
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
          )}
        </>
      )}
    </div>
  );
}
