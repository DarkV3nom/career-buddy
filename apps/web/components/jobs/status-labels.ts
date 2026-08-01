import type { JobStatus } from "@prisma/client";

// Matches the user's own wording for the pipeline stages exactly, so the
// UI reads the same way they described it: "available to apply, to be
// apply, applied, in progress, rejected, no answer."
export const JOB_STATUSES: JobStatus[] = [
  "AVAILABLE_TO_APPLY",
  "TO_BE_APPLIED",
  "APPLIED",
  "IN_PROGRESS",
  "REJECTED",
  "NO_ANSWER",
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  AVAILABLE_TO_APPLY: "Available to Apply",
  TO_BE_APPLIED: "To Be Applied",
  APPLIED: "Applied",
  IN_PROGRESS: "In Progress",
  REJECTED: "Rejected",
  NO_ANSWER: "No Answer",
};

// Badge variants map to components/ui/badge.tsx's variant prop.
export const JOB_STATUS_BADGE_VARIANT: Record<
  JobStatus,
  "default" | "secondary" | "accent" | "warning" | "destructive" | "outline"
> = {
  AVAILABLE_TO_APPLY: "secondary",
  TO_BE_APPLIED: "warning",
  APPLIED: "accent",
  IN_PROGRESS: "default",
  REJECTED: "destructive",
  NO_ANSWER: "outline",
};
