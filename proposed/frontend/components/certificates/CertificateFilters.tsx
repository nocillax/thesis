"use client";

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CertificateFilters as CertificateFiltersType } from "@/lib/api/certificates";

interface CertificateFiltersProps {
  filters: CertificateFiltersType;
  onFiltersChange: (filters: CertificateFiltersType) => void;
}

export function CertificateFilters({
  filters,
  onFiltersChange,
}: CertificateFiltersProps) {
  const hasActiveFilters =
    filters.status !== undefined || filters.hide_revoked === true;

  const activeFilterCount = [filters.status, filters.hide_revoked].filter(
    Boolean
  ).length;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const toggleHideRevoked = () => {
    onFiltersChange({
      ...filters,
      hide_revoked: !filters.hide_revoked,
    });
  };

  const setStatus = (status?: "active" | "revoked") => {
    onFiltersChange({
      ...filters,
      status,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-secondary-foreground font-semibold">
            Status
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setStatus(undefined)}
            className={filters.status === undefined ? "bg-accent" : ""}
          >
            All
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setStatus("active")}
            className={filters.status === "active" ? "bg-accent" : ""}
          >
            Active
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setStatus("revoked")}
            className={filters.status === "revoked" ? "bg-accent" : ""}
          >
            Revoked
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hide Revoked Toggle */}
      <Button
        variant={filters.hide_revoked ? "secondary" : "outline"}
        size="sm"
        onClick={toggleHideRevoked}
      >
        {filters.hide_revoked ? "Active Only" : "Hide Revoked"}
      </Button>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className=" h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
