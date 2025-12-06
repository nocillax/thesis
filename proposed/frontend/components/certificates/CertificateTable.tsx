"use client";

import { useState } from "react";
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
  Ban,
  CheckCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { Certificate } from "@/types/certificate";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { CopyButton } from "@/components/common/CopyButton";
import { formatDate, truncateHash, formatCGPA } from "@/lib/utils/format";
import {
  useBulkRevokeCertificates,
  useBulkReactivateCertificates,
} from "@/lib/hooks/useCertificates";

interface CertificateTableProps {
  data: Certificate[];
}

export function CertificateTable({ data }: CertificateTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { mutate: bulkRevoke, isPending: isRevoking } =
    useBulkRevokeCertificates();
  const { mutate: bulkReactivate, isPending: isReactivating } =
    useBulkReactivateCertificates();

  const isAnyOperationPending = isRevoking || isReactivating;

  const columns: ColumnDef<Certificate>[] = [
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
      accessorKey: "student_id",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            Student ID
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
        <Link
          href={`/certificates/student/${row.original.student_id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.student_id}
        </Link>
      ),
    },
    {
      accessorKey: "student_name",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            Name
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
      accessorKey: "degree",
      header: "Degree",
    },
    {
      accessorKey: "program",
      header: "Program",
    },
    {
      accessorKey: "cgpa",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            CGPA
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
      cell: ({ row }) => formatCGPA(row.original.cgpa),
    },
    {
      accessorKey: "issuance_date",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            Issue Date
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
      cell: ({ row }) => formatDate(row.original.issuance_date),
    },
    {
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => (
        <span className="font-mono text-sm">v{row.original.version}</span>
      ),
    },
    {
      accessorKey: "is_revoked",
      header: "Status",
      cell: ({ row }) => <StatusBadge isActive={!row.original.is_revoked} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link href={`/certificates/${row.original.cert_hash}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <CopyButton text={row.original.cert_hash} label="Copy Hash" />
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
    const hashes = selectedRows.map((row) => row.original.cert_hash);
    bulkRevoke(hashes, {
      onSuccess: () => {
        setRowSelection({});
      },
    });
  };

  const handleBulkReactivate = () => {
    const hashes = selectedRows.map((row) => row.original.cert_hash);
    bulkReactivate(hashes, {
      onSuccess: () => {
        setRowSelection({});
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Always Visible Toolbar */}
      <div className="flex items-center gap-2 p-4 border rounded-lg bg-accent/50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRevoke}
                disabled={selectedCount === 0 || isRevoking}
              >
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-1">
                  <Ban className="h-3 w-3 text-red-700 dark:text-red-300" />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Revoke Certificate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReactivate}
                disabled={selectedCount !== 1 || isReactivating}
              >
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-1">
                  <CheckCircle className="h-3 w-3 text-green-700 dark:text-green-300" />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {selectedCount === 1
                ? "Reactivate Certificate"
                : "Select only 1 certificate to reactivate"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            {selectedCount} of {data.length} selected
          </span>
        )}
      </div>

      {/* Loading Overlay */}
      {isAnyOperationPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        </div>
      )}

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
                    row.original.is_revoked
                      ? "bg-destructive/10 hover:bg-destructive/20 opacity-75"
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
                  No certificates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
