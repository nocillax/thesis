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
  FileCheck,
  Clock,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-secondary/20">
        <div className="container relative z-10">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-secondary-foreground">
              University Certificate
              <br />
              <span className="text-primary">Verification System</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium">
              NXCertify provides a secure, blockchain-based platform for issuing
              and verifying academic certificates with complete transparency and
              authenticity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" asChild className="gap-2 font-semibold">
                <Link href="#verify">
                  <Search className="h-5 w-5" />
                  Verify Certificate
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="font-semibold"
              >
                <Link href="/login">
                  <Shield className="h-5 w-5 mr-2" />
                  Staff Portal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why NXCertify Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary-foreground">
              Why NXCertify?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Our university has adopted NXCertify to ensure the highest
              standards of certificate authenticity and security.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-lg transition-shadow bg-card">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Tamper-Proof Records
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  All certificates are stored on the blockchain, making them
                  impossible to alter or forge. Every credential is permanently
                  secured.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow bg-card">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-secondary/20 flex items-center justify-center mb-6">
                  <Clock className="h-7 w-7 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Instant Verification
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Employers and institutions can verify certificates in seconds,
                  24/7, without needing to contact the university directly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow bg-card">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <FileCheck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Complete Audit Trail
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every action is recorded with full transparency - from
                  issuance to any updates or revocations that may occur.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Verify Section */}
      <section id="verify" className="py-16 md:py-20 bg-secondary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 text-secondary-foreground">
                    Verify a Certificate
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Enter the certificate hash to instantly verify authenticity
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
                  className="flex gap-3"
                >
                  <Input
                    name="query"
                    placeholder="Enter The Certificate Hash..."
                    className="flex-1 h-12 text-base"
                    required
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="font-semibold px-8"
                  >
                    Verify
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">
                      Public verification available 24/7 • No login required
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              A simple, secure process powered by blockchain technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                Certificate Issued
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                University staff issue certificates through the secure portal,
                which are immediately recorded on the blockchain.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-secondary-foreground text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                Blockchain Storage
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Each certificate receives a unique hash and is stored immutably,
                ensuring it cannot be altered or forged.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                Instant Verification
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Anyone can verify authenticity instantly using the student ID or
                certificate hash - no login required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Users className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground">
              For University Staff
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Access the secure portal to issue, manage, and track certificates
            </p>
            <div className="pt-4">
              <Button size="lg" asChild className="gap-2 font-semibold px-8">
                <Link href="/login">
                  <Shield className="h-5 w-5" />
                  Access Staff Portal
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
