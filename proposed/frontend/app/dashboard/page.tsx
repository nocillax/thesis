"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Users,
  PlusCircle,
  Shield,
  TrendingUp,
  Clock,
  FileClock,
  History,
  CheckCircle2,
  UserCheck,
  Award,
  ArrowRight,
  FileCheck,
  Ban,
  RefreshCw,
  User as UserIcon,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { statsAPI } from "@/lib/api/stats";
import { certificateActionRequestsAPI } from "@/lib/api/certificate-action-requests";
import { auditLogsAPI } from "@/lib/api/auditLogs";
import { sessionsAPI } from "@/lib/api/sessions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const getActionIcon = (action: string) => {
  switch (action) {
    case "ISSUED":
      return <FileCheck className="h-3 w-3 text-blue-600" />;
    case "REVOKED":
      return <Ban className="h-3 w-3 text-red-600" />;
    case "REACTIVATED":
      return <RefreshCw className="h-3 w-3 text-green-600" />;
    default:
      return null;
  }
};

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case "ISSUED":
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
    case "REVOKED":
      return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
    case "REACTIVATED":
      return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
  }
};

const getWalletFromLog = (log: any) => {
  switch (log.action) {
    case "ISSUED":
      return log.issuer;
    case "REVOKED":
      return log.revoked_by;
    case "REACTIVATED":
      return log.reactivated_by;
    default:
      return log.issuer;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["stats"],
    queryFn: statsAPI.get,
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5 seconds for dashboard stats
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: pendingRequestsCount } = useQuery({
    queryKey: ["pending-action-requests-count"],
    queryFn: certificateActionRequestsAPI.getPendingCount,
    enabled: isAuthenticated && user?.is_admin === true,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const { data: myNonCompletedCount } = useQuery({
    queryKey: ["my-non-completed-requests-count"],
    queryFn: certificateActionRequestsAPI.getMyNonCompletedCount,
    enabled: isAuthenticated && user?.is_admin === false,
    refetchInterval: 30000,
  });

  const { data: recentSystemActivity } = useQuery({
    queryKey: ["recent-system-activity"],
    queryFn: () => auditLogsAPI.getAll(1, 5),
    enabled: isAuthenticated && user?.is_admin === true,
    refetchInterval: 30000,
  });

  const { data: lastOfflinePeriod } = useQuery({
    queryKey: ["last-offline-period"],
    queryFn: sessionsAPI.getLastOfflinePeriod,
    enabled: isAuthenticated && user?.is_admin === true,
  });

  const { data: offlineActivities } = useQuery({
    queryKey: [
      "offline-activities",
      lastOfflinePeriod?.start,
      lastOfflinePeriod?.end,
    ],
    queryFn: () => {
      if (!lastOfflinePeriod) return [];
      return auditLogsAPI.getByTimeRange(
        lastOfflinePeriod.start,
        lastOfflinePeriod.end,
        1,
        5
      );
    },
    enabled: isAuthenticated && user?.is_admin === true && !!lastOfflinePeriod,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Welcome Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, <span className="text-primary">{user.username}</span>
          </h1>

          {user.is_admin && (
            <Badge className=" bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-primary/20 font-semibold text-sm px-3 py-1">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          {user.is_admin
            ? "Manage certificates and users across the system"
            : "View and manage all certificates"}
        </p>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid gap-6 mb-10 ${
          user.is_admin ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"
        }`}
      >
        {/* Pending Revocation Requests (Admin) or Pending Requests (Staff) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                Pending Requests
              </CardTitle>
              <div className="h-10 w-10 flex items-center justify-center">
                <FileClock className="h-5 w-5 text-chart-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-5xl font-bold text-foreground mb-3">
                  {user.is_admin
                    ? pendingRequestsCount ?? "-"
                    : myNonCompletedCount ?? "-"}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {user.is_admin
                    ? "Action requests awaiting review"
                    : "Your non-completed requests"}
                </p>
                <Link
                  href="/certificate-action-requests"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors mt-3"
                >
                  View All Requests
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Certificates */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                Active Certificates
              </CardTitle>
              <div className="h-10 w-10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-chart-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-5xl font-bold text-foreground mb-3">
                  {stats?.active_certificates ?? "-"}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {user.is_admin
                    ? "Non-revoked certificates"
                    : "System-wide valid certificates"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Authorized Users (Admin Only) */}
        {user.is_admin && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Authorized Users
                </CardTitle>
                <div className="h-10 w-10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-chart-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-5xl font-bold text-foreground mb-3">
                    {stats?.authorized_users ?? "-"}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Authorized system users
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Issued by Me */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                Issued by Me
              </CardTitle>
              <div className="h-10 w-10 flex items-center justify-center">
                <Award className="h-5 w-5 text-chart-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-5xl font-bold text-foreground mb-3">
                  {stats?.certificates_issued_by_me ?? "-"}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Your contributions
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Activity Sections */}
      {user.is_admin && (
        <>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">
              Activity Overview
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-10">
            {/* Recent Activity Section */}
            <Card className="border min-h-[400px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-chart-2 flex items-center justify-center">
                    <History className="h-5 w-5 text-chart-1" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Recent Activity
                  </CardTitle>
                </div>
                <CardDescription className="font-medium">
                  Latest system-wide certificate actions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                {!recentSystemActivity ? (
                  <div className="flex items-center justify-center flex-1">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (Array.isArray(recentSystemActivity)
                    ? recentSystemActivity
                    : (recentSystemActivity as any)?.data || []
                  ).length > 0 ? (
                  <div className="space-y-2 flex-1">
                    {(Array.isArray(recentSystemActivity)
                      ? recentSystemActivity
                      : (recentSystemActivity as any)?.data || []
                    ).map((log: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50"
                      >
                        <Badge
                          variant="outline"
                          className={`${getActionBadgeVariant(
                            log.action
                          )} text-[10px] sm:text-xs font-semibold flex-shrink-0`}
                        >
                          {log.action}
                        </Badge>
                        <span className="hidden sm:inline text-xs font-bold text-muted-foreground flex-shrink-0">
                          -
                        </span>
                        <span className="hidden sm:inline text-xs font-bold text-muted-foreground flex-shrink-0">
                          Certificate:
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono text-foreground flex-shrink-0">
                          {log.cert_hash.slice(0, 6)}...
                          {log.cert_hash.slice(-4)}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium ml-auto flex-shrink-0">
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3">
                    <History className="h-16 w-16 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground font-medium">
                      No recent activity
                    </p>
                  </div>
                )}
                <div className="pt-4 mt-auto">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
                  >
                    <Link href="/audit-logs/system">
                      View All Activity
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Offline Activity Section */}
            <Card className="border min-h-[400px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-chart-2 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-chart-1" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    While You Were Away
                  </CardTitle>
                </div>
                <CardDescription className="font-medium">
                  Activities during your last offline period
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                {!lastOfflinePeriod ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3">
                    <Clock className="h-16 w-16 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground font-medium">
                      No offline period detected
                    </p>
                  </div>
                ) : !offlineActivities ? (
                  <div className="flex items-center justify-center flex-1">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : Array.isArray(offlineActivities) &&
                  offlineActivities.length > 0 ? (
                  <div className="space-y-2 flex-1">
                    {offlineActivities.map((log: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50"
                      >
                        <Badge
                          variant="outline"
                          className={`${getActionBadgeVariant(
                            log.action
                          )} text-[10px] sm:text-xs font-semibold flex-shrink-0`}
                        >
                          {log.action}
                        </Badge>
                        <span className="hidden sm:inline text-xs text-muted-foreground flex-shrink-0">
                          -
                        </span>
                        <span className="hidden sm:inline text-xs text-muted-foreground flex-shrink-0">
                          Certificate:
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono text-foreground flex-shrink-0">
                          {log.cert_hash.slice(0, 6)}...
                          {log.cert_hash.slice(-4)}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium ml-auto flex-shrink-0">
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3">
                    <Clock className="h-16 w-16 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground font-medium">
                      No activity while you were offline
                    </p>
                  </div>
                )}
                <div className="pt-4 mt-auto">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
                    disabled={!lastOfflinePeriod}
                  >
                    <Link href="/offline-activities">
                      View All Offline Activity
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Section Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">
          Quick Actions
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Management */}
        <Card className="border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-chart-2 flex items-center justify-center">
                <Users className="h-5 w-5 text-chart-1" />
              </div>
              <CardTitle className="text-lg font-bold">
                User Management
              </CardTitle>
            </div>
            <CardDescription className="font-medium">
              {user.is_admin
                ? "Manage authorized users and permissions"
                : "Manage your profile and account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {user.is_admin ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
                >
                  <Link href="/users">
                    <Users className="mr-2 h-4 w-4" />
                    View All Users
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
                >
                  <Link href="/users/register">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Register New User
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
                >
                  <Link href={`/users/${user.wallet_address}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Certificate Management */}
        <Card className="border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-chart-2 flex items-center justify-center">
                <FileText className="h-5 w-5 text-chart-1" />
              </div>
              <CardTitle className="text-lg font-bold">
                Certificate Management
              </CardTitle>
            </div>
            <CardDescription className="font-medium">
              Issue, verify, and manage certificates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <Button
              asChild
              variant="outline"
              className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
            >
              <Link href="/certificates">
                <FileText className="mr-2 h-4 w-4" />
                View All Certificates
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
            >
              <Link href="/certificates/issue">
                <PlusCircle className="mr-2 h-4 w-4" />
                Issue New Certificate
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Logs - Admin Only */}
        {user.is_admin && (
          <Card className="border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-chart-2 flex items-center justify-center">
                  <History className="h-5 w-5 text-chart-1" />
                </div>
                <CardTitle className="text-lg font-bold">Logs</CardTitle>
              </div>
              <CardDescription className="font-medium">
                View system and verifier activity logs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
              >
                <Link href="/audit-logs/system">
                  <History className="mr-2 h-4 w-4" />
                  Certificate Logs
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start h-11 font-semibold hover:bg-chart-2 hover:text-chart-1 transition-all"
              >
                <Link href="/verifiers">
                  <Shield className="mr-2 h-4 w-4" />
                  Verifiers Logs
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
