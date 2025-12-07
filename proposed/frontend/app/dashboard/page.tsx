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
  const { isAuthenticated, user, isLoading } = useAuthStore();

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
    <div className="container py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.username}!
          {user.is_admin && (
            <Shield className="inline-block ml-2 h-7 w-7 text-primary" />
          )}
        </h1>
        <p className="text-muted-foreground">
          {user.is_admin
            ? "Admin Dashboard - Manage certificates and users"
            : "Manage your certificates"}
        </p>
      </div>

      {/* Stats Cards */}
      {user.is_admin ? (
        // Admin Dashboard - 4 cards in 2x2 grid
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Active Certificates
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.active_certificates ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Non-revoked certificates
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Authorized Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.authorized_users ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Authorized system users
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Issued by Me
              </CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats?.certificates_issued_by_me ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your contributions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recent_activity.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <Badge
                        variant="outline"
                        className={`${getActionBadgeVariant(
                          log.action
                        )} text-[10px] py-0`}
                      >
                        {log.action}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    asChild
                  >
                    <Link href={`/users/${user.wallet_address}`}>
                      View All
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Non-Admin Dashboard - 3 cards
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Active Certificates
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.active_certificates ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    System-wide valid certificates
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Issued by Me
              </CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats?.certificates_issued_by_me ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your contributions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recent_activity.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <Badge
                        variant="outline"
                        className={`${getActionBadgeVariant(
                          log.action
                        )} text-[10px] py-0`}
                      >
                        {log.action}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    asChild
                  >
                    <Link href={`/users/${user.wallet_address}`}>
                      View All
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Certificate Actions */}
        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificate Management
            </CardTitle>
            <CardDescription>
              Issue, verify, and manage certificates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/certificates">
                <FileText className="mr-2 h-4 w-4" />
                View All Certificates
              </Link>
            </Button>
            {user.is_admin && (
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/certificates/issue">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Issue New Certificate
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/verify">
                <Shield className="mr-2 h-4 w-4" />
                Verify Certificate
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* User Management (Admin Only) */}
        {user.is_admin && (
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage authorized users and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/users">
                  <Users className="mr-2 h-4 w-4" />
                  View All Users
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/users/register">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Register New User
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/audit-logs/system">
                  <History className="mr-2 h-4 w-4" />
                  System Audit Logs
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Student View */}
        {!user.is_admin && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Information
              </CardTitle>
              <CardDescription>
                View your profile and certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-muted-foreground">Username:</span>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Wallet:</span>
                  <p className="font-mono text-xs">{user.wallet_address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
