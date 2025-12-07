"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useIssueCertificate } from "@/lib/hooks/useCertificates";
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
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const issueCertificateSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  student_name: z.string().min(2, "Student name must be at least 2 characters"),
  degree: z.string().min(2, "Degree is required"),
  program: z.string().min(2, "Program is required"),
  cgpa: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "CGPA must be a valid number (e.g., 3.85)")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 4.0;
      },
      { message: "CGPA must be between 0.0 and 4.0" }
    ),
  issuing_authority: z.string().min(2, "Issuing authority is required"),
});

type IssueCertificateForm = z.infer<typeof issueCertificateSchema>;

export default function IssueCertificatePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const { mutate: issueCertificate, isPending } = useIssueCertificate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IssueCertificateForm>({
    resolver: zodResolver(issueCertificateSchema),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!authLoading && user && !user.is_authorized) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user.is_authorized) {
    return null;
  }

  const onSubmit = (data: IssueCertificateForm) => {
    issueCertificate(
      {
        student_id: data.student_id,
        student_name: data.student_name,
        degree: data.degree,
        program: data.program,
        cgpa: parseFloat(data.cgpa),
        issuing_authority: data.issuing_authority,
      },
      {
        onSuccess: () => {
          reset();
          router.push("/certificates");
        },
      }
    );
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Issue New Certificate
          </h1>
          <p className="text-muted-foreground font-medium">
            Create and issue a new academic certificate on the blockchain
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">
              Certificate Information
            </CardTitle>
            <CardDescription className="font-medium">
              Fill in all required fields to issue a certificate
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Student ID */}
              <div className="space-y-2">
                <Label
                  htmlFor="student_id"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Student ID *
                </Label>
                <Input
                  id="student_id"
                  placeholder="e.g., STU2025001"
                  {...register("student_id")}
                  disabled={isPending}
                />
                {errors.student_id && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.student_id.message}
                  </p>
                )}
              </div>

              {/* Student Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="student_name"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Student Name *
                </Label>
                <Input
                  id="student_name"
                  placeholder="e.g., John Doe"
                  {...register("student_name")}
                  disabled={isPending}
                />
                {errors.student_name && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.student_name.message}
                  </p>
                )}
              </div>

              {/* Degree */}
              <div className="space-y-2">
                <Label
                  htmlFor="degree"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Degree *
                </Label>
                <Input
                  id="degree"
                  placeholder="e.g., Bachelor of Science"
                  {...register("degree")}
                  disabled={isPending}
                />
                {errors.degree && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.degree.message}
                  </p>
                )}
              </div>

              {/* Program */}
              <div className="space-y-2">
                <Label
                  htmlFor="program"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Program *
                </Label>
                <Input
                  id="program"
                  placeholder="e.g., Computer Science"
                  {...register("program")}
                  disabled={isPending}
                />
                {errors.program && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.program.message}
                  </p>
                )}
              </div>

              {/* CGPA */}
              <div className="space-y-2">
                <Label
                  htmlFor="cgpa"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  CGPA *
                </Label>
                <Input
                  id="cgpa"
                  type="text"
                  placeholder="e.g., 3.85"
                  {...register("cgpa")}
                  disabled={isPending}
                />
                {errors.cgpa && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.cgpa.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground font-medium">
                  Enter CGPA on a 4.0 scale (e.g., 3.85)
                </p>
              </div>

              {/* Issuing Authority */}
              <div className="space-y-2">
                <Label
                  htmlFor="issuing_authority"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Issuing Authority *
                </Label>
                <Input
                  id="issuing_authority"
                  placeholder="e.g., University of Example"
                  {...register("issuing_authority")}
                  disabled={isPending}
                />
                {errors.issuing_authority && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.issuing_authority.message}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="flex-1 font-semibold"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Issuing Certificate...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Issue Certificate
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/certificates")}
                  disabled={isPending}
                  className="font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Issuing certificate on blockchain...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
