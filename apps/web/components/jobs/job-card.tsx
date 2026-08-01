"use client";

import { ExternalLink, MapPin, DollarSign, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_STATUSES, JOB_STATUS_LABELS, JOB_STATUS_BADGE_VARIANT } from "./status-labels";
import type { JobCardData } from "./job-types";
import type { JobStatus } from "@career-assistant/db";

const SOURCE_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  HIRINGCAFE: "Hiring.cafe",
  MANUAL: "Manual",
};

interface JobCardProps {
  job: JobCardData;
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onInterested: (job: JobCardData) => void;
}

export function JobCard({ job, onStatusChange, onInterested }: JobCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <CardHeader className="gap-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">{job.roleTitle ?? "Untitled role"}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {SOURCE_LABELS[job.source] ?? job.source}
          </Badge>
        </div>
        <p className="text-xs font-medium text-muted-foreground">{job.companyName ?? "Unknown company"}</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 pt-0 text-xs text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {job.location}
            {job.workplaceType && ` · ${job.workplaceType}`}
          </span>
        )}
        {job.salaryText && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" aria-hidden="true" />
            {job.salaryText}
          </span>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between gap-2">
            <select
              value={job.status}
              onChange={(e) => onStatusChange(job.id, e.target.value as JobStatus)}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
              aria-label="Status"
            >
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {JOB_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <Badge variant={JOB_STATUS_BADGE_VARIANT[job.status]} className="shrink-0">
              {JOB_STATUS_LABELS[job.status]}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onInterested(job)}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Interested
            </Button>
            {job.externalUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" aria-label="Open original listing">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
