"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { Eye, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Certificate } from "@/types/certificate";
import { Button } from "@/components/ui/button";
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

interface CertificateTableProps {
  data: Certificate[];
  filterComponent?: React.ReactNode;
}

export function CertificateTable({
  data,
  filterComponent,
}: CertificateTableProps) {
  const { user } = useAuthStore();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Certificate>[] = [
    {
      accessorKey: "student_id",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1  text-primary font-semibold uppercase"
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
          className="text-blue-700 dark:text-blue-500 hover:underline font-semibold ml-5"
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
            className="flex items-center gap-1 -ml-3 text-primary font-semibold uppercase"
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
      accessorKey: "issuance_date",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 -ml-3 text-primary font-semibold uppercase"
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
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 -ml-3 text-primary font-semibold uppercase"
          >
            Version
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
        <span className="font-mono font-bold text-sm ml-5">
          v{row.original.version}
        </span>
      ),
    },
    {
      accessorKey: "is_revoked",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-primary font-semibold uppercase"
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
      cell: ({ row }) => <StatusBadge isActive={!row.original.is_revoked} />,
    },
    {
      id: "actions",
      header: () => (
        <span className="text-primary font-semibold uppercase">Actions</span>
      ),
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
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar with Filters Only */}
      {filterComponent && (
        <div className="flex items-center justify-end gap-2 p-4 border rounded-lg bg-accent/50">
          {filterComponent}
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
                  className={
                    row.original.is_revoked
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
