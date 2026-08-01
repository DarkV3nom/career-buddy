"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUSES, JOB_STATUS_LABELS, JOB_STATUS_BADGE_VARIANT } from "./status-labels";
import { JobCard } from "./job-card";
import type { JobCardData } from "./job-types";
import type { JobStatus } from "@prisma/client";

interface StatusBoardProps {
  jobs: JobCardData[];
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onInterested: (job: JobCardData) => void;
}

/**
 * Six-column board, one per JobStatus -- the "tag on them as per
 * progress" view from the request. Each column scrolls independently so
 * a long AVAILABLE_TO_APPLY backlog doesn't push APPLIED/IN_PROGRESS off
 * screen. Status changes happen via the dropdown on each card rather than
 * drag-and-drop, which keeps this dependency-free and fully keyboard
 * accessible.
 */
export function StatusBoard({ jobs, onStatusChange, onInterested }: StatusBoardProps) {
  const grouped = JOB_STATUSES.map((status) => ({
    status,
    jobs: jobs.filter((job) => job.status === status),
  }));

  return (
    <div className="grid grid-flow-col auto-cols-[280px] gap-3 overflow-x-auto pb-2">
      {grouped.map(({ status, jobs: columnJobs }) => (
        <div key={status} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-foreground">{JOB_STATUS_LABELS[status]}</h3>
            <Badge variant={JOB_STATUS_BADGE_VARIANT[status]}>{columnJobs.length}</Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="flex flex-col gap-2 pr-2">
              {columnJobs.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">No jobs here yet</p>
              )}
              {columnJobs.map((job) => (
                <JobCard key={job.id} job={job} onStatusChange={onStatusChange} onInterested={onInterested} />
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
