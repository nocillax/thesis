"use client";

import Link from "next/link";
import { format } from "date-fns";
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
import { truncateHash } from "@/lib/utils/format";
import { AuditLogEntry } from "@/lib/api/auditLogs";

interface UserAuditTableProps {
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

export function UserAuditTable({ logs }: UserAuditTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Action</TableHead>
            <TableHead className="w-[50%]">Certificate Hash</TableHead>
            <TableHead className="w-[25%]">When</TableHead>
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
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(log.timestamp), "hh:mm a")}
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
