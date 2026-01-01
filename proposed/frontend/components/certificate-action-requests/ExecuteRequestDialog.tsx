"use client";

import { useState, useEffect } from "react";
import { Ban, RefreshCw, Play, FileText } from "lucide-react";
import { CertificateActionRequest } from "@/lib/api/certificate-action-requests";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CopyButton } from "@/components/common/CopyButton";
import { truncateHash } from "@/lib/utils/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExecuteRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CertificateActionRequest | null;
  onExecute: (
    certHash: string,
    action: string,
    reason: string,
    requestId: number
  ) => void;
  isExecuting: boolean;
}

export function ExecuteRequestDialog({
  open,
  onOpenChange,
  request,
  onExecute,
  isExecuting,
}: ExecuteRequestDialogProps) {
  const [reason, setReason] = useState("");

  // Initialize reason when request changes
  useEffect(() => {
    if (request) {
      setReason(request.reason);
    }
  }, [request]);

  const handleExecute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!request) return;
    onExecute(request.cert_hash, request.action_type, reason, request.id);
  };

  if (!request) return null;

  const isRevoke = request.action_type === "revoke";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[550px]"
        onInteractOutside={(e) => isExecuting && e.preventDefault()}
      >
        {isExecuting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <LoadingSpinner size="lg" />
          </div>
        )}
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-bold">
            Execute Request
          </DialogTitle>
          <DialogDescription className="font-medium">
            Review and execute this {request.action_type} action on the
            blockchain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Action
              </Label>
              <div className="flex items-center gap-2">
                {isRevoke ? (
                  <Ban className="h-4 w-4 text-red-600" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                )}
                <span className="font-semibold">
                  {isRevoke ? "Revoke" : "Reactivate"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Request ID
              </Label>
              <div className="font-mono font-semibold">#{request.id}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Certificate Hash
            </Label>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-accent px-2 py-1 rounded border font-mono">
                {truncateHash(request.cert_hash)}
              </code>
              <CopyButton
                text={request.cert_hash}
                label="Copy Hash"
                showTooltip={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Requested By
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {request.requested_by_name}
              </span>
              <code className="text-xs bg-accent px-2 py-1 rounded border font-mono">
                {truncateHash(request.requested_by_wallet_address)}
              </code>
              <CopyButton
                text={request.requested_by_wallet_address}
                label="Copy Address"
                showTooltip={false}
              />
            </div>
          </div>

          {isRevoke && (
            <div className="space-y-2">
              <Label
                htmlFor="execute-reason"
                className="text-xs font-bold uppercase tracking-wide"
              >
                Revoke Reason *
              </Label>
              <p className="text-xs text-muted-foreground font-medium">
                You can modify the reason if needed
              </p>
              <Textarea
                id="execute-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="e.g., Certificate contains fraudulent information"
                disabled={isExecuting}
                className="resize-none font-bold"
              />
            </div>
          )}

          {!isRevoke && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                <strong className="font-semibold">Note:</strong> This will
                reactivate the certificate and make it valid again.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExecuting}
            size="lg"
            className="font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExecute}
            disabled={isExecuting || (isRevoke && !reason.trim())}
            size="lg"
            className="font-semibold"
          >
            {isRevoke ? (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Revoke Certificate
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reactivate Certificate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
