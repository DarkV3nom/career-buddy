import type { JobStatus } from "@career-assistant/db";
import { Briefcase, Send, Clock3, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { ComponentType } from "react";

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

// One calm icon per stage -- shared between the dashboard's stat cards and
// the kanban board's column headers, so the same stage always reads the
// same way everywhere in the app.
export const JOB_STATUS_ICON: Record<JobStatus, ComponentType<{ className?: string }>> = {
  AVAILABLE_TO_APPLY: Briefcase,
  TO_BE_APPLIED: Clock3,
  APPLIED: Send,
  IN_PROGRESS: HelpCircle,
  REJECTED: XCircle,
  NO_ANSWER: CheckCircle2,
};

// Per-stage "pipeline gradient" -- ui-ux-pro-max's Sales Intelligence
// Dashboard reference calls for a stage-color gradient on kanban column
// headers and a matching status border on each card, rather than flat
// grey columns. Built from the app's own design tokens (globals.css)
// instead of new colors, so it stays consistent with the rest of the UI.
export const JOB_STATUS_HEADER_GRADIENT: Record<JobStatus, string> = {
  AVAILABLE_TO_APPLY: "from-secondary/20 via-secondary/5 to-transparent",
  TO_BE_APPLIED: "from-warning/20 via-warning/5 to-transparent",
  APPLIED: "from-accent/20 via-accent/5 to-transparent",
  IN_PROGRESS: "from-primary/20 via-primary/5 to-transparent",
  REJECTED: "from-destructive/15 via-destructive/5 to-transparent",
  NO_ANSWER: "from-muted-foreground/15 via-muted-foreground/5 to-transparent",
};

export const JOB_STATUS_BORDER: Record<JobStatus, string> = {
  AVAILABLE_TO_APPLY: "border-l-secondary",
  TO_BE_APPLIED: "border-l-warning",
  APPLIED: "border-l-accent",
  IN_PROGRESS: "border-l-primary",
  REJECTED: "border-l-destructive",
  NO_ANSWER: "border-l-muted-foreground",
};

// Pastel icon-badge treatment for the dashboard's stat cards (reference:
// Findex-style dashboard, soft tinted circle behind each metric's icon).
export const JOB_STATUS_BADGE_BG: Record<JobStatus, string> = {
  AVAILABLE_TO_APPLY: "bg-secondary/15 text-secondary",
  TO_BE_APPLIED: "bg-warning/15 text-warning",
  APPLIED: "bg-accent/15 text-accent",
  IN_PROGRESS: "bg-primary/15 text-primary",
  REJECTED: "bg-destructive/15 text-destructive",
  NO_ANSWER: "bg-muted-foreground/15 text-muted-foreground",
};

// Same 6 colors, as hex, for the SVG charts (Applications bar chart, job
// source donut) where Tailwind classes can't drive `fill`/`stroke`
// directly. Kept as the literal values behind this file's CSS variables
// (see globals.css) rather than trying to read the variables at runtime.
export const JOB_STATUS_HEX: Record<JobStatus, string> = {
  AVAILABLE_TO_APPLY: "#2563EB",
  TO_BE_APPLIED: "#B45309",
  APPLIED: "#16A34A",
  IN_PROGRESS: "#1E3A5F",
  REJECTED: "#DC2626",
  NO_ANSWER: "#64748B",
};

// Source colors for the "where did this come from" donut -- distinct from
// the status palette above so the two charts never look like they're
// showing the same thing.
export const JOB_SOURCE_HEX: Record<string, string> = {
  LINKEDIN: "#2563EB",
  INDEED: "#16A34A",
  HIRINGCAFE: "#B45309",
  MANUAL: "#64748B",
};

export const JOB_SOURCE_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  HIRINGCAFE: "Hiring.cafe",
  MANUAL: "Manual",
};
