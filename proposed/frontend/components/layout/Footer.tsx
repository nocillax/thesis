"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/common/CopyButton";

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

  return (
    <footer className="border-t bg-background">
      <div className="container py-6">
        {/* Blockchain Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Connected to{" "}
              <span className="font-medium text-foreground">
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
            Contract Addresses
            {contractsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Contract Addresses (Expandable) */}
        {contractsExpanded && (
          <div className="mb-4 p-4 rounded-lg border bg-accent/50">
            <div className="grid gap-3">
              {contractAddresses.map((contract) => (
                <div
                  key={contract.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{contract.name}:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1 rounded border">
                      {contract.address}
                    </code>
                    <CopyButton
                      text={contract.address}
                      label={`Copy ${contract.name}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={`https://explorer.example.com/address/${contract.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="mb-4" />

        {/* Footer Links & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CertChain. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              About
            </a>
            <a href="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </a>
            <a
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://github.com/yourusername/certchain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
