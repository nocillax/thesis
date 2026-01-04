"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  ShieldCheck,
  Lock,
  Globe,
  Search,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Clock,
  Users,
  FileText,
  UserSearch,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-b from-secondary/20 via-secondary/10 to-background">
        <div className="container relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Powered by GoQuorum Blockchain
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-secondary-foreground">
              Secure Academic Certificate
              <br />
              <span className="text-primary">Management & Verification</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl font-medium leading-relaxed">
              NXCertify is the university's official blockchain-based platform
              for issuing, managing, and verifying academic certificates with
              complete transparency, immutability, and instant verification
              capabilities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                size="lg"
                asChild
                className="gap-2 font-semibold text-base px-8"
              >
                <Link href="/verify">
                  <Search className="h-5 w-5" />
                  Verify Certificate
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="font-semibold text-base px-8"
              >
                <Link href="/login">
                  <Shield className="h-5 w-5 mr-2" />
                  Staff Portal
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 w-full max-w-4xl">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  100%
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Tamper-Proof
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Verification
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  &lt;3s
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Verify Time
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  ∞
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Audit Trail
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-background via-secondary/5 to-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary-foreground">
              Comprehensive Certificate Ecosystem
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              A complete solution for managing the entire certificate lifecycle
              with role-based access control and blockchain-backed security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Certificate Issuance
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Issue certificates with student details, generate QR codes,
                  and create downloadable PDF/PNG documents with blockchain
                  verification.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Revoke & Reactivate
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Manage certificate lifecycle with revocation and reactivation
                  capabilities through a secure request-approval workflow.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Public Verification
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Instant verification via certificate hash or student ID - no
                  login required. Perfect for employers and institutions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Role-Based Access
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Admin and staff roles with granular permissions. Rabby Wallet
                  integration for secure blockchain authentication.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <FileCheck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Complete Audit Logs
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track every action with detailed system and certificate logs.
                  Monitor verification attempts and user activities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <UserSearch className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                  Verifier Management
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track verification logs, block suspicious IP addresses, and
                  maintain security with comprehensive verifier monitoring.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              A secure, transparent process from certificate creation to
              verification, powered by Quorum blockchain technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary text-primary-foreground text-3xl font-bold shadow-lg">
                  1
                </div>
                {/* Arrow */}
                <div className="hidden lg:block absolute top-1/2 -right-12 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-primary/30" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                Staff Issues Certificate
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Authorized staff members create certificates with student
                information through the secure portal.
              </p>
            </div>

            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary text-primary-foreground text-3xl font-bold shadow-lg">
                  2
                </div>
                {/* Arrow */}
                <div className="hidden lg:block absolute top-1/2 -right-12 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-primary/30" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                Blockchain Recording
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Certificate data is hashed and permanently recorded on the
                Quorum blockchain network.
              </p>
            </div>

            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary text-primary-foreground text-3xl font-bold shadow-lg">
                  3
                </div>
                {/* Arrow */}
                <div className="hidden lg:block absolute top-1/2 -right-12 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-primary/30" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                PDF Generation
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                System generates downloadable certificate with QR code and
                unique blockchain hash.
              </p>
            </div>

            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary text-primary-foreground text-3xl font-bold shadow-lg">
                  4
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary-foreground">
                Public Verification
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Anyone can verify certificate authenticity instantly using the
                hash or student ID.
              </p>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-16">
            <Card className="border-2 bg-secondary/5">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-secondary-foreground">
                      Request-Approval Workflow
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Sensitive operations like revocation require staff
                      requests and admin approval, ensuring accountability and
                      preventing unauthorized changes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-secondary/5">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-secondary-foreground">
                      Certificate Versioning
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      When a new certificate is issued for the same student
                      (e.g., after revoking an old one), a new version is
                      created while maintaining complete history for
                      transparency and traceability.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Action Cards Section - Verify + Staff */}
      <section
        id="verify"
        className="py-20 md:py-24 bg-gradient-to-b from-secondary/10 to-background"
      >
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary-foreground">
              Get Started
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Choose your path based on your role
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Verify Certificate Card */}
            <Card className="border-2 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <CardContent className="pt-10 pb-10 text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 mb-6">
                  <Search className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-secondary-foreground">
                  Verify Certificate
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Upload certificate PDF or image for instant verification. No
                  login required.
                </p>
                <Button
                  size="lg"
                  asChild
                  className="w-full gap-2 font-semibold text-base"
                >
                  <Link href="/verify">
                    <Search className="h-5 w-5" />
                    Verify Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* University Staff Card */}
            <Card className="border-2 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <CardContent className="pt-10 pb-10 text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 mb-6">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-secondary-foreground">
                  University Staff
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Access the secure portal to issue certificates, manage users,
                  and handle action requests.
                </p>
                <Button
                  size="lg"
                  asChild
                  className="w-full gap-2 font-semibold text-base"
                >
                  <Link href="/login">
                    <Shield className="h-5 w-5" />
                    Access Portal
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Banner */}
      <section className="py-12 bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-secondary-foreground">
                  GoQuorum Blockchain
                </div>
                <div className="text-sm text-muted-foreground">
                  Enterprise-grade security
                </div>
              </div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-secondary-foreground">
                  Rabby Wallet
                </div>
                <div className="text-sm text-muted-foreground">
                  Secure wallet authentication
                </div>
              </div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-secondary-foreground">
                  Complete Audit Trail
                </div>
                <div className="text-sm text-muted-foreground">
                  Every action tracked
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
