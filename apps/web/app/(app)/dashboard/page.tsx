"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  JOB_STATUS_ICON,
  JOB_STATUS_HEADER_GRADIENT,
} from "@/components/jobs/status-labels";
import { StatusBoard } from "@/components/jobs/status-board";
import { InterestedModal } from "@/components/jobs/interested-modal";
import type { JobCardData } from "@/components/jobs/job-types";
import type { JobStatus } from "@career-assistant/db";

// TODO: replace with the real authenticated user ID once Supabase Auth is
// wired up -- matches DEV_USER_ID in app/(app)/jobs/page.tsx. Must be a
// real row in `users` (job_descriptions.user_id is a uuid FK) -- seeded
// via migration 0003_seed_dev_user.
const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

type StatsResponse = {
  counts: Record<JobStatus, number>;
  total: number;
  updatedAt: string;
};

function formatUpdatedAt(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestedJob, setInterestedJob] = useState<JobCardData | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, jobsRes] = await Promise.all([
        fetch("/api/jobs/stats", { headers: { "x-user-id": DEV_USER_ID } }),
        fetch("/api/jobs", { headers: { "x-user-id": DEV_USER_ID } }),
      ]);

      if (!statsRes.ok || !jobsRes.ok) {
        const failed = !statsRes.ok ? statsRes : jobsRes;
        let message = "Couldn't load your pipeline data.";
        try {
          const data = await failed.json();
          message = data.error ?? message;
        } catch {
          // Non-JSON error body (e.g. a raw 500 page) -- fall back to the default message.
        }
        setError(message);
        return;
      }

      const statsData = await statsRes.json();
      const jobsData = await jobsRes.json();
      setStats(statsData);
      setJobs(jobsData.jobs ?? []);
    } catch {
      setError("Couldn't load your pipeline data. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleStatusChange(jobId: string, status: JobStatus) {
    // Optimistic update -- dragging a card between columns should feel
    // instant; the stat cards recompute from `jobs`, so they update too.
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function handleInterested(job: JobCardData) {
    setInterestedJob(job);
    if (job.status === "AVAILABLE_TO_APPLY") {
      handleStatusChange(job.id, "TO_BE_APPLIED");
    }
  }

  // Stat cards read from `jobs` (kept in sync by drag-and-drop) rather
  // than re-fetching /api/jobs/stats on every move, so the counts update
  // instantly instead of lagging a round trip behind the board.
  const counts = JOB_STATUSES.reduce(
    (acc, status) => {
      acc[status] = jobs.filter((j) => j.status === status).length;
      return acc;
    },
    {} as Record<JobStatus, number>,
  );
  const total = jobs.length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pipeline Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {stats
              ? `${total} job${total === 1 ? "" : "s"} tracked · updated ${formatUpdatedAt(stats.updatedAt)}`
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
          <Button variant="outline" size="sm" onClick={loadAll} disabled={isLoading}>
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
          const Icon = JOB_STATUS_ICON[status];
          const count = counts[status] ?? 0;
          return (
            <Card
              key={status}
              className={`flex flex-col justify-between overflow-hidden border bg-gradient-to-br ${JOB_STATUS_HEADER_GRADIENT[status]}`}
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {JOB_STATUS_LABELS[status]}
                </CardTitle>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-sm">
                  <Icon className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
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

      {total === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No jobs tracked yet. Head to the job search to find roles and start tagging progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Pipeline board</h2>
          <p className="-mt-1 text-xs text-muted-foreground">Drag a card between columns, or use the dropdown on each card.</p>
          <StatusBoard jobs={jobs} onStatusChange={handleStatusChange} onInterested={handleInterested} />
        </div>
      )}

      {interestedJob && (
        <InterestedModal job={interestedJob} userId={DEV_USER_ID} onClose={() => setInterestedJob(null)} />
      )}
    </div>
  );
}
