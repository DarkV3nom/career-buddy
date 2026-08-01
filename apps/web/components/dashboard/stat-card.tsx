"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_STATUS_BADGE_BG } from "@/components/jobs/status-labels";
import type { JobCardData } from "@/components/jobs/job-types";
import type { JobStatus } from "@career-assistant/db";
import type { ComponentType } from "react";

interface StatCardProps {
  status: JobStatus;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
  sharePct: number | null;
  jobs: JobCardData[];
  isActive: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

/**
 * Reference-inspired stat card (Findex dashboard): pastel icon badge, big
 * number, and instead of a fabricated "+17% last week" (we have no
 * historical snapshots to compute a real delta from), a real, honestly
 * computed "share of total" pill. Hover reveals a quick preview of the
 * jobs behind the number; click filters the Jobs Feed table below to just
 * this status -- both read from data already on the page, no extra fetch.
 */
export function StatCard({
  status,
  label,
  icon: Icon,
  count,
  sharePct,
  jobs,
  isActive,
  isLoading,
  onSelect,
}: StatCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const preview = jobs.slice(0, 4);
  const remaining = jobs.length - preview.length;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left"
        aria-pressed={isActive}
        aria-label={`${label}: ${count} jobs. Filter feed to this status.`}
      >
        <Card
          className={`flex flex-col justify-between overflow-hidden border transition-shadow hover:shadow-md ${
            isActive ? "ring-2 ring-primary" : ""
          }`}
        >
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              {label}
            </CardTitle>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${JOB_STATUS_BADGE_BG[status]}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl" aria-live="polite">
                {isLoading ? "—" : count}
              </p>
              {sharePct !== null && count > 0 && (
                <span className="mb-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {sharePct}% of total
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </button>

      {isHovering && jobs.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border bg-card p-2 text-xs shadow-lg">
          <ul className="flex flex-col gap-1">
            {preview.map((job) => (
              <li key={job.id} className="truncate text-foreground">
                <span className="font-medium">{job.roleTitle ?? "Untitled role"}</span>
                <span className="text-muted-foreground"> · {job.companyName ?? "Unknown company"}</span>
              </li>
            ))}
          </ul>
          {remaining > 0 && (
            <p className="mt-1 border-t border-border pt-1 text-muted-foreground">+{remaining} more — click to view all</p>
          )}
        </div>
      )}
    </div>
  );
}
