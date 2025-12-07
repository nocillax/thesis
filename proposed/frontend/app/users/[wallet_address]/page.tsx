"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  auditLogsAPI,
  AuditLogEntry,
  PaginatedAuditLogs,
} from "@/lib/api/auditLogs";
import { usersAPI } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { UserAuditTable } from "@/components/audit/UserAuditTable";
import { UserProfileCard } from "@/components/users/UserProfileCard";

const ITEMS_PER_PAGE = 20;

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ wallet_address: string }>;
}) {
  const { wallet_address } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);

  // Fetch user details
  const {
    data: userData,
    isLoading: userLoading,
    isError: userError,
    error: userErrorMsg,
  } = useQuery({
    queryKey: ["user", wallet_address],
    queryFn: () => usersAPI.getByAddress(wallet_address),
    refetchInterval: 5000, // Poll every 5 seconds for user details
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch audit logs
  const {
    data: logsData,
    isLoading: logsLoading,
    isError: logsError,
    error: logsErrorMsg,
  } = useQuery({
    queryKey: ["audit-logs", "user", wallet_address, page],
    queryFn: () => auditLogsAPI.getByUser(wallet_address, page, ITEMS_PER_PAGE),
    refetchInterval: 5000, // Poll every 5 seconds for audit logs
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const isPaginated =
    logsData && typeof logsData === "object" && "meta" in logsData;
  const logs: AuditLogEntry[] = isPaginated
    ? (logsData as PaginatedAuditLogs).data
    : (logsData as AuditLogEntry[] | undefined) || [];
  const meta = isPaginated ? (logsData as PaginatedAuditLogs).meta : undefined;

  if (userLoading || logsLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="container py-8">
        <ErrorMessage
          message={userErrorMsg?.message || "Failed to load user details"}
        />
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  if (logsError) {
    return (
      <div className="container py-8">
        <ErrorMessage
          message={logsErrorMsg?.message || "Failed to load audit logs"}
        />
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
            <UserIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">User Profile</h1>
            <p className="text-muted-foreground font-medium">
              View user information and their action history
            </p>
          </div>
        </div>

        <Button variant="ghost" onClick={() => router.back()} size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
      </div>

      {/* User Profile Card */}
      {userData && (
        <div className="mb-6">
          <UserProfileCard
            walletAddress={userData.wallet_address}
            username={userData.username}
            email={userData.email}
            registrationDate={userData.registration_date}
            isAuthorized={userData.is_authorized}
            isAdmin={userData.is_admin}
          />
        </div>
      )}

      {/* Action History Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Action History</CardTitle>
            {meta && (
              <div className="text-sm text-muted-foreground font-medium">
                Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
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
