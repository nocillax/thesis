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
        <div className="space-y-6">
          {/* Username Row with Avatar and Admin Badge */}
          <div className="flex items-center gap-3">
            <UserAvatar
              walletAddress={walletAddress}
              username={username}
              isAdmin={isAdmin}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
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
            </div>
          </div>

          {/* Info Grid - 2x2 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Email
              </p>
              <p className="font-semibold">{email}</p>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Status
              </p>
              <StatusBadge isActive={isAuthorized} type="user" />
            </div>

            {/* Registration Date */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Registered On
              </p>
              <p className="font-semibold">{formatDate(registrationDate)}</p>
            </div>

            {/* Wallet Address */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Wallet Address
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-accent px-3 py-1.5 rounded border font-mono break-all md:break-normal">
                  <span className="hidden md:inline">{walletAddress}</span>
                  <span className="md:hidden">
                    {truncateAddress(walletAddress)}
                  </span>
                </code>
                <CopyButton text={walletAddress} label="Copy Address" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
