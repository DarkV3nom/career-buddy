"use client";

import { ExternalLink, MapPin, Sparkles, GripVertical, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "./company-avatar";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  JOB_STATUS_BADGE_VARIANT,
  JOB_STATUS_BORDER,
  JOB_SOURCE_LABELS,
} from "./status-labels";
import { stripHtml, truncate, flattenKeywords } from "@/lib/jobs/text";
import type { JobCardData } from "./job-types";
import type { JobStatus } from "@career-assistant/db";

interface JobCardProps {
  job: JobCardData;
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onInterested: (job: JobCardData) => void;
  /** Kanban context: adds a drag handle and native HTML5 drag-and-drop. */
  draggable?: boolean;
  onDragStart?: (job: JobCardData) => void;
  onDragEnd?: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Job result card, matching the reference's listing layout: logo,
 * title/company, a seniority/job-type/salary badge row, a short
 * description snippet, a tag row, then date published + actions.
 *
 * Description snippet comes from `rawText` (the full scraped JD, always
 * present -- see job-types.ts), HTML-stripped and truncated client-side,
 * not a separate summary field (none exists). Tags come from
 * `extractedKeywords` when the keyword-extraction step has run for this
 * job (skills actually found in the JD); when it hasn't, the tag row
 * falls back to source + status instead of inventing skills.
 *
 * "Job type" only ever shows workplace type (remote/hybrid/onsite) --
 * the scrapers don't capture full-time/part-time employment type at all,
 * so rather than guess "Full-Time" the way the reference does, that
 * badge is simply omitted when workplaceType is null.
 */
export function JobCard({
  job,
  onStatusChange,
  onInterested,
  draggable = false,
  onDragStart,
  onDragEnd,
}: JobCardProps) {
  const dateLabel = formatDate(job.postedAt ?? job.scrapedAt);
  const description = job.rawText ? truncate(stripHtml(job.rawText), 160) : null;
  const skillTags = flattenKeywords(job.extractedKeywords);

  return (
    <Card
      draggable={draggable}
      onDragStart={draggable ? () => onDragStart?.(job) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={`flex flex-col gap-3 border-l-4 transition-shadow hover:shadow-md ${JOB_STATUS_BORDER[job.status]} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <CardHeader className="flex-row items-start gap-3 space-y-0 pb-0">
        {draggable && (
          <GripVertical className="mt-3 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        )}
        <CompanyAvatar name={job.companyName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-snug text-foreground">
            {job.roleTitle ?? "Untitled role"}
          </p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {job.companyName ?? "Unknown company"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {job.location}
          </span>
        )}

        {/* Seniority / job type / salary -- always 3 slots for visual
            consistency, with an explicit "not disclosed" instead of just
            hiding the salary slot when it's missing. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
          {job.experienceLevel && <span className="text-foreground">{job.experienceLevel}</span>}
          {job.workplaceType && <span className="capitalize text-muted-foreground">{job.workplaceType}</span>}
          <span className={job.salaryText ? "text-accent" : "italic text-muted-foreground"}>
            {job.salaryText ?? "Salary not disclosed"}
          </span>
        </div>

        {description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {skillTags.length > 0 ? (
            skillTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))
          ) : (
            <>
              <Badge variant="outline" className="text-[10px]">
                {JOB_SOURCE_LABELS[job.source] ?? job.source}
              </Badge>
              <Badge variant={JOB_STATUS_BADGE_VARIANT[job.status]} className="text-[10px]">
                {JOB_STATUS_LABELS[job.status]}
              </Badge>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <select
            value={job.status}
            onChange={(e) => onStatusChange(job.id, e.target.value as JobStatus)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            aria-label="Status"
          >
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {JOB_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between gap-2">
            {dateLabel ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {dateLabel}
              </span>
            ) : (
              <span />
            )}
            <div className="flex gap-1.5">
              {job.externalUrl && (
                <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                  <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" aria-label="Open original listing">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => onInterested(job)}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Interested
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
