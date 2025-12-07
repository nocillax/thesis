"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Loader2, FileText } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCertificates } from "@/lib/hooks/useCertificates";
import { CertificateFilters } from "@/components/certificates/CertificateFilters";
import { CertificateTable } from "@/components/certificates/CertificateTable";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { CertificateFilters as CertificateFiltersType } from "@/lib/api/certificates";
import {
  loadCertificateFilters,
  saveCertificateFilters,
} from "@/lib/utils/filterStorage";

export default function CertificatesPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initialize filters from localStorage
  const [filters, setFilters] = useState<CertificateFiltersType>(() => {
    if (typeof window !== "undefined" && user?.wallet_address) {
      return loadCertificateFilters(user.wallet_address) || {};
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
  } = useCertificates(filters);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (user?.wallet_address) {
      saveCertificateFilters(filters, user.wallet_address);
    }
  }, [filters, user?.wallet_address]);

  const handleFiltersChange = (newFilters: CertificateFiltersType) => {
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

  const allCertificates = data?.pages.flatMap((page) => page.data) || [];

  // Show loading only if we have no data yet
  if (isLoading && allCertificates.length === 0) {
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
          <h1 className="text-3xl font-bold mb-2">Certificates</h1>
          <p className="text-muted-foreground">
            {allCertificates.length > 0
              ? `Showing ${allCertificates.length} certificate(s)`
              : "No certificates found"}
          </p>
        </div>
        {user?.is_authorized && (
          <Button asChild>
            <Link href="/certificates/issue">
              <PlusCircle className="mr-2 h-4 w-4" />
              Issue Certificate
            </Link>
          </Button>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <ErrorMessage
          message={error?.message || "Failed to load certificates"}
          className="mb-6"
        />
      )}

      {/* Empty State */}
      {!isError && allCertificates.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No certificates found"
          description="There are no certificates in the system yet."
          action={
            user?.is_authorized ? (
              <Button asChild>
                <Link href="/certificates/issue">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Issue First Certificate
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Certificate Table */}
      {!isError && allCertificates.length > 0 && (
        <>
          <CertificateTable
            data={allCertificates}
            filterComponent={
              <CertificateFilters
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
