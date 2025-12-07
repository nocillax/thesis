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
      return <FileCheck className="h-3 w-3 text-green-600" />;
    case "REVOKED":
      return <Ban className="h-3 w-3 text-red-600" />;
    case "REACTIVATED":
      return <RefreshCw className="h-3 w-3 text-blue-600" />;
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

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
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

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

      {/* Stats Cards */}
      {user.is_admin ? (
        // Admin Dashboard - 4 cards in 2x2 grid
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                  Active Certificates
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {stats?.active_certificates ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Non-revoked certificates
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  Authorized Users
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {stats?.authorized_users ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Authorized system users
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                  Issued by Me
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {stats?.certificates_issued_by_me ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Your contributions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                  Recent Activity
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <History className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activity.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {getActionIcon(log.action)}
                        <Badge
                          variant="outline"
                          className={`${getActionBadgeVariant(
                            log.action
                          )} text-[10px] font-semibold`}
                        >
                          {log.action}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                  <Link
                    href={`/users/${user.wallet_address}`}
                    className="flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors mt-3 py-2 rounded-md hover:bg-primary/5"
                  >
                    View All Activity
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-medium">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Staff Dashboard - 3 cards
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                  Active Certificates
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {stats?.active_certificates ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    System-wide valid certificates
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                  Issued by Me
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {stats?.certificates_issued_by_me ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Your contributions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                  Recent Activity
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <History className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activity.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {getActionIcon(log.action)}
                        <Badge
                          variant="outline"
                          className={`${getActionBadgeVariant(
                            log.action
                          )} text-[10px] font-semibold`}
                        >
                          {log.action}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                  <Link
                    href={`/users/${user.wallet_address}`}
                    className="flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors mt-3 py-2 rounded-md hover:bg-primary/5"
                  >
                    View All Activity
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-medium">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Certificate Actions */}
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
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
              className="w-full justify-start h-11 font-semibold hover:bg-green-500/5 hover:text-green-600 hover:border-green-500/50 transition-all"
            >
              <Link href="/certificates">
                <FileText className="mr-2 h-4 w-4" />
                View All Certificates
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start h-11 font-semibold hover:bg-green-500/5 hover:text-green-600 hover:border-green-500/50 transition-all"
            >
              <Link href="/certificates/issue">
                <PlusCircle className="mr-2 h-4 w-4" />
                {user.is_admin ? "Issue New Certificate" : "Issue Certificate"}
              </Link>
            </Button>
            {user.is_admin && (
              <Button
                asChild
                variant="outline"
                className="w-full justify-start h-11 font-semibold hover:bg-green-500/5 hover:text-green-600 hover:border-green-500/50 transition-all"
              >
                <Link href="/verify">
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Certificate
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                  className="w-full justify-start h-11 font-semibold hover:bg-blue-500/5 hover:text-blue-600 hover:border-blue-500/50 transition-all"
                >
                  <Link href="/users">
                    <Users className="mr-2 h-4 w-4" />
                    View All Users
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start h-11 font-semibold hover:bg-blue-500/5 hover:text-blue-600 hover:border-blue-500/50 transition-all"
                >
                  <Link href="/users/register">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Register New User
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start h-11 font-semibold hover:bg-blue-500/5 hover:text-blue-600 hover:border-blue-500/50 transition-all"
                >
                  <Link href="/audit-logs/system">
                    <History className="mr-2 h-4 w-4" />
                    System Audit Logs
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start h-11 font-semibold hover:bg-blue-500/5 hover:text-blue-600 hover:border-blue-500/50 transition-all"
                >
                  <Link href={`/users/${user.wallet_address}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start h-11 font-semibold hover:bg-blue-500/5 hover:text-blue-600 hover:border-blue-500/50 transition-all"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
