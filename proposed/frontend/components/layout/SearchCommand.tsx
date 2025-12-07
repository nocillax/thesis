"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { certificatesAPI } from "@/lib/api/certificates";
import { useDebouncedCallback } from "use-debounce";
import { truncateAddress } from "@/lib/utils/format";

type SearchResults = {
  studentIds: string[];
  certificates: Array<{
    cert_hash: string;
    student_id: string;
    is_active: boolean;
  }>;
  users: Array<{
    wallet_address: string;
    username: string;
    email: string;
    is_authorized: boolean;
  }>;
};

export function SearchCommand() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setShowDropdown(false);
      return;
    }

    try {
      const data = await certificatesAPI.search(searchQuery);
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setResults(null);
      setShowDropdown(false);
    }
  }, 300);

  const handleValueChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleStudentIdSelect = (studentId: string) => {
    router.push(`/certificates/student/${studentId}`);
    closeSearch();
  };

  const handleCertificateSelect = (certHash: string) => {
    router.push(`/certificates/${certHash}`);
    closeSearch();
  };

  const handleUserSelect = (walletAddress: string) => {
    router.push(`/users/${walletAddress}`);
    closeSearch();
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const closeSearch = () => {
    setQuery("");
    setResults(null);
    setShowDropdown(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeSearch();
    inputRef.current?.focus();
  };

  const hasResults =
    results &&
    (results.studentIds.length > 0 ||
      results.certificates.length > 0 ||
      results.users.length > 0);

  return (
    <Command
      ref={containerRef}
      className="border overflow-visible relative w-[400px]"
      shouldFilter={false}
    >
      <div className="relative">
        <CommandInput
          ref={inputRef}
          placeholder="Search Student ID, Certificate Hash, or Wallet..."
          value={query}
          onValueChange={handleValueChange}
          className="pr-8 text-sm placeholder:text-xs"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 z-10 bg-background px-1 rounded"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {showDropdown && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-0.5 z-50 shadow-lg bg-background border rounded-md overflow-hidden">
          <CommandList className="max-h-[400px] overflow-auto">
            {!hasResults ? (
              <CommandEmpty>No results found</CommandEmpty>
            ) : (
              <>
                {/* Student IDs Category */}
                {results.studentIds.length > 0 && (
                  <>
                    <CommandGroup heading="Student IDs">
                      {results.studentIds.map((studentId) => (
                        <CommandItem
                          key={`student-${studentId}`}
                          onSelect={() => handleStudentIdSelect(studentId)}
                          className="flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span>{studentId}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {(results.certificates.length > 0 ||
                      results.users.length > 0) && <CommandSeparator />}
                  </>
                )}

                {/* Certificates Category */}
                {results.certificates.length > 0 && (
                  <>
                    <CommandGroup heading="Certificates">
                      {results.certificates.map((cert) => (
                        <CommandItem
                          key={`cert-${cert.cert_hash}`}
                          onSelect={() =>
                            handleCertificateSelect(cert.cert_hash)
                          }
                          className="flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <code className="text-xs bg-accent px-2 py-0.5 rounded border truncate">
                              {truncateAddress(cert.cert_hash)}
                            </code>
                            <span className="text-xs text-muted-foreground truncate">
                              {cert.student_id}
                            </span>
                            {!cert.is_active && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-red-100 text-red-700 border-red-300"
                              >
                                Revoked
                              </Badge>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(cert.cert_hash, "Certificate hash");
                            }}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {results.users.length > 0 && <CommandSeparator />}
                  </>
                )}

                {/* Users Category */}
                {results.users.length > 0 && (
                  <CommandGroup heading="Users">
                    {results.users.map((user) => (
                      <CommandItem
                        key={`user-${user.wallet_address}`}
                        onSelect={() => handleUserSelect(user.wallet_address)}
                        className="flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <UserAvatar
                            walletAddress={user.wallet_address}
                            username={user.username}
                            size="sm"
                          />
                          <span className="font-medium truncate">
                            {user.username}
                          </span>
                          <code className="text-xs bg-accent px-2 py-0.5 rounded border truncate">
                            {truncateAddress(user.wallet_address)}
                          </code>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(user.wallet_address, "Wallet address");
                          }}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </div>
      )}
    </Command>
  );
}
