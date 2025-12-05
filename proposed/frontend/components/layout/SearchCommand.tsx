"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { certificatesAPI } from "@/lib/api/certificates";
import { useDebouncedCallback } from "use-debounce";

export function SearchCommand() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    exact: string | null;
    suggestions: string[];
  } | null>(null);
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

  const handleSelect = (studentId: string) => {
    router.push(`/certificates/student/${studentId}`);
    setQuery("");
    setResults(null);
    setShowDropdown(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuery("");
    setResults(null);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <Command
      ref={containerRef}
      className="border overflow-visible relative "
      shouldFilter={false}
    >
      <div className="relative">
        <CommandInput
          ref={inputRef}
          placeholder="Search by Student ID..."
          value={query}
          onValueChange={handleValueChange}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 z-10"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {showDropdown && query.trim() && results && (
        <div className="absolute top-full left-0 right-0 mt-0.5 z-50 shadow-lg bg-background border rounded-md overflow-hidden">
          <CommandList className="max-h-[300px] overflow-auto">
            {!results ||
            (!results.exact && results.suggestions.length === 0) ? (
              <CommandEmpty>No results found</CommandEmpty>
            ) : (
              <>
                {results.exact && (
                  <CommandGroup heading="Exact Match">
                    <CommandItem onSelect={() => handleSelect(results.exact!)}>
                      {results.exact}
                    </CommandItem>
                  </CommandGroup>
                )}
                {results.exact && results.suggestions.length > 0 && (
                  <CommandSeparator />
                )}
                {results.suggestions.length > 0 && (
                  <CommandGroup heading="Similar Results">
                    {results.suggestions.map((studentId) => (
                      <CommandItem
                        key={studentId}
                        onSelect={() => handleSelect(studentId)}
                      >
                        {studentId}
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
