"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, JOB_STATUS_BADGE_VARIANT } from "@/components/jobs/status-labels";
import type { JobCardData } from "@/components/jobs/job-types";
import type { JobStatus } from "@career-assistant/db";

interface JobsFeedTableProps {
  jobs: JobCardData[];
  filterStatus: JobStatus | null;
  filterLabel: string | null;
  onClearFilter: () => void;
  limit?: number;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function companyInitial(name: string | null) {
  return (name ?? "?").trim().charAt(0).toUpperCase() || "?";
}

/**
 * "Jobs Feed" -- recently seen/updated jobs, newest first (by
 * updatedAt, which bumps on every status change, so an application you
 * just tagged today surfaces above one you scraped last week and haven't
 * touched since). Clicking a dashboard stat card sets `filterStatus`,
 * which narrows this table instead of opening a separate view.
 */
export function JobsFeedTable({ jobs, filterStatus, filterLabel, onClearFilter, limit = 8 }: JobsFeedTableProps) {
  const filtered = filterStatus ? jobs.filter((j) => j.status === filterStatus) : jobs;
  const sorted = [...filtered].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const rows = sorted.slice(0, limit);

  return (
    <div className="flex flex-col gap-3">
      {filterStatus && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Filtered to <Badge variant={JOB_STATUS_BADGE_VARIANT[filterStatus]}>{filterLabel}</Badge>
          <Button variant="ghost" size="sm" onClick={onClearFilter} className="h-6 px-2 text-xs">
            <X className="h-3 w-3" aria-hidden="true" />
            Clear
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filterStatus ? "No jobs with this status yet." : "No jobs tracked yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Company</th>
                <th className="pb-2 pr-3 font-medium">Job Type</th>
                <th className="pb-2 pr-3 font-medium">Role</th>
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">Experience</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => (
                <tr key={job.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {companyInitial(job.companyName)}
                      </span>
                      <span className="truncate font-medium text-foreground">{job.companyName ?? "Unknown"}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 capitalize text-muted-foreground">{job.workplaceType ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-foreground">{job.roleTitle ?? "Untitled role"}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(job.scrapedAt ?? job.postedAt)}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{job.experienceLevel ?? "—"}</td>
                  <td className="py-2.5">
                    <Badge variant={JOB_STATUS_BADGE_VARIANT[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
