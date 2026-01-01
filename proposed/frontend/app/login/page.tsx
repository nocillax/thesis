"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  connectWallet,
  signMessage,
  createLoginMessage,
} from "@/lib/blockchain/wallet";
import { authAPI } from "@/lib/api/auth";
import { sessionsAPI } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { setAuth, fetchUser, user, isAuthenticated, isLoading } =
    useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleWalletLogin = async () => {
    setIsConnecting(true);

    try {
      // Step 1: Connect wallet
      const address = await connectWallet();
      if (!address) {
        toast.error("Failed to connect wallet");
        setIsConnecting(false);
        return;
      }

      // Step 2: Create login message
      const message = createLoginMessage();

      // Step 3: Sign message
      const signature = await signMessage(message);
      if (!signature) {
        toast.error("Failed to sign message");
        setIsConnecting(false);
        return;
      }

      // Step 4: Send to backend
      const response = await authAPI.walletLogin({
        walletAddress: address,
        message,
        signature,
      });

      if (response.success && response.access_token) {
        // Store token in localStorage with correct key
        localStorage.setItem("access_token", response.access_token);

        // Update auth store and wait for user to be fetched
        setAuth({
          isAuthenticated: true,
          walletAddress: address,
          token: response.access_token,
        });

        // Wait for user to be fetched
        await fetchUser();

        toast.success("Login successful!");

        // Small delay to ensure state is fully updated
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Wallet login error:", error);

      // Handle specific error cases
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        toast.error("Login cancelled. Please try again.");
      } else if (error.response?.data?.message) {
        // Backend error with message
        toast.error(error.response.data.message);
      } else if (error.message?.includes("not authorized")) {
        toast.error("Access denied: Your account is not authorized to login.");
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Sign in securely using your crypto wallet to access CertChain
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={handleWalletLogin}
              disabled={isConnecting}
              size="lg"
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">How it works:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Click "Connect Wallet" button</li>
                <li>Approve the connection in your wallet</li>
                <li>Sign the authentication message</li>
                <li>Access your dashboard</li>
              </ol>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground text-center">
                Supports Rabby, MetaMask, and other Web3 wallets
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
