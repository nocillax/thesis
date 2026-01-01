"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUsers } from "@/lib/hooks/useUsers";
import { UserFilters } from "@/components/users/UserFilters";
import { UserTable } from "@/components/users/UserTable";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { UserFilters as UserFiltersType } from "@/lib/api/users";
import { loadUserFilters, saveUserFilters } from "@/lib/utils/filterStorage";

const ITEMS_PER_PAGE = 20;

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const [page, setPage] = useState(1);

  // Initialize filters from localStorage
  const [filters, setFilters] = useState<UserFiltersType>(() => {
    if (typeof window !== "undefined" && user?.wallet_address) {
      return loadUserFilters(user.wallet_address) || {};
    }
    return {};
  });

  const { data, isLoading, isError, error } = useUsers(page, filters);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!authLoading && user && !user.is_admin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (user?.wallet_address) {
      saveUserFilters(filters, user.wallet_address);
    }
  }, [filters, user?.wallet_address]);

  const handleFiltersChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 when filters change
  };

  if (authLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user?.is_admin) {
    return null;
  }

  const users = data?.data || [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <UsersIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">
              User Management
            </h1>
            <p className="text-muted-foreground font-medium">
              Manage user accounts and permissions
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/users/register">
            <UserPlus className="mr-2 h-5 w-5" />
            Register User
          </Link>
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <ErrorMessage
          message={error?.message || "Failed to load users"}
          className="mb-6"
        />
      )}

      {/* Empty State */}
      {!isError && users.length === 0 && (
        <EmptyState
          icon={UsersIcon}
          title="No Users Found"
          description="There are no registered users in the system yet. Get started by registering your first user."
          action={
            <Button asChild size="lg">
              <Link href="/users/register">
                <UserPlus className="mr-2 h-5 w-5" />
                Register First User
              </Link>
            </Button>
          }
        />
      )}

      {/* User Table */}
      {!isError && users.length > 0 && (
        <>
          <UserTable
            data={users}
            filterComponent={
              <UserFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            }
          />

          {/* Pagination and Count */}
          <div className="mt-6 flex items-center justify-end">
            {/* Total Count */}
            {meta && (
              <div className="text-sm text-muted-foreground font-medium">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(page * ITEMS_PER_PAGE, meta.total_count)} (
                {meta.total_count} total)
              </div>
            )}

            {/* Pagination Controls */}
            {meta && meta.total_pages > 1 && (
              <div className="flex items-center gap-2">
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
          </div>
        </>
      )}
    </div>
  );
}
