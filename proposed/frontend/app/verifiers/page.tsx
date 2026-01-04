"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  verifierAPI,
  type VerificationLog,
  type BlockedVerifier,
} from "@/lib/api/verifiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CopyButton } from "@/components/common/CopyButton";
import {
  formatDateTime,
  formatIpAddress,
  truncateHash,
} from "@/lib/utils/format";
import { toast } from "sonner";

export default function VerifierManagementPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const queryClient = useQueryClient();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedIp, setSelectedIp] = useState("");
  const [blockDuration, setBlockDuration] = useState("60");
  const [blockReason, setBlockReason] = useState("");
  const [logsPage, setLogsPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.is_admin)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["verifier-logs", logsPage, sortOrder],
    queryFn: () => verifierAPI.getLogs(logsPage, 10, "verified_at", sortOrder),
    enabled: !!user?.is_admin,
  });

  const { data: blockedList, isLoading: blockedLoading } = useQuery({
    queryKey: ["blocked-verifiers"],
    queryFn: () => verifierAPI.getBlocked(),
    enabled: !!user?.is_admin,
  });

  const blockMutation = useMutation({
    mutationFn: (data: { ip: string; duration: number; reason: string }) =>
      verifierAPI.block(data.ip, data.duration, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-verifiers"] });
      toast.success("IP address blocked successfully");
      setBlockDialogOpen(false);
      setSelectedIp("");
      setBlockDuration("60");
      setBlockReason("");
    },
    onError: () => {
      toast.error("Failed to block IP address");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (ip: string) => verifierAPI.unblock(ip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-verifiers"] });
      toast.success("IP address unblocked successfully");
    },
    onError: () => {
      toast.error("Failed to unblock IP address");
    },
  });

  const handleBlock = () => {
    if (!selectedIp || !blockReason) {
      toast.error("Please fill all fields");
      return;
    }
    blockMutation.mutate({
      ip: selectedIp,
      duration: parseInt(blockDuration),
      reason: blockReason,
    });
  };

  if (authLoading || !user?.is_admin) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Verifier Management
            </h1>
            <p className="text-muted-foreground font-medium">
              Monitor and manage certificate verifiers
            </p>
          </div>
        </div>
      </div>

      {/* Blocked Verifiers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Blocked IP Addresses</CardTitle>
          <CardDescription>Currently blocked verifiers</CardDescription>
        </CardHeader>
        <CardContent>
          {blockedLoading ? (
            <LoadingSpinner />
          ) : blockedList && blockedList.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary font-semibold uppercase">
                      IP Address
                    </TableHead>
                    <TableHead className="text-primary font-semibold uppercase">
                      Reason
                    </TableHead>
                    <TableHead className="text-primary font-semibold uppercase">
                      Blocked Until
                    </TableHead>
                    <TableHead className="text-primary font-semibold uppercase text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedList.map((blocked: BlockedVerifier) => (
                    <TableRow key={blocked.id}>
                      <TableCell className="font-mono text-sm font-semibold">
                        {formatIpAddress(blocked.ip_address)}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm truncate cursor-help">
                                {blocked.reason}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm" align="start">
                              <p className="text-xs">{blocked.reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(blocked.blocked_until)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            unblockMutation.mutate(blocked.ip_address)
                          }
                          disabled={unblockMutation.isPending}
                        >
                          {unblockMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No blocked IP addresses
            </p>
          )}
        </CardContent>
      </Card>

      {/* Verification Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Logs</CardTitle>
          <CardDescription>Recent certificate verifications</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <LoadingSpinner />
          ) : logsData && logsData.data.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary font-semibold uppercase">
                        Verifier
                      </TableHead>
                      <TableHead className="text-primary font-semibold uppercase">
                        Institution
                      </TableHead>
                      <TableHead className="text-primary font-semibold uppercase">
                        IP Address
                      </TableHead>
                      <TableHead className="text-primary font-semibold uppercase">
                        Certificate Hash
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSortOrder(sortOrder === "DESC" ? "ASC" : "DESC");
                            setLogsPage(1);
                          }}
                          className="flex items-center gap-1 -ml-4 text-primary font-semibold uppercase"
                        >
                          Time
                          {sortOrder === "DESC" ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-primary font-semibold uppercase text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.data.map((log: VerificationLog) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.verifier.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.verifier.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.verifier.institution}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          {formatIpAddress(log.ip_address)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs font-mono bg-accent px-2 py-1 rounded border">
                              {truncateHash(log.cert_hash)}
                            </code>
                            <CopyButton text={log.cert_hash} />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(log.verified_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog
                            open={
                              blockDialogOpen && selectedIp === log.ip_address
                            }
                            onOpenChange={(open) => {
                              setBlockDialogOpen(open);
                              if (!open) setSelectedIp("");
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedIp(log.ip_address)}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Block
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Block IP Address</DialogTitle>
                                <DialogDescription>
                                  Block {log.ip_address} from verifying
                                  certificates
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    value={blockDuration}
                                    onChange={(e) =>
                                      setBlockDuration(e.target.value)
                                    }
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <Label>Reason</Label>
                                  <Input
                                    value={blockReason}
                                    onChange={(e) =>
                                      setBlockReason(e.target.value)
                                    }
                                    placeholder="e.g., Suspicious activity"
                                  />
                                </div>
                                <Button
                                  onClick={handleBlock}
                                  disabled={blockMutation.isPending}
                                  className="w-full"
                                >
                                  {blockMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Blocking...
                                    </>
                                  ) : (
                                    "Confirm Block"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {logsData.meta && logsData.meta.total_pages > 1 && (
                <div className="flex items-center justify-end gap-8 mt-6">
                  {/* Total Count */}
                  <div className="text-sm text-muted-foreground font-medium">
                    Showing {(logsPage - 1) * 10 + 1} to{" "}
                    {Math.min(logsPage * 10, logsData.meta.total_count)} of{" "}
                    {logsData.meta.total_count} logs
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setLogsPage(logsPage - 1)}
                      disabled={logsPage === 1}
                    >
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground font-medium px-4">
                      Page {logsPage} of {logsData.meta.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setLogsPage(logsPage + 1)}
                      disabled={!logsData.meta.has_more}
                    >
                      Next
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No verification logs found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
