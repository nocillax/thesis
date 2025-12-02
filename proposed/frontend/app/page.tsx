"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Lock,
  Globe,
  Search,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />

        <div className="container relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-accent/50">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Powered by Blockchain Technology
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Secure Certificate Management on the{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Blockchain
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Issue, verify, and manage academic certificates with immutable
              blockchain technology. Tamper-proof, transparent, and instantly
              verifiable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" asChild className="gap-2">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#verify">Verify Certificate</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-accent/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose CertChain?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge blockchain technology to ensure security,
              transparency, and trust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Immutable Records
                </h3>
                <p className="text-muted-foreground">
                  Once issued, certificates cannot be altered or tampered with,
                  ensuring permanent authenticity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Instant Verification
                </h3>
                <p className="text-muted-foreground">
                  Verify any certificate in seconds using blockchain explorer
                  integration and public access.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Complete Transparency
                </h3>
                <p className="text-muted-foreground">
                  Full audit trail of all certificate actions, from issuance to
                  revocation and reactivation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Verify Section */}
      <section id="verify" className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Verify a Certificate
                  </h2>
                  <p className="text-muted-foreground">
                    Enter a student ID or certificate hash to verify
                    authenticity
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const query = formData.get("query") as string;
                    if (query.trim()) {
                      window.location.href = `/verify?q=${encodeURIComponent(
                        query.trim()
                      )}`;
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    name="query"
                    placeholder="Enter Student ID or Certificate Hash..."
                    className="flex-1"
                    required
                  />
                  <Button type="submit" size="lg">
                    Verify
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Public verification is available 24/7. No login required.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-accent/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join institutions worldwide using blockchain for certificate
              management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="gap-2">
                <Link href="/login">
                  Connect Wallet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
