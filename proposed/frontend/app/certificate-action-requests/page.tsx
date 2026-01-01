"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileClock,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Play,
  Undo2,
  HandIcon,
  XCircle,
  Loader2,
  ContactRound,
  FileText,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  certificateActionRequestsAPI,
  CertificateActionRequest,
  RequestStatus,
} from "@/lib/api/certificate-action-requests";
import { certificatesAPI } from "@/lib/api/certificates";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CopyButton } from "@/components/common/CopyButton";
import { RequestStatusBadge } from "@/components/certificate-action-requests/RequestStatusBadge";
import { RequestActionBadge } from "@/components/certificate-action-requests/RequestActionBadge";
import { ExecuteRequestDialog } from "@/components/certificate-action-requests/ExecuteRequestDialog";
import { formatDateTime, truncateAddress } from "@/lib/utils/format";
import { toast } from "sonner";

type ParentTab = "all-requests" | "my-requests";
type AllRequestsTab =
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "all";
// For Admin: no pending tab (only requests they've taken)
type AdminMyRequestsTab = "processing" | "completed" | "rejected" | "all";
// For Staff: includes pending tab (their own created requests)
type StaffMyRequestsTab =
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "all";
type MyRequestsTab = AdminMyRequestsTab | StaffMyRequestsTab;

