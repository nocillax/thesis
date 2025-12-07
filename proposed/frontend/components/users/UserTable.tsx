"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  flexRender,
} from "@tanstack/react-table";
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldX,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Crown,
  Loader2,
  History,
} from "lucide-react";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { formatDate, truncateAddress } from "@/lib/utils/format";
import {
  useBulkRevokeUsers,
  useBulkReactivateUsers,
  useBulkGrantAdmin,
  useBulkRevokeAdmin,
} from "@/lib/hooks/useUsers";

interface UserTableProps {
  data: User[];
  filterComponent?: React.ReactNode;
}

export function UserTable({ data, filterComponent }: UserTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { mutate: bulkRevoke, isPending: isRevoking } = useBulkRevokeUsers();
  const { mutate: bulkReactivate, isPending: isReactivating } =
    useBulkReactivateUsers();
  const { mutate: bulkGrantAdmin, isPending: isGrantingAdmin } =
    useBulkGrantAdmin();
  const { mutate: bulkRevokeAdmin, isPending: isRevokingAdmin } =
    useBulkRevokeAdmin();

  const isAnyOperationPending =
    isRevoking || isReactivating || isGrantingAdmin || isRevokingAdmin;

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "avatar",
      header: "",
      cell: ({ row }) => (
        <UserAvatar
          walletAddress={row.original.wallet_address}
          username={row.original.username}
          isAdmin={row.original.is_admin}
          size="sm"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "username",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            Username
            {isSorted === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/users/${row.original.wallet_address}`}
            className="font-medium hover:underline"
          >
            {row.original.username}
          </Link>
          {row.original.is_admin && (
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            Email
            {isSorted === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4" />
            )}
          </Button>
        );
      },
    },
    {
      accessorKey: "is_authorized",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            Status
            {isSorted === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <StatusBadge isActive={row.original.is_authorized} type="user" />
      ),
    },
    {
      accessorKey: "wallet_address",
      header: "Wallet Address",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-accent px-2 py-1 rounded border">
            {truncateAddress(row.original.wallet_address)}
          </code>
          <CopyButton text={row.original.wallet_address} label="Copy Address" />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBulkRevoke = () => {
    const addresses = selectedRows.map((row) => row.original.wallet_address);
    bulkRevoke(addresses, {
      onSuccess: () => {
        setRowSelection({});
      },
    });
  };

  const handleBulkReactivate = () => {
    const addresses = selectedRows.map((row) => row.original.wallet_address);
    bulkReactivate(addresses, {
      onSuccess: () => {
        setRowSelection({});
      },
    });
  };

  const handleBulkGrantAdmin = () => {
    const addresses = selectedRows.map((row) => row.original.wallet_address);
    bulkGrantAdmin(addresses, {
      onSuccess: () => {
        setRowSelection({});
      },
    });
  };

  const handleBulkRevokeAdmin = () => {
    const addresses = selectedRows.map((row) => row.original.wallet_address);
    bulkRevokeAdmin(addresses, {
      onSuccess: () => {
        setRowSelection({});
      },
    });
  };

  return (
    <div className="space-y-4 relative">
      {/* Loading Overlay */}
      {isAnyOperationPending && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Processing...</p>
          </div>
        </div>
      )}

      {/* Always Visible Toolbar with 4 Separate Buttons */}
      <div className="flex items-center justify-between gap-2 p-4 border rounded-lg bg-accent/50">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkRevoke}
                  disabled={selectedCount === 0 || isAnyOperationPending}
                >
                  <div className="rounded-full bg-red-100 dark:bg-red-900 p-1">
                    <Lock className="h-3 w-3 text-red-700 dark:text-red-300" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Revoke Access</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReactivate}
                  disabled={selectedCount === 0 || isAnyOperationPending}
                >
                  <div className="rounded-full bg-green-100 dark:bg-green-900 p-1">
                    <Unlock className="h-3 w-3 text-green-700 dark:text-green-300" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Authorize Access</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkGrantAdmin}
                  disabled={selectedCount === 0 || isAnyOperationPending}
                >
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-1">
                    <ShieldCheck className="h-3 w-3 text-blue-700 dark:text-blue-300" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grant Admin Access</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkRevokeAdmin}
                  disabled={selectedCount === 0 || isAnyOperationPending}
                >
                  <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-1">
                    <ShieldX className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Revoke Admin Access</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {selectedCount} of {data.length} selected
            </span>
          )}
        </div>
        
        {/* Filters on the right */}
        {filterComponent && <div>{filterComponent}</div>}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    !row.original.is_authorized
                      ? "bg-muted text-muted-foreground hover:bg-muted"
                      : "hover:bg-muted/50"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
