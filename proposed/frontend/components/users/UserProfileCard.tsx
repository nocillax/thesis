"use client";

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/common/CopyButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, truncateAddress } from "@/lib/utils/format";
import { UserAvatar } from "@/components/common/UserAvatar";

interface UserProfileCardProps {
  walletAddress: string;
  username: string;
  email: string;
  registrationDate: string | number;
  isAuthorized: boolean;
  isAdmin: boolean;
}

export function UserProfileCard({
  walletAddress,
  username,
  email,
  registrationDate,
  isAuthorized,
  isAdmin,
}: UserProfileCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-6">
          {/* Avatar with optional admin border */}
          <UserAvatar
            walletAddress={walletAddress}
            username={username}
            isAdmin={isAdmin}
            size="lg"
          />

          {/* User Details */}
          <div className="flex-1 space-y-4">
            {/* Username and Admin Badge */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{username}</h2>
                {isAdmin && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>

            {/* Wallet Address */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Wallet Address
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-accent px-3 py-1.5 rounded border font-mono">
                  {truncateAddress(walletAddress)}
                </code>
                <CopyButton text={walletAddress} label="Copy Address" />
              </div>
            </div>

            {/* Registration Date and Status */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Registered On
                </p>
                <p className="text-sm font-medium">
                  {formatDate(registrationDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <StatusBadge isActive={isAuthorized} type="user" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
