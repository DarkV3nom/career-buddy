"use client";

import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobSearchTopbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onSubmit: () => void;
  isSearching: boolean;
  disabled: boolean;
  disabledReason: string | null;
}

/**
 * Rounded search bar (reference: Yo!Job's top toolbar) -- keyword +
 * location + a single prominent submit button. The rest of the filters
 * (sources, workplace type, experience level, date posted) live in
 * JobFiltersSidebar next to the results instead of crowding this bar,
 * same split the reference uses (bar up top, detailed filters in the
 * left rail).
 */
export function JobSearchTopbar({
  keyword,
  onKeywordChange,
  location,
  onLocationChange,
  onSubmit,
  isSearching,
  disabled,
  disabledReason,
}: JobSearchTopbarProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || disabled) return;
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:border-r sm:border-border">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Job title or keywords (required)"
          required
          className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:border-r sm:border-border">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="City, state, or country"
          className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <Button type="submit" disabled={isSearching || disabled} className="rounded-xl sm:px-6" title={disabled ? disabledReason ?? undefined : undefined}>
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4" aria-hidden="true" />
        )}
        {isSearching ? "Searching…" : "Search Jobs"}
      </Button>
    </form>
  );
}
