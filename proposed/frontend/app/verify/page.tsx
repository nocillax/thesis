"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Upload,
  X,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { certificatesAPI } from "@/lib/api/certificates";
import { verifierAPI } from "@/lib/api/verifiers";
import { useAuthStore } from "@/stores/authStore";
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
import {
  formatDate,
  formatCGPA,
  truncateHash,
  formatDateTime,
} from "@/lib/utils/format";
import {
  VerifierDialog,
  getStoredVerifierInfo,
  storeVerifierInfo,
} from "@/components/certificates/VerifierDialog";
import { extractQRFromFile } from "@/lib/utils/qr-scanner";
import { toast } from "sonner";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showVerifierDialog, setShowVerifierDialog] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<string | null>(
    null
  );
  const [isSubmittingVerifier, setIsSubmittingVerifier] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedHash, setExtractedHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: certificate,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["verify", searchQuery],
    queryFn: () => certificatesAPI.verify(searchQuery),
    enabled: !!searchQuery && !pendingVerification,
  });

  // Fetch revoke reason if certificate is revoked
  const { data: revokeReason } = useQuery({
    queryKey: ["revoke-reason", certificate?.cert_hash],
    queryFn: () => certificatesAPI.getRevokeReason(certificate!.cert_hash),
    enabled: !!certificate?.is_revoked,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsScanning(true);

    try {
      const extractedHash = await extractQRFromFile(file);

      if (!extractedHash) {
        toast.error(
          "No QR code found in the uploaded file. Please try again or enter the hash manually."
        );
        setUploadedFile(null);
        return;
      }

      // Validate hash format (should be 0x followed by 64 hex characters)
      if (!/^0x[a-fA-F0-9]{64}$/.test(extractedHash)) {
        toast.error("Invalid certificate hash found in QR code.");
        setUploadedFile(null);
        return;
      }

      toast.success("QR code scanned successfully!");
      setExtractedHash(extractedHash);
    } catch (error) {
      console.error("QR scanning error:", error);
      toast.error(
        "Failed to read QR code. Please try again or enter hash manually."
      );
      setUploadedFile(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExtractedHash(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVerifyUploadedFile = () => {
    if (extractedHash) {
      handleVerification(extractedHash);
    }
  };

  const handleVerification = async (hash: string) => {
    if (user) {
      setSearchQuery(hash);
      router.push(`/verify?q=${encodeURIComponent(hash)}`);
      return;
    }

    const storedInfo = getStoredVerifierInfo();
    if (storedInfo) {
      try {
        // Try to submit verifier info first
        await verifierAPI.submit({ ...storedInfo, cert_hash: hash });
        // Only proceed with verification if submission succeeds
        setSearchQuery(hash);
        router.push(`/verify?q=${encodeURIComponent(hash)}`);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to submit information";
        toast.error(errorMessage);

        // If blocked or rate limited, don't proceed with verification
        if (
          errorMessage.includes("blocked") ||
          errorMessage.includes("Rate limit")
        ) {
          return;
        }
        // For other errors, still allow verification but warn user
        toast.warning("Proceeding with verification but logging failed");
        setSearchQuery(hash);
        router.push(`/verify?q=${encodeURIComponent(hash)}`);
      }
    } else {
      setPendingVerification(hash);
      setShowVerifierDialog(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleVerification(query.trim());
    }
  };

  const handleVerifierSubmit = async (data: any) => {
    setIsSubmittingVerifier(true);
    try {
      const result = await verifierAPI.submit({
        ...data,
        cert_hash: pendingVerification!,
      });
      storeVerifierInfo(data);

      // Show remaining attempts if less than 3
      if (result.remaining_attempts < 3) {
        toast.warning(
          `Verification recorded. You have ${result.remaining_attempts} attempts remaining for this certificate.`
        );
      } else {
        toast.success("Information submitted successfully");
      }

      setShowVerifierDialog(false);
      setSearchQuery(pendingVerification!);
      router.push(`/verify?q=${encodeURIComponent(pendingVerification!)}`);
      setPendingVerification(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to submit information";
      toast.error(errorMessage);

      // If rate limited or blocked, close dialog and reset
      if (
        errorMessage.includes("blocked") ||
        errorMessage.includes("Rate limit")
      ) {
        setShowVerifierDialog(false);
        setPendingVerification(null);
      }
    } finally {
      setIsSubmittingVerifier(false);
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
            Authenticate certificates securely on the blockchain
          </p>
        </div>

        {/* Search Form */}
        <Card className="border-2 mb-8">
          <CardContent className="pt-2">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Hash input - only for logged-in users */}
              {user && (
                <>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-4">
                      Enter the certificate hash to verify
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter Certificate Hash..."
                        className="flex-1"
                        disabled={isLoading || isScanning}
                      />
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isLoading || isScanning || !query.trim()}
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* OR Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* File Upload Section */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-foreground mb-2">
                    Upload Certificate Document
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload the PDF or image certificate issued by this
                    institution. The system will automatically scan the QR code
                    embedded in the document for verification.
                  </p>
                </div>
                {uploadedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium truncate max-w-xs">
                          {uploadedFile.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        disabled={isScanning}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      className="w-full font-semibold"
                      onClick={handleVerifyUploadedFile}
                      disabled={isLoading || !extractedHash}
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Verify Certificate
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="certificate-upload"
                      disabled={isLoading || isScanning}
                    />
                    <label htmlFor="certificate-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full text-sm font-semibold"
                        disabled={isLoading || isScanning}
                        asChild
                      >
                        <span>
                          {isScanning ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload PDF or Image
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Supports PDF and image files (JPEG, PNG)
                    </p>
                  </div>
                )}
              </div>
            </form>
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">
                Public verification available 24/7 • Secured by GoQuorum
                Blockchain
              </p>
            </div>
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
              <CardContent className="">
                <div className="flex flex-col items-center text-center space-y-2">
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
                    <p className="text-sm text-muted-foreground font-medium mb-2">
                      {certificate.is_revoked
                        ? "This certificate has been revoked and is no longer valid"
                        : "This certificate is authentic and verified on the GoQuorum Blockchain"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revocation Information - Only show for revoked certificates */}
            {certificate.is_revoked && (
              <Card className="border-2 border-destructive">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Revocation Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!revokeReason ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-semibold">
                            Revoked By
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {revokeReason.revoked_by_name || "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-accent px-2 py-1 rounded border font-mono">
                              {truncateHash(revokeReason.revoked_by)}
                            </code>
                            <CopyButton
                              text={revokeReason.revoked_by}
                              showTooltip={false}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-semibold">
                            Revoked At
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatDateTime(revokeReason.revoked_at)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                          Revocation Reason
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 leading-relaxed">
                          {revokeReason.reason}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Certificate Details */}
            <Card>
              <CardHeader className="pb-1">
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
                  <div className="grid md:grid-cols-3 gap-6">
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
                      <p className="font-bold text-foreground">
                        {formatCGPA(certificate.cgpa)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Issuing Authority */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                    Issuance Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Issuing Authority
                      </p>
                      <p className="font-semibold">
                        {certificate.issuing_authority}
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
                      <p className="text-sm font-mono font-semibold">
                        v{certificate.version}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-4">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Verified on GoQuorum Blockchain
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Verifier Dialog */}
      <VerifierDialog
        open={showVerifierDialog}
        onSubmit={handleVerifierSubmit}
        isSubmitting={isSubmittingVerifier}
        onClose={() => {
          setShowVerifierDialog(false);
          setPendingVerification(null);
        }}
      />
    </div>
  );
}
