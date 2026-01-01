"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, User, Mail, Building2, Globe } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const VERIFIER_STORAGE_KEY = "verifier_info";
const VERIFIER_EXPIRY_HOURS = 24;

const verifierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .refine(
      (email) => {
        const domain = email.split("@")[1];
        return domain && domain.length > 0;
      },
      { message: "Please enter a valid email address" }
    ),
  institution: z.string().min(2, "Institution name is required"),
  website: z.string().url("Please enter a valid URL"),
});

type VerifierForm = z.infer<typeof verifierSchema>;

interface VerifierDialogProps {
  open: boolean;
  onSubmit: (data: VerifierForm) => void;
  isSubmitting: boolean;
  onClose?: () => void;
}

export function VerifierDialog({
  open,
  onSubmit,
  isSubmitting,
  onClose,
}: VerifierDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifierForm>({
    resolver: zodResolver(verifierSchema),
  });

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && !isSubmitting) {
      onClose?.();
      toast.error(
        "Please fill the required information to verify the certificate"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent
        className="sm:max-w-[550px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-bold">
            Verifier Information
          </DialogTitle>
          <DialogDescription className="font-medium">
            Please provide your information to proceed with certificate
            verification
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wide"
            >
              Full Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., John Doe"
              {...register("name")}
              disabled={isSubmitting}
              className="text-sm "
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wide"
            >
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., john.doe@organization.com"
              {...register("email")}
              disabled={isSubmitting}
              className="text-sm "
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="institution"
              className="text-xs font-bold uppercase tracking-wide"
            >
              Institution/Organization *
            </Label>
            <Input
              id="institution"
              placeholder="e.g., Harvard University"
              {...register("institution")}
              disabled={isSubmitting}
              className="text-sm "
            />
            {errors.institution && (
              <p className="text-xs text-destructive font-medium">
                {errors.institution.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="website"
              className="text-xs font-bold uppercase tracking-wide"
            >
              Institution Website *
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="e.g., https://your-organization.com"
              {...register("website")}
              disabled={isSubmitting}
              className="text-sm "
            />
            {errors.website && (
              <p className="text-xs text-destructive font-medium">
                {errors.website.message}
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              <strong className="font-semibold">Privacy Note:</strong> Your
              information will be stored in your browser for 24 hours and used
              only for audit logging purposes.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-semibold"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Verifying...</span>
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Submit & Verify Certificate
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function getStoredVerifierInfo(): VerifierForm | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(VERIFIER_STORAGE_KEY);
  if (!stored) return null;

  try {
    const { data, expiry } = JSON.parse(stored);
    if (new Date().getTime() > expiry) {
      localStorage.removeItem(VERIFIER_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function storeVerifierInfo(data: VerifierForm) {
  const expiry = new Date().getTime() + VERIFIER_EXPIRY_HOURS * 60 * 60 * 1000;
  localStorage.setItem(VERIFIER_STORAGE_KEY, JSON.stringify({ data, expiry }));
}
