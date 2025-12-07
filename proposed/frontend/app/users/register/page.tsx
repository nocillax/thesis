"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useRegisterUser } from "@/lib/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const registerUserSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  is_admin: z.boolean(),
});

type RegisterUserForm = z.infer<typeof registerUserSchema>;

export default function RegisterUserPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const { mutate: registerUser, isPending } = useRegisterUser();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyModalOpen, setPrivateKeyModalOpen] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<RegisterUserForm>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      is_admin: false,
    },
  });

  const isAdmin = watch("is_admin");

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const onSubmit = (data: RegisterUserForm) => {
    registerUser(
      {
        username: data.username,
        email: data.email,
        is_admin: data.is_admin,
      },
      {
        onSuccess: (response: any) => {
          // Show private key modal if keys were generated
          if (response.wallet_address && response.private_key) {
            setGeneratedKeys({
              address: response.wallet_address,
              privateKey: response.private_key,
            });
            setPrivateKeyModalOpen(true);
          }
          reset();
        },
      }
    );
  };

  const handleCloseModal = () => {
    setPrivateKeyModalOpen(false);
    router.push("/users");
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Register New User
          </h1>
          <p className="text-muted-foreground font-medium">
            Create a new authorized user account with blockchain wallet
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">
              User Information
            </CardTitle>
            <CardDescription className="font-medium">
              Fill in all required fields to register a new user
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Username *
                </Label>
                <Input
                  id="username"
                  placeholder="e.g., johndoe"
                  {...register("username")}
                  disabled={isPending}
                />
                {errors.username && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john.doe@example.com"
                  {...register("email")}
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Admin Checkbox */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="is_admin"
                  checked={isAdmin}
                  onCheckedChange={(checked) =>
                    setValue("is_admin", checked as boolean)
                  }
                  disabled={isPending}
                />
                <Label
                  htmlFor="is_admin"
                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Grant admin privileges
                </Label>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-lg border bg-accent/50">
                <p className="text-sm text-muted-foreground font-medium">
                  <strong>Note:</strong> A new blockchain wallet will be
                  generated for this user. The private key will be displayed
                  only once after registration.
                </p>
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
                      Registering User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Register User
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/users")}
                  disabled={isPending}
                  className="font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Private Key Modal */}
        <Dialog
          open={privateKeyModalOpen}
          onOpenChange={setPrivateKeyModalOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-6 w-6 text-primary" />
                User Registered Successfully
              </DialogTitle>
              <DialogDescription>
                Save the private key securely. It will not be shown again.
              </DialogDescription>
            </DialogHeader>

            {generatedKeys && (
              <div className="space-y-6 py-4">
                {/* Wallet Address */}
                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedKeys.address}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedKeys.address)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Private Key */}
                <div className="space-y-2">
                  <Label>Private Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedKeys.privateKey}
                      readOnly
                      type={showPrivateKey ? "text" : "password"}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedKeys.privateKey)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Warning */}
                <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Store this private key securely. It cannot be recovered
                    if lost.
                  </p>
                </div>

                {/* Close Button */}
                <Button onClick={handleCloseModal} className="w-full">
                  I've Saved the Private Key
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
