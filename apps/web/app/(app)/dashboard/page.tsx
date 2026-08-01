"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Briefcase, Send, Clock3, CheckCircle2, XCircle, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/components/jobs/status-labels";
import type { JobStatus } from "@career-assistant/db";

// TODO: replace with the real authenticated user ID once Supabase Auth is
// wired up -- matches DEV_USER_ID in app/(app)/jobs/page.tsx.
const DEV_USER_ID = "dev-user";

type StatsResponse = {
  counts: Record<JobStatus, number>;
  total: number;
  updatedAt: string;
};

// Calm, dashboard-appropriate icon + accent per status. Kept intentionally
// muted (no loud reds/greens beyond what the design tokens already define)
// so the board reads as a status overview, not an alert screen.
const STATUS_ICON: Record<JobStatus, React.ComponentType<{ className?: string }>> = {
  AVAILABLE_TO_APPLY: Briefcase,
  TO_BE_APPLIED: Clock3,
  APPLIED: Send,
  IN_PROGRESS: HelpCircle,
  REJECTED: XCircle,
  NO_ANSWER: CheckCircle2,
};

const STATUS_ACCENT: Record<JobStatus, string> = {
  AVAILABLE_TO_APPLY: "text-secondary-foreground bg-secondary",
  TO_BE_APPLIED: "text-warning-foreground bg-warning",
  APPLIED: "text-accent-foreground bg-accent",
  IN_PROGRESS: "text-primary-foreground bg-primary",
  REJECTED: "text-destructive-foreground bg-destructive",
  NO_ANSWER: "text-foreground bg-muted",
};

function formatUpdatedAt(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/stats", { headers: { "x-user-id": DEV_USER_ID } });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't load your pipeline stats.");
        return;
      }
      setStats(data);
    } catch {
      setError("Couldn't load your pipeline stats. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pipeline Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {stats
              ? `${stats.total} job${stats.total === 1 ? "" : "s"} tracked · updated ${formatUpdatedAt(stats.updatedAt)}`
              : "How your applications are moving, at a glance."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/jobs">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Job Search
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoading}>
            <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {JOB_STATUSES.map((status) => {
          const Icon = STATUS_ICON[status];
          const count = stats?.counts[status] ?? 0;
          return (
            <Card key={status} className="flex flex-col justify-between">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {JOB_STATUS_LABELS[status]}
                </CardTitle>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${STATUS_ACCENT[status]}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums text-foreground" aria-live="polite">
                  {isLoading && !stats ? "—" : count}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats && stats.total === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No jobs tracked yet. Head to the job search to find roles and start tagging progress.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
