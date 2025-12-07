"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/common/CopyButton";
import { FacebookIcon } from "@/public/icons/facebook";
import { TwitterIcon } from "@/public/icons/twitter";
import { GitHubIcon } from "@/public/icons/github";
import { WebsiteIcon } from "@/public/icons/website";

export function Footer() {
  const [contractsExpanded, setContractsExpanded] = useState(false);

  const contractAddresses = [
    {
      name: "Certificate Registry",
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    },
    {
      name: "User Registry",
      address: process.env.NEXT_PUBLIC_USER_REGISTRY_ADDRESS || "",
    },
    {
      name: "Admin Wallet",
      address: process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || "",
    },
  ];

  const blockchainNetwork =
    process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || "Quorum";

  const socialLinks = [
    {
      name: "Facebook",
      url: "https://facebook.com/your-university",
      icon: FacebookIcon,
    },
    {
      name: "Twitter",
      url: "https://twitter.com/your-university",
      icon: TwitterIcon,
    },
    {
      name: "GitHub",
      url: "https://github.com/your-university",
      icon: GitHubIcon,
    },
    {
      name: "Website",
      url: "https://your-university.edu",
      icon: WebsiteIcon,
    },
  ];

  return (
    <footer className="border-t bg-background relative mt-16 z-0">
      <div className="container py-8">
        {/* Section 1: Three Column Grid - Logo, Links, Social */}
        <div className="grid md:grid-cols-3 gap-8 mb-8 pb-6 border-b">
          {/* Left: Logo & Name - Left Aligned */}
          <div className="flex justify-center md:justify-start">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">
                  NX
                </span>
              </div>
              <span className="text-lg font-bold text-secondary-foreground">
                NXCertify
              </span>
            </div>
          </div>

          {/* Middle: Links - Center Aligned */}
          <div className="flex items-center justify-center gap-6">
            <a
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              About
            </a>
            <a
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Documentation
            </a>
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Privacy Policy
            </a>
          </div>

          {/* Right: Social - Right Aligned */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <h3 className="text-sm text-muted-foreground">Connect with us</h3>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-full bg-secondary/20 hover:bg-secondary/40 flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Blockchain Status & Smart Contracts */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Connected to{" "}
              <span className="font-semibold text-foreground">
                {blockchainNetwork}
              </span>{" "}
              Network
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setContractsExpanded(!contractsExpanded)}
            className="flex items-center gap-1"
          >
            <span className="font-medium">Smart Contracts</span>
            {contractsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Contract Addresses (Expandable) */}
        {contractsExpanded && (
          <div className="mb-8 p-4 rounded-lg border bg-secondary/10">
            <div className="grid gap-3">
              {contractAddresses.map((contract) => (
                <div
                  key={contract.name}
                  className="flex items-center justify-between flex-wrap gap-2"
                >
                  <span className="text-sm font-semibold">
                    {contract.name}:
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1 rounded border font-mono">
                      {contract.address}
                    </code>
                    <CopyButton
                      text={contract.address}
                      label={`Copy ${contract.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Copyright & Developer */}
        <div className="flex flex-col md:flex-row items-center justify-end gap-2 text-sm">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} NXCertify. All rights reserved.
          </p>
          <span className="text-muted-foreground">•</span>
          <p className="text-muted-foreground">
            Developed by{" "}
            <span className="text-foreground font-semibold">nocillax</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
