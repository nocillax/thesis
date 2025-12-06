"use client";

import { formatDistanceToNow } from "date-fns";
import { FileCheck, Ban, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/common/CopyButton";
import { truncateAddress } from "@/lib/utils/format";
import { AuditLogEntry } from "@/lib/api/auditLogs";

interface CertificateAuditTableProps {
  logs: AuditLogEntry[];
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "ISSUED":
      return <FileCheck className="h-4 w-4 text-green-600" />;
    case "REVOKED":
      return <Ban className="h-4 w-4 text-red-600" />;
    case "REACTIVATED":
      return <RefreshCw className="h-4 w-4 text-blue-600" />;
    default:
      return null;
  }
};

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case "ISSUED":
      return "default";
    case "REVOKED":
      return "destructive";
    case "REACTIVATED":
      return "secondary";
    default:
      return "default";
  }
};

export function CertificateAuditTable({ logs }: CertificateAuditTableProps) {
  const getActorAddress = (log: AuditLogEntry) => {
    if (log.action === "ISSUED") return log.issuer;
    if (log.action === "REVOKED") return log.revoked_by;
    if (log.action === "REACTIVATED") return log.reactivated_by;
    return "Unknown";
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Wallet Address</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <TableRow key={`${log.transaction_hash}-${index}`}>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-accent px-2 py-1 rounded border">
                      {truncateAddress(getActorAddress(log)!)}
                    </code>
                    <CopyButton
                      text={getActorAddress(log)!}
                      label="Copy Address"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                No audit logs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
