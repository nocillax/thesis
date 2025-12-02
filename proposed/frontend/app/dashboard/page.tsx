"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Users,
  PlusCircle,
  Shield,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Certificates
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              View all certificates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Certificates
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">-</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

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
