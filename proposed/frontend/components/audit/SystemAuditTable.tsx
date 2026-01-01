"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/utils/format";
import { FileCheck, Ban, RefreshCw, ExternalLink } from "lucide-react";
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
import { truncateHash, truncateAddress } from "@/lib/utils/format";
import { AuditLogEntry } from "@/lib/api/auditLogs";

interface SystemAuditTableProps {
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
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
    case "REVOKED":
      return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
    case "REACTIVATED":
      return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
  }
};

export function SystemAuditTable({ logs }: SystemAuditTableProps) {
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
            <TableHead className="text-primary font-semibold">Action</TableHead>
            <TableHead className="text-primary font-semibold">
              Certificate Hash
            </TableHead>
            <TableHead className="text-primary font-semibold">
              Wallet Address
            </TableHead>
            <TableHead className="text-primary font-semibold">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <TableRow key={`${log.transaction_hash}-${index}`}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getActionBadgeVariant(log.action)}
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/certificates/${log.cert_hash}`}
                      className="text-xs bg-accent px-2 py-1 rounded border hover:bg-accent/80 transition-colors font-mono"
                    >
                      {truncateHash(log.cert_hash)}
                    </Link>
                    <CopyButton text={log.cert_hash} label="Copy Hash" />
                    <Link href={`/audit-logs/certificate/${log.cert_hash}`}>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                  </div>
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
                    <Link href={`/users/${getActorAddress(log)}`}>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(log.timestamp)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No audit logs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
