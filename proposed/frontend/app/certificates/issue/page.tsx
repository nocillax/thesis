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
    } else if (!authLoading && user && !user.is_admin) {
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

  if (!user.is_admin) {
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
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Issue New Certificate
                </CardTitle>
                <CardDescription className="text-base">
                  Create and issue a new academic certificate on the blockchain
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Student ID */}
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID *</Label>
                <Input
                  id="student_id"
                  placeholder="e.g., STU2025001"
                  {...register("student_id")}
                  disabled={isPending}
                />
                {errors.student_id && (
                  <p className="text-sm text-destructive">
                    {errors.student_id.message}
                  </p>
                )}
              </div>

              {/* Student Name */}
              <div className="space-y-2">
                <Label htmlFor="student_name">Student Name *</Label>
                <Input
                  id="student_name"
                  placeholder="e.g., John Doe"
                  {...register("student_name")}
                  disabled={isPending}
                />
                {errors.student_name && (
                  <p className="text-sm text-destructive">
                    {errors.student_name.message}
                  </p>
                )}
              </div>

              {/* Degree */}
              <div className="space-y-2">
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  placeholder="e.g., Bachelor of Science"
                  {...register("degree")}
                  disabled={isPending}
                />
                {errors.degree && (
                  <p className="text-sm text-destructive">
                    {errors.degree.message}
                  </p>
                )}
              </div>

              {/* Program */}
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <Input
                  id="program"
                  placeholder="e.g., Computer Science"
                  {...register("program")}
                  disabled={isPending}
                />
                {errors.program && (
                  <p className="text-sm text-destructive">
                    {errors.program.message}
                  </p>
                )}
              </div>

              {/* CGPA */}
              <div className="space-y-2">
                <Label htmlFor="cgpa">CGPA *</Label>
                <Input
                  id="cgpa"
                  type="text"
                  placeholder="e.g., 3.85"
                  {...register("cgpa")}
                  disabled={isPending}
                />
                {errors.cgpa && (
                  <p className="text-sm text-destructive">
                    {errors.cgpa.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter CGPA on a 4.0 scale (e.g., 3.85)
                </p>
              </div>

              {/* Issuing Authority */}
              <div className="space-y-2">
                <Label htmlFor="issuing_authority">Issuing Authority *</Label>
                <Input
                  id="issuing_authority"
                  placeholder="e.g., University of Example"
                  {...register("issuing_authority")}
                  disabled={isPending}
                />
                {errors.issuing_authority && (
                  <p className="text-sm text-destructive">
                    {errors.issuing_authority.message}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Issue Certificate
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/certificates")}
                  disabled={isPending}
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
            <p className="text-sm text-muted-foreground">
              Issuing certificate...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
