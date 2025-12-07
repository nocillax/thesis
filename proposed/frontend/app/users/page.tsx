"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2, Users as UsersIcon } from "lucide-react";
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

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initialize filters from localStorage
  const [filters, setFilters] = useState<UserFiltersType>(() => {
    if (typeof window !== "undefined" && user?.wallet_address) {
      return loadUserFilters(user.wallet_address) || {};
    }
    return {};
  });

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUsers(filters);

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
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const allUsers = data?.pages.flatMap((page) => page.data) || [];

  // Show loading only if we have no data yet
  if (isLoading && allUsers.length === 0) {
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
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            {allUsers.length > 0
              ? `Showing ${allUsers.length} user(s)`
              : "No users found"}
          </p>
        </div>
        <Button asChild>
          <Link href="/users/register">
            <UserPlus className="mr-2 h-4 w-4" />
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
      {!isError && allUsers.length === 0 && (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="There are no registered users in the system yet."
          action={
            <Button asChild>
              <Link href="/users/register">
                <UserPlus className="mr-2 h-4 w-4" />
                Register First User
              </Link>
            </Button>
          }
        />
      )}

      {/* User Table */}
      {!isError && allUsers.length > 0 && (
        <>
          <UserTable
            data={allUsers}
            filterComponent={
              <UserFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            }
          />

          {/* Load More Trigger & Button */}
          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more...</span>
              </div>
            )}

            {!isFetchingNextPage && hasNextPage && (
              <Button variant="outline" onClick={() => fetchNextPage()}>
                Load More
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
