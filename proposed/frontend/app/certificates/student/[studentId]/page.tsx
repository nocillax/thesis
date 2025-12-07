"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { certificatesAPI } from "@/lib/api/certificates";
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
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatCGPA } from "@/lib/utils/format";

export default function StudentVersionsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();

  const {
    data: certificates,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student-versions", studentId],
    queryFn: () => certificatesAPI.getAllVersions(studentId),
  });

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-8">
        <ErrorMessage
          message={error?.message || "Failed to load certificate versions"}
        />
        <Button onClick={() => router.push("/certificates")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Certificates
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
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">
              Certificate Versions
            </h1>

            <p className="text-muted-foreground font-bold">{studentId}</p>
          </div>
        </div>

        <Button variant="ghost" onClick={() => router.back()} size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
      </div>

      {/* Empty State */}
      {certificates && certificates.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No Certificates Found"
          description={`No certificates found for student ID ${studentId}`}
        />
      )}

      {/* Certificate Versions Timeline */}
      {certificates && certificates.length > 0 && (
        <div className="space-y-4">
          {/* Active Certificate */}
          {certificates
            .filter((cert) => !cert.is_revoked)
            .map((cert) => (
              <Card key={cert.cert_hash} className="border-2 border-success">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl font-bold">
                          {cert.student_name}
                        </CardTitle>
                        <StatusBadge isActive={!cert.is_revoked} />
                      </div>
                      <CardDescription className="font-medium">
                        {cert.degree} • {cert.program}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Version
                      </p>
                      <p className="text-2xl font-bold font-mono text-green-600">
                        v{cert.version}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        CGPA
                      </p>
                      <p className="font-bold text-lg">
                        {formatCGPA(cert.cgpa)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Issued
                      </p>
                      <p className="font-semibold">
                        {formatDate(cert.issuance_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Authority
                      </p>
                      <p className="font-semibold">{cert.issuing_authority}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Issuer
                      </p>
                      <p className="font-semibold">{cert.issuer_name}</p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full font-semibold"
                  >
                    <Link href={`/certificates/${cert.cert_hash}`}>
                      View Certificate Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}

          {/* Revoked Certificates */}
          {certificates.filter((cert) => cert.is_revoked).length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-4">
                <div className="h-px flex-1 bg-border" />
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                  Revoked Versions
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>

              {certificates
                .filter((cert) => cert.is_revoked)
                .map((cert) => (
                  <Card
                    key={cert.cert_hash}
                    className="border-destructive/50 opacity-75"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-2xl font-bold">
                              {cert.student_name}
                            </CardTitle>
                            <StatusBadge isActive={!cert.is_revoked} />
                          </div>
                          <CardDescription className="font-medium">
                            {cert.degree} • {cert.program}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Version
                          </p>
                          <p className="text-2xl font-bold font-mono text-destructive">
                            v{cert.version}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            CGPA
                          </p>
                          <p className="font-bold text-lg">
                            {formatCGPA(cert.cgpa)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Issued
                          </p>
                          <p className="font-semibold">
                            {formatDate(cert.issuance_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Authority
                          </p>
                          <p className="font-semibold">
                            {cert.issuing_authority}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Issuer
                          </p>
                          <p className="font-semibold">{cert.issuer_name}</p>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="w-full font-semibold"
                      >
                        <Link href={`/certificates/${cert.cert_hash}`}>
                          View Certificate Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </>
          )}
        </div>
      )}

      {/* Summary */}
      {certificates && certificates.length > 0 && (
        <Card className="mt-8 bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{certificates.length}</p>
                <p className="text-sm text-muted-foreground font-medium">
                  Total Versions
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {certificates.filter((c) => !c.is_revoked).length}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Active
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">
                  {certificates.filter((c) => c.is_revoked).length}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Revoked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
