"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface RevokeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
  certificateHash: string;
}

export function RevokeDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  certificateHash,
}: RevokeDialogProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim().length >= 1 && reason.trim().length <= 500) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  const isValid = reason.trim().length >= 1 && reason.trim().length <= 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5" />
            Revoke Certificate
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for revoking this certificate. This action
            can be reversed later if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cert-hash">Certificate Hash</Label>
            <p className="text-sm font-mono bg-muted p-2 rounded break-all">
              {certificateHash}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Revocation Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Certificate issued in error, duplicate issuance, student request, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className={!isValid && reason.length > 0 ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {isValid
                  ? "✓ Valid reason"
                  : "Reason required (1-500 characters)"}
              </span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> The revocation reason will be stored on the
              blockchain and will be publicly visible.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
          >
            {isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Revoke Certificate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
