"use client";

import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-bold text-destructive">
            Revoke Certificate
          </DialogTitle>
          <DialogDescription className="font-medium">
            Please provide a reason for revoking this certificate. This action
            can be reversed later if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="cert-hash"
              className="text-xs font-bold uppercase tracking-wide"
            >
              Certificate Hash
            </Label>
            <p className="text-sm font-mono bg-muted px-3 py-2 rounded border break-all">
              {certificateHash}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="reason"
              className="text-xs font-bold uppercase tracking-wide"
            >
              Revocation Reason *
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Certificate contains fraudulent information"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className={`font-bold ${
                !isValid && reason.length > 0 ? "border-red-500" : ""
              }`}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>
                {isValid
                  ? "✓ Valid reason"
                  : "Reason required (1-500 characters)"}
              </span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
              <strong className="font-semibold">Note:</strong> The revocation
              reason will be stored on the blockchain and will be publicly
              visible.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            size="lg"
            className="font-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            size="lg"
            className="font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
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
