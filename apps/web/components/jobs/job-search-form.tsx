"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JobSearchFilters, JobSourcePlatform } from "@/lib/jobs/types";

export interface JobSearchFormProps {
  onSearch: (filters: JobSearchFilters, platforms: JobSourcePlatform[]) => void;
  isSearching: boolean;
}

const PLATFORM_LABELS: Record<JobSourcePlatform, string> = {
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  HIRINGCAFE: "Hiring.cafe",
};

const EXPERIENCE_OPTIONS: { value: NonNullable<JobSearchFilters["experienceLevel"]> | ""; label: string }[] = [
  { value: "", label: "Any experience level" },
  { value: "internship", label: "Internship" },
  { value: "entry_level", label: "Entry level" },
  { value: "associate", label: "Associate" },
  { value: "mid_senior_level", label: "Mid-Senior level" },
  { value: "director", label: "Director" },
  { value: "executive", label: "Executive" },
];

const WORKPLACE_OPTIONS: { value: NonNullable<JobSearchFilters["workplaceType"]> | ""; label: string }[] = [
  { value: "", label: "Any workplace type" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const DATE_OPTIONS: { value: JobSearchFilters["datePostedDays"] | 0; label: string }[] = [
  { value: 0, label: "Any time" },
  { value: 1, label: "Past 24 hours" },
  { value: 3, label: "Past 3 days" },
  { value: 7, label: "Past week" },
  { value: 14, label: "Past 2 weeks" },
];

/**
 * Search form covering the filters common across all three sources, per
 * the implementation plan's job-search notes: keyword and location are
 * uniformly supported, experience level is LinkedIn-native and a
 * best-effort post-filter elsewhere, workplace type is HiringCafe-native,
 * date posted is Indeed-native (and also applied to the LinkedIn URL).
 */
export function JobSearchForm({ onSearch, isSearching }: JobSearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<JobSearchFilters["experienceLevel"] | "">("");
  const [workplaceType, setWorkplaceType] =
    useState<JobSearchFilters["workplaceType"] | "">("");
  const [datePostedDays, setDatePostedDays] = useState<number>(0);
  const [platforms, setPlatforms] = useState<Set<JobSourcePlatform>>(
    new Set(["LINKEDIN", "INDEED", "HIRINGCAFE"]),
  );

  function togglePlatform(platform: JobSourcePlatform) {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || platforms.size === 0) return;

    onSearch(
      {
        keyword: keyword.trim(),
        location: location.trim() || undefined,
        experienceLevel: experienceLevel || undefined,
        workplaceType: workplaceType || undefined,
        datePostedDays: (datePostedDays || undefined) as JobSearchFilters["datePostedDays"],
        limit: 25,
      },
      Array.from(platforms),
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Job title or keywords (required)"
              required
              className="rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (city, state, or country)"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as typeof experienceLevel)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              aria-label="Experience level"
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={workplaceType}
              onChange={(e) => setWorkplaceType(e.target.value as typeof workplaceType)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              aria-label="Workplace type"
            >
              {WORKPLACE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={datePostedDays}
              onChange={(e) => setDatePostedDays(Number(e.target.value))}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              aria-label="Date posted"
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              {(Object.keys(PLATFORM_LABELS) as JobSourcePlatform[]).map((platform) => (
                <label key={platform} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={platforms.has(platform)}
                    onChange={() => togglePlatform(platform)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  {PLATFORM_LABELS[platform]}
                </label>
              ))}
            </div>

            <Button type="submit" disabled={isSearching || platforms.size === 0}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              {isSearching ? "Searching…" : "Search Jobs"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
