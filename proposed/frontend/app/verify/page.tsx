"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { certificatesAPI } from "@/lib/api/certificates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CopyButton } from "@/components/common/CopyButton";
import { formatDate, formatCGPA, truncateHash } from "@/lib/utils/format";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const {
    data: certificate,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["verify", searchQuery],
    queryFn: () => certificatesAPI.verify(searchQuery),
    enabled: !!searchQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      router.push(`/verify?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Verify Certificate
          </h1>
          <p className="text-muted-foreground font-medium">
            Enter the certificate hash to verify authenticity
          </p>
        </div>

        {/* Search Form */}
        <Card className="border-2 mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter or Certificate Hash..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Public verification available 24/7. No login required.
            </p>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {isError && searchQuery && (
          <Card className="border-2 border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Certificate Not Found
                  </h3>
                  <p className="text-muted-foreground">
                    No certificate found matching "{truncateHash(searchQuery)}".
                    Please check the ID or hash and try again.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {!isLoading && !isError && certificate && (
          <div className="space-y-6">
            {/* Verification Status */}
            <Card
              className={`border-2 ${
                certificate.is_revoked ? "border-destructive" : "border-success"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center ${
                      certificate.is_revoked
                        ? "bg-destructive/10"
                        : "bg-success/10"
                    }`}
                  >
                    {certificate.is_revoked ? (
                      <XCircle className="h-8 w-8 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-2xl font-bold tracking-tight mb-1 ${
                        certificate.is_revoked
                          ? "text-destructive"
                          : "text-green-600"
                      }`}
                    >
                      {certificate.is_revoked
                        ? "Certificate Revoked"
                        : "Certificate Verified"}
                    </h3>
                    <p className="text-muted-foreground font-medium">
                      {certificate.is_revoked
                        ? "This certificate has been revoked and is no longer valid"
                        : "This certificate is authentic and verified on the blockchain"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">
                  Certificate Details
                </CardTitle>
                <CardDescription className="font-medium">
                  Blockchain-verified academic certificate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Information */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                    Student Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Student Name
                      </p>
                      <p className="font-semibold text-lg">
                        {certificate.student_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Student ID
                      </p>
                      <p className="font-mono font-semibold text-lg">
                        {certificate.student_id}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Academic Details */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                    Academic Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Degree
                      </p>
                      <p className="font-semibold">{certificate.degree}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Program
                      </p>
                      <p className="font-semibold">{certificate.program}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        CGPA
                      </p>
                      <p className="font-bold text-2xl text-foreground">
                        {formatCGPA(certificate.cgpa)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Issuance Date
                      </p>
                      <p className="font-semibold">
                        {formatDate(certificate.issuance_date)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Issuing Authority */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                    Issuing Authority
                  </h3>
                  <p className="font-semibold text-lg">
                    {certificate.issuing_authority}
                  </p>
                </div>

                <Separator />

                {/* Blockchain Information */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                    Blockchain Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Certificate Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-accent px-2 py-1 rounded border flex-1 overflow-hidden font-mono">
                          {truncateHash(certificate.cert_hash)}
                        </code>
                        <CopyButton
                          text={certificate.cert_hash}
                          label="Copy Hash"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Issuer
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-accent px-2 py-1 rounded border flex-1 overflow-hidden font-mono">
                          {certificate.issuer_name} ({certificate.issuer})
                        </code>
                        <CopyButton
                          text={certificate.issuer}
                          label="Copy Address"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Version
                      </p>
                      <p className="font-mono font-semibold">
                        v{certificate.version}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-4">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Verified on Blockchain
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