export default function CertificateActionRequestsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Tab states
  const [parentTab, setParentTab] = useState<ParentTab>(
    user?.is_admin ? "all-requests" : "my-requests"
  );
  const [allRequestsTab, setAllRequestsTab] =
    useState<AllRequestsTab>("pending");
  const [myRequestsTab, setMyRequestsTab] = useState<MyRequestsTab>(
    user?.is_admin ? "processing" : "pending"
  );

  // Sorting states
  const [sortBy, setSortBy] = useState<"id" | "time">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<CertificateActionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch all requests or my requests based on parent tab
  const { data: allRequestsData, isLoading: allRequestsLoading } = useQuery({
    queryKey: ["certificate-action-requests", allRequestsTab],
    queryFn: () =>
      certificateActionRequestsAPI.getAll(
        allRequestsTab === "all" ? undefined : allRequestsTab,
        1,
        100
      ),
    enabled: parentTab === "all-requests" && user?.is_admin,
  });

  const { data: myRequestsData, isLoading: myRequestsLoading } = useQuery({
    queryKey: ["my-certificate-action-requests", myRequestsTab],
    queryFn: () =>
      certificateActionRequestsAPI.getMyRequests(
        myRequestsTab === "all" ? undefined : myRequestsTab,
        1,
        100
      ),
    enabled: parentTab === "my-requests",
  });

  const isLoading =
    parentTab === "all-requests" ? allRequestsLoading : myRequestsLoading;
  const rawRequests =
    parentTab === "all-requests"
      ? allRequestsData?.data || []
      : myRequestsData?.data || [];

  // Sort requests
  const requests = [...rawRequests].sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "id") {
      return (a.id - b.id) * multiplier;
    } else {
      return (parseInt(a.requested_at) - parseInt(b.requested_at)) * multiplier;
    }
  });

  const toggleSort = (column: "id" | "time") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Mutations
  const takeMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) => certificateActionRequestsAPI.take(id))),
    onSuccess: () => {
      toast.success("Request(s) taken successfully");
      setSelectedIds([]);
      queryClient.invalidateQueries({
        queryKey: ["certificate-action-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-certificate-action-requests"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to take request(s)");
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) => certificateActionRequestsAPI.release(id))),
    onSuccess: () => {
      toast.success("Request(s) released successfully");
      setSelectedIds([]);
      queryClient.invalidateQueries({
        queryKey: ["certificate-action-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-certificate-action-requests"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to release request(s)"
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (ids: { id: number; reason: string }[]) =>
      Promise.all(
        ids.map(({ id, reason }) =>
          certificateActionRequestsAPI.reject(id, reason)
        )
      ),
    onSuccess: () => {
      toast.success("Request(s) rejected successfully");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
      setSelectedIds([]);
      queryClient.invalidateQueries({
        queryKey: ["certificate-action-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-certificate-action-requests"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject request");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) => certificateActionRequestsAPI.cancel(id))),
    onSuccess: () => {
      toast.success("Request(s) cancelled successfully");
      setSelectedIds([]);
      queryClient.invalidateQueries({
        queryKey: ["my-certificate-action-requests"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to cancel request(s)"
      );
    },
  });

  const [executingRequestId, setExecutingRequestId] = useState<number | null>(
    null
  );

  const handleExecute = async (
    certHash: string,
    action: string,
    reason: string,
    requestId: number
  ) => {
    setExecutingRequestId(requestId);
    try {
      // Execute blockchain action directly
      if (action === "revoke") {
        await certificatesAPI.revoke(certHash, reason);
      } else {
        await certificatesAPI.reactivate(certHash);
      }

      // Only mark as completed if blockchain action succeeded
      await certificateActionRequestsAPI.complete(requestId);

      toast.success(`Certificate ${action}d successfully`);
      setExecuteDialogOpen(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({
        queryKey: ["certificate-action-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-certificate-action-requests"],
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || `Failed to ${action} certificate`;
      toast.error(message);
      // Don't mark as completed if blockchain action failed
    } finally {
      setExecutingRequestId(null);
    }
  };

  // Handlers
  const handleTakeRequests = () => {
    if (selectedIds.length > 0) {
      takeMutation.mutate(selectedIds);
    }
  };

  const handleCancelRequests = () => {
    if (selectedIds.length > 0) {
      cancelMutation.mutate(selectedIds);
    }
  };

  const handleReleaseRequests = () => {
    if (selectedIds.length > 0) {
      releaseMutation.mutate(selectedIds);
    }
  };

  const handleBulkReject = () => {
    if (selectedIds.length > 0 && rejectionReason.trim()) {
      const rejectPayload = selectedIds.map((id) => ({
        id,
        reason: rejectionReason.trim(),
      }));
      rejectMutation.mutate(rejectPayload);
    }
  };

  const openExecuteDialog = (request: CertificateActionRequest) => {
    setSelectedRequest(request);
    setExecuteDialogOpen(true);
  };

  const openRejectDialog = () => {
    setRejectDialogOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isAnyOperationPending =
    takeMutation.isPending ||
    releaseMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending;

  // Show loading while checking user auth
  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const currentTab =
    parentTab === "all-requests" ? allRequestsTab : myRequestsTab;
  const showCheckboxes =
    (parentTab === "all-requests" &&
      allRequestsTab === "pending" &&
      user.is_admin) ||
    (parentTab === "my-requests" &&
      myRequestsTab === "pending" &&
      !user.is_admin) ||
    (parentTab === "my-requests" &&
      myRequestsTab === "processing" &&
      user.is_admin);

  return (
    <div className="container py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <FileClock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">
                Certificate Action Requests
              </h1>
              <p className="text-muted-foreground font-medium">
                Manage certificate revocation and reactivation workflow
              </p>
            </div>
          </div>
        </div>

        {/* Parent Tabs - Only show for Admin */}
        {user.is_admin ? (
          <Tabs
            value={parentTab}
            onValueChange={(v) => {
              setParentTab(v as ParentTab);
              setSelectedIds([]);
            }}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all-requests">All Requests</TabsTrigger>
              <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            </TabsList>

            {/* All Requests Tab */}
            <TabsContent value="all-requests">
              <Tabs
                value={allRequestsTab}
                onValueChange={(v) => {
                  setAllRequestsTab(v as AllRequestsTab);
                  setSelectedIds([]);
                }}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value={allRequestsTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {allRequestsTab === "all"
                          ? "All"
                          : allRequestsTab.charAt(0).toUpperCase() +
                            allRequestsTab.slice(1)}{" "}
                        Requests
                      </CardTitle>
                      <CardDescription>
                        {allRequestsTab === "pending"
                          ? "New requests awaiting admin action"
                          : allRequestsTab === "processing"
                          ? "Requests currently being processed"
                          : allRequestsTab === "completed"
                          ? "Successfully completed requests"
                          : allRequestsTab === "rejected"
                          ? "Rejected requests"
                          : "All action requests"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 relative">
                      {/* Loading Overlay */}
                      {isAnyOperationPending && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium">Processing...</p>
                          </div>
                        </div>
                      )}

                      {/* Toolbar for PENDING tab */}
                      {allRequestsTab === "pending" && (
                        <div className="flex items-center justify-between gap-2 p-4 border rounded-lg bg-accent/50">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTakeRequests}
                                    disabled={
                                      selectedIds.length === 0 ||
                                      isAnyOperationPending
                                    }
                                  >
                                    <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-1">
                                      <HandIcon className="h-3 w-3 text-yellow-700 dark:text-yellow-300" />
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Take Request</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {selectedIds.length > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                {selectedIds.length} of {requests.length}{" "}
                                selected
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {isLoading ? (
                        <LoadingSpinner />
                      ) : requests.length === 0 ? (
                        <div className="text-center py-12">
                          <FileClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No {allRequestsTab === "all" ? "" : allRequestsTab}{" "}
                            requests found
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {showCheckboxes && (
                                  <TableHead className="w-12">
                                    <Checkbox
                                      checked={
                                        selectedIds.length ===
                                          requests.length && requests.length > 0
                                      }
                                      onCheckedChange={toggleSelectAll}
                                    />
                                  </TableHead>
                                )}
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleSort("id")}
                                    className="flex items-center gap-1 -ml-4 text-primary font-semibold"
                                  >
                                    ID
                                    {sortBy === "id" ? (
                                      sortOrder === "asc" ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )
                                    ) : (
                                      <ChevronsUpDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Student
                                  </span>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Certificate
                                  </span>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Action
                                  </span>
                                </TableHead>
                                <TableHead>
                                  <span className="text-primary font-semibold">
                                    Reason
                                  </span>
                                </TableHead>
                                <TableHead>
                                  <span className="text-primary font-semibold">
                                    Requested By
                                  </span>
                                </TableHead>
                                {(allRequestsTab === "pending" ||
                                  allRequestsTab === "completed" ||
                                  allRequestsTab === "rejected" ||
                                  allRequestsTab === "all") && (
                                  <TableHead>
                                    <span className="text-primary font-semibold">
                                      Taken By
                                    </span>
                                  </TableHead>
                                )}
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleSort("time")}
                                    className="flex items-center gap-1 -ml-4 text-primary font-semibold"
                                  >
                                    Time
                                    {sortBy === "time" ? (
                                      sortOrder === "asc" ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )
                                    ) : (
                                      <ChevronsUpDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Status
                                  </span>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {requests.map(
                                (request: CertificateActionRequest) => (
                                  <TableRow key={request.id}>
                                    {showCheckboxes && (
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedIds.includes(
                                            request.id
                                          )}
                                          onCheckedChange={() =>
                                            toggleSelectOne(request.id)
                                          }
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell className="font-mono text-xs">
                                      #{request.id}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Link
                                              href={`/certificates/student/${request.student_id}`}
                                              className="inline-block"
                                            >
                                              <ContactRound className="h-4 w-4 text-primary hover:text-primary/80" />
                                            </Link>
                                          </TooltipTrigger>
                                          <TooltipContent align="start">
                                            View Student
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Link
                                              href={`/certificates/${request.cert_hash}`}
                                              className="inline-block"
                                            >
                                              <FileText className="h-4 w-4 text-primary hover:text-primary/80" />
                                            </Link>
                                          </TooltipTrigger>
                                          <TooltipContent align="start">
                                            View Certificate
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <RequestActionBadge
                                        action={request.action_type}
                                      />
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <p className="text-sm truncate cursor-help">
                                              {request.reason}
                                            </p>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            className="max-w-sm"
                                            align="start"
                                          >
                                            <p className="text-xs">
                                              {request.reason}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <code className="text-xs bg-accent px-2 py-1 rounded border">
                                          {truncateAddress(
                                            request.requested_by_wallet_address
                                          )}
                                        </code>
                                        <CopyButton
                                          text={
                                            request.requested_by_wallet_address
                                          }
                                          showTooltip={false}
                                        />
                                      </div>
                                    </TableCell>
                                    {(allRequestsTab === "pending" ||
                                      allRequestsTab === "completed" ||
                                      allRequestsTab === "rejected" ||
                                      allRequestsTab === "all") && (
                                      <TableCell>
                                        {request.taken_by_wallet_address ? (
                                          <div className="flex items-center gap-1">
                                            <code className="text-xs bg-accent px-2 py-1 rounded border">
                                              {truncateAddress(
                                                request.taken_by_wallet_address
                                              )}
                                            </code>
                                            <CopyButton
                                              text={
                                                request.taken_by_wallet_address
                                              }
                                              showTooltip={false}
                                            />
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            —
                                          </span>
                                        )}
                                      </TableCell>
                                    )}
                                    <TableCell className="text-xs">
                                      {formatDateTime(request.requested_at)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <RequestStatusBadge
                                          status={request.status}
                                        />
                                        {request.status === "rejected" &&
                                          request.rejection_reason && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  className="max-w-sm"
                                                  align="start"
                                                >
                                                  <p className="text-xs font-semibold mb-1">
                                                    Rejection Reason:
                                                  </p>
                                                  <p className="text-xs">
                                                    {request.rejection_reason}
                                                  </p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* My Requests Tab */}
            <TabsContent value="my-requests">
              <Tabs
                value={myRequestsTab}
                onValueChange={(v) => {
                  setMyRequestsTab(v as MyRequestsTab);
                  setSelectedIds([]);
                }}
                className="space-y-6"
              >
                {/* Admin: 4 tabs (Processing, Completed, Rejected, All) */}
                {/* Staff: 5 tabs (Pending, Processing, Completed, Rejected, All) */}
                <TabsList
                  className={`grid w-full ${
                    user.is_admin ? "grid-cols-4" : "grid-cols-5"
                  }`}
                >
                  {!user.is_admin && (
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                  )}
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value={myRequestsTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        My{" "}
                        {myRequestsTab === "all"
                          ? ""
                          : myRequestsTab.charAt(0).toUpperCase() +
                            myRequestsTab.slice(1)}{" "}
                        Requests
                      </CardTitle>
                      <CardDescription>
                        {user.is_admin
                          ? myRequestsTab === "processing"
                            ? "Requests you are currently working on"
                            : myRequestsTab === "completed"
                            ? "Requests you have completed"
                            : myRequestsTab === "rejected"
                            ? "Requests you have rejected"
                            : "All your requests"
                          : myRequestsTab === "pending"
                          ? "Your pending requests awaiting admin action"
                          : myRequestsTab === "processing"
                          ? "Your requests currently being processed by admins"
                          : myRequestsTab === "completed"
                          ? "Your completed requests"
                          : myRequestsTab === "rejected"
                          ? "Your rejected requests"
                          : "All your requests"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 relative">
                      {/* Loading Overlay */}
                      {isAnyOperationPending && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium">Processing...</p>
                          </div>
                        </div>
                      )}

                      {/* Toolbar for Staff PENDING tab - Cancel button */}
                      {!user.is_admin && myRequestsTab === "pending" && (
                        <div className="flex items-center justify-between gap-2 p-4 border rounded-lg bg-accent/50">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelRequests}
                                    disabled={
                                      selectedIds.length === 0 ||
                                      isAnyOperationPending
                                    }
                                  >
                                    <div className="rounded-full bg-red-100 dark:bg-red-900 p-1">
                                      <XCircle className="h-3 w-3 text-red-700 dark:text-red-300" />
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancel Request</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {selectedIds.length > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                {selectedIds.length} of {requests.length}{" "}
                                selected
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Toolbar for Admin PROCESSING tab */}
                      {user.is_admin && myRequestsTab === "processing" && (
                        <div className="flex items-center justify-between gap-2 p-4 border rounded-lg bg-accent/50">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReleaseRequests}
                                    disabled={
                                      selectedIds.length === 0 ||
                                      isAnyOperationPending
                                    }
                                  >
                                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-1">
                                      <Undo2 className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Release Request</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={openRejectDialog}
                                    disabled={
                                      selectedIds.length === 0 ||
                                      isAnyOperationPending
                                    }
                                  >
                                    <div className="rounded-full bg-red-100 dark:bg-red-900 p-1">
                                      <XCircle className="h-3 w-3 text-red-700 dark:text-red-300" />
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reject Request</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {selectedIds.length > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                {selectedIds.length} of {requests.length}{" "}
                                selected
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {isLoading ? (
                        <LoadingSpinner />
                      ) : requests.length === 0 ? (
                        <div className="text-center py-12">
                          <FileClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No {myRequestsTab === "all" ? "" : myRequestsTab}{" "}
                            requests found
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {/* Show checkbox for: Staff Pending OR Admin Processing */}
                                {((myRequestsTab === "pending" &&
                                  !user.is_admin) ||
                                  (myRequestsTab === "processing" &&
                                    user.is_admin)) && (
                                  <TableHead className="w-12">
                                    <Checkbox
                                      checked={
                                        selectedIds.length ===
                                          requests.length && requests.length > 0
                                      }
                                      onCheckedChange={toggleSelectAll}
                                    />
                                  </TableHead>
                                )}
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleSort("id")}
                                    className="flex items-center gap-1 -ml-4 text-primary font-semibold"
                                  >
                                    ID
                                    {sortBy === "id" ? (
                                      sortOrder === "asc" ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )
                                    ) : (
                                      <ChevronsUpDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Student
                                  </span>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Certificate
                                  </span>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Action
                                  </span>
                                </TableHead>
                                <TableHead>
                                  <span className="text-primary font-semibold">
                                    Reason
                                  </span>
                                </TableHead>
                                <TableHead>
                                  <span className="text-primary font-semibold">
                                    Requested By
                                  </span>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleSort("time")}
                                    className="flex items-center gap-1 -ml-4 text-primary font-semibold"
                                  >
                                    Time
                                    {sortBy === "time" ? (
                                      sortOrder === "asc" ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )
                                    ) : (
                                      <ChevronsUpDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <span className="text-primary font-semibold">
                                    Status
                                  </span>
                                </TableHead>
                                {/* Actions column only for Admin Processing tab */}
                                {user.is_admin &&
                                  myRequestsTab === "processing" && (
                                    <TableHead className="text-center">
                                      <span className="text-primary font-semibold">
                                        Actions
                                      </span>
                                    </TableHead>
                                  )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {requests.map(
                                (request: CertificateActionRequest) => (
                                  <TableRow key={request.id}>
                                    {/* Show checkbox for: Staff Pending OR Admin Processing */}
                                    {((myRequestsTab === "pending" &&
                                      !user.is_admin) ||
                                      (myRequestsTab === "processing" &&
                                        user.is_admin)) && (
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedIds.includes(
                                            request.id
                                          )}
                                          onCheckedChange={() =>
                                            toggleSelectOne(request.id)
                                          }
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell className="font-mono text-xs">
                                      #{request.id}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Link
                                              href={`/certificates/student/${request.student_id}`}
                                              className="inline-block"
                                            >
                                              <ContactRound className="h-4 w-4 text-primary hover:text-primary/80" />
                                            </Link>
                                          </TooltipTrigger>
                                          <TooltipContent align="start">
                                            View Student
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Link
                                              href={`/certificates/${request.cert_hash}`}
                                              className="inline-block"
                                            >
                                              <FileText className="h-4 w-4 text-primary hover:text-primary/80" />
                                            </Link>
                                          </TooltipTrigger>
                                          <TooltipContent align="start">
                                            View Certificate
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                      <RequestActionBadge
                                        action={request.action_type}
                                      />
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <p className="text-sm truncate cursor-help">
                                              {request.reason}
                                            </p>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            className="max-w-sm"
                                            align="start"
                                          >
                                            <p className="text-xs">
                                              {request.reason}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <code className="text-xs bg-accent px-2 py-1 rounded border">
                                          {truncateAddress(
                                            request.requested_by_wallet_address
                                          )}
                                        </code>
                                        <CopyButton
                                          text={
                                            request.requested_by_wallet_address
                                          }
                                          showTooltip={false}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      {formatDateTime(request.requested_at)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <RequestStatusBadge
                                          status={request.status}
                                        />
                                        {request.status === "rejected" &&
                                          request.rejection_reason && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  className="max-w-sm"
                                                  align="start"
                                                >
                                                  <p className="text-xs font-semibold mb-1">
                                                    Rejection Reason:
                                                  </p>
                                                  <p className="text-xs">
                                                    {request.rejection_reason}
                                                  </p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                      </div>
                                    </TableCell>
                                    {/* Actions column only for Admin Processing tab */}
                                    {user.is_admin &&
                                      myRequestsTab === "processing" && (
                                        <TableCell>
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              openExecuteDialog(request)
                                            }
                                            disabled={
                                              executingRequestId === request.id
                                            }
                                          >
                                            <Play className="mr-1 h-3 w-3" />
                                            Execute
                                          </Button>
                                        </TableCell>
                                      )}
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        ) : (
          // Staff view - Direct My Requests without parent tabs
          <Tabs
            value={myRequestsTab}
            onValueChange={(v) => {
              setMyRequestsTab(v as MyRequestsTab);
              setSelectedIds([]);
            }}
            className="space-y-6"
          >
            {/* Staff: 5 tabs (Pending, Processing, Completed, Rejected, All) */}
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={myRequestsTab}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    My{" "}
                    {myRequestsTab === "all"
                      ? ""
                      : myRequestsTab.charAt(0).toUpperCase() +
                        myRequestsTab.slice(1)}{" "}
                    Requests
                  </CardTitle>
                  <CardDescription>
                    {myRequestsTab === "pending"
                      ? "Your pending requests awaiting admin action"
                      : myRequestsTab === "processing"
                      ? "Your requests currently being processed by admins"
                      : myRequestsTab === "completed"
                      ? "Your completed requests"
                      : myRequestsTab === "rejected"
                      ? "Your rejected requests"
                      : "All your requests"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myRequestsLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : !requests || requests.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No requests found
                    </div>
                  ) : (
                    <>
                      {/* Toolbar for Staff PENDING tab - Cancel button */}
                      {myRequestsTab === "pending" && (
                        <div className="flex items-center justify-between gap-2 p-4 border rounded-lg bg-accent/50 mb-4">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelRequests}
                                    disabled={
                                      selectedIds.length === 0 ||
                                      isAnyOperationPending
                                    }
                                  >
                                    <div className="rounded-full bg-red-100 dark:bg-red-900 p-1">
                                      <XCircle className="h-3 w-3 text-red-700 dark:text-red-300" />
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancel Request</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="text-sm text-muted-foreground">
                              {selectedIds.length === 0
                                ? "Select requests to cancel"
                                : `${selectedIds.length} request(s) selected`}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {/* Show checkbox for Staff Pending */}
                              {myRequestsTab === "pending" && (
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={
                                      selectedIds.length === requests.length &&
                                      requests.length > 0
                                    }
                                    onCheckedChange={toggleSelectAll}
                                  />
                                </TableHead>
                              )}
                              <TableHead>
                                <Button
                                  variant="ghost"
                                  onClick={() => toggleSort("id")}
                                  className="flex items-center gap-1 -ml-4 text-primary font-semibold"
                                >
                                  ID
                                  {sortBy === "id" ? (
                                    sortOrder === "asc" ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )
                                  ) : (
                                    <ChevronsUpDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="text-primary font-semibold">
                                  Student
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="text-primary font-semibold">
                                  Certificate
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="text-primary font-semibold">
                                  Action
                                </span>
                              </TableHead>
                              <TableHead>
                                <span className="text-primary font-semibold">
                                  Reason
                                </span>
                              </TableHead>
                              <TableHead>
                                <span className="text-primary font-semibold">
                                  Taken By
                                </span>
                              </TableHead>
                              <TableHead>
                                <Button
                                  variant="ghost"
                                  onClick={() => toggleSort("time")}
                                  className="flex items-center gap-1 -ml-4 text-primary font-semibold"
                                >
                                  Time
                                  {sortBy === "time" ? (
                                    sortOrder === "asc" ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )
                                  ) : (
                                    <ChevronsUpDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="text-primary font-semibold">
                                  Status
                                </span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {requests.map(
                              (request: CertificateActionRequest) => (
                                <TableRow key={request.id}>
                                  {/* Show checkbox for Staff Pending */}
                                  {myRequestsTab === "pending" && (
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedIds.includes(
                                          request.id
                                        )}
                                        onCheckedChange={() =>
                                          toggleSelectOne(request.id)
                                        }
                                      />
                                    </TableCell>
                                  )}
                                  <TableCell className="font-mono text-xs">
                                    #{request.id}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Link
                                            href={`/certificates/student/${request.student_id}`}
                                            className="inline-block"
                                          >
                                            <ContactRound className="h-4 w-4 text-primary hover:text-primary/80" />
                                          </Link>
                                        </TooltipTrigger>
                                        <TooltipContent align="start">
                                          View Student
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Link
                                            href={`/certificates/${request.cert_hash}`}
                                            className="inline-block"
                                          >
                                            <FileText className="h-4 w-4 text-primary hover:text-primary/80" />
                                          </Link>
                                        </TooltipTrigger>
                                        <TooltipContent align="start">
                                          View Certificate
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  <TableCell>
                                    <RequestActionBadge
                                      action={request.action_type}
                                    />
                                  </TableCell>
                                  <TableCell className="max-w-[200px]">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <p className="text-sm truncate cursor-help">
                                            {request.reason}
                                          </p>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="max-w-sm"
                                          align="start"
                                        >
                                          <p className="text-xs">
                                            {request.reason}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-mono">
                                        {truncateAddress(
                                          request.requested_by_wallet_address
                                        )}
                                      </span>
                                      <CopyButton
                                        text={
                                          request.requested_by_wallet_address
                                        }
                                        showTooltip={false}
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {request.taken_by_wallet_address ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-mono">
                                          {truncateAddress(
                                            request.taken_by_wallet_address
                                          )}
                                        </span>
                                        <CopyButton
                                          text={request.taken_by_wallet_address}
                                          showTooltip={false}
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {formatDateTime(request.requested_at)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <RequestStatusBadge
                                        status={request.status}
                                      />
                                      {request.status === "rejected" &&
                                        request.rejection_reason && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent
                                                className="max-w-sm"
                                                align="start"
                                              >
                                                <p className="text-xs font-semibold mb-1">
                                                  Rejection Reason:
                                                </p>
                                                <p className="text-xs">
                                                  {request.rejection_reason}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Execute Dialog */}
      <ExecuteRequestDialog
        open={executeDialogOpen}
        onOpenChange={setExecuteDialogOpen}
        request={selectedRequest}
        onExecute={handleExecute}
        isExecuting={executingRequestId !== null}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reject Request{selectedIds.length > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting{" "}
              {selectedIds.length > 1
                ? `these ${selectedIds.length} requests`
                : "this request"}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <span className="text-xs text-muted-foreground">
                  {rejectionReason.length}/500
                </span>
              </div>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Insufficient justification, request not approved by supervisor..."
                value={rejectionReason}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setRejectionReason(e.target.value);
                  }
                }}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
