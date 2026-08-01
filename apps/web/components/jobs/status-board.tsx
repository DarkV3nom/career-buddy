"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  JOB_STATUS_BADGE_VARIANT,
  JOB_STATUS_HEADER_GRADIENT,
  JOB_STATUS_ICON,
} from "./status-labels";
import { JobCard } from "./job-card";
import type { JobCardData } from "./job-types";
import type { JobStatus } from "@career-assistant/db";

interface StatusBoardProps {
  jobs: JobCardData[];
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onInterested: (job: JobCardData) => void;
}

/**
 * Six-column pipeline board, one per JobStatus -- the "tag on them as per
 * progress" view from the request, styled after ui-ux-pro-max's Sales
 * Intelligence Dashboard reference: a stage-color gradient on each column
 * header and a matching accent border on every card (see status-labels.ts)
 * instead of flat grey columns.
 *
 * Cards are draggable between columns (native HTML5 drag-and-drop, no
 * extra dependency); the status dropdown on each card stays as the fully
 * keyboard-accessible fallback for anyone not using a mouse.
 */
export function StatusBoard({ jobs, onStatusChange, onInterested }: StatusBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<JobStatus | null>(null);

  const grouped = JOB_STATUSES.map((status) => ({
    status,
    jobs: jobs.filter((job) => job.status === status),
  }));

  function handleDrop(status: JobStatus) {
    if (draggingId) onStatusChange(draggingId, status);
    setDraggingId(null);
    setDragOverStatus(null);
  }

  return (
    // Columns are full-width-minus-a-peek on phones (auto-cols-[85vw], capped
    // at 320px so it doesn't balloon on small tablets), narrowing to a fixed
    // 280px from sm up where six of them can reasonably share the viewport.
    // snap-x turns the horizontal scroll into one-column-at-a-time paging on
    // touch instead of the old free-scroll, which made it easy to land
    // between two columns on mobile.
    <div className="grid grid-flow-col auto-cols-[min(85vw,320px)] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:auto-cols-[240px] sm:snap-none lg:auto-cols-[280px]">
      {grouped.map(({ status, jobs: columnJobs }) => {
        const Icon = JOB_STATUS_ICON[status];
        const isDropTarget = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((s: JobStatus | null) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(status);
            }}
            className={`flex snap-start flex-col gap-2 rounded-lg border bg-gradient-to-b p-2 transition-colors ${JOB_STATUS_HEADER_GRADIENT[status]} ${
              isDropTarget ? "border-primary ring-2 ring-primary/30" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between px-1 py-0.5">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {JOB_STATUS_LABELS[status]}
              </h3>
              <Badge variant={JOB_STATUS_BADGE_VARIANT[status]}>{columnJobs.length}</Badge>
            </div>
            {/* Fixed viewport-relative height, but capped with a min so it
                doesn't collapse to near-nothing on short mobile viewports
                once the header/stat-cards/search bar above eat into
                100vh -- 20rem was tuned for desktop and left almost no
                room on a phone in landscape or with the URL bar visible. */}
            <ScrollArea className="h-[max(50vh,20rem)] sm:h-[calc(100vh-20rem)]">
              <div className="flex flex-col gap-2 pr-2">
                {columnJobs.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    {isDropTarget ? "Drop here" : "No jobs here yet"}
                  </p>
                )}
                {columnJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={onStatusChange}
                    onInterested={onInterested}
                    draggable
                    onDragStart={(j) => setDraggingId(j.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverStatus(null);
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
