"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  JOB_STATUS_ICON,
  JOB_SOURCE_HEX,
  JOB_SOURCE_LABELS,
} from "@/components/jobs/status-labels";
import { StatCard } from "@/components/dashboard/stat-card";
import { ApplicationsBarChart } from "@/components/dashboard/applications-bar-chart";
import { SourceDonutChart } from "@/components/dashboard/source-donut-chart";
import { JobsFeedTable } from "@/components/dashboard/jobs-feed-table";
import { StatusBoard } from "@/components/jobs/status-board";
import { InterestedModal } from "@/components/jobs/interested-modal";
import type { JobCardData } from "@/components/jobs/job-types";
import type { JobStatus, JobSource } from "@career-assistant/db";

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

// "Applied or further along" -- the closest real signal we have to a
// submitted application, since the pipeline doesn't record a distinct
// appliedAt timestamp. Used both for the weekly bar chart and its label.
const APPLIED_OR_LATER: JobStatus[] = ["APPLIED", "IN_PROGRESS", "REJECTED", "NO_ANSWER"];

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Buckets the last `weeks` calendar weeks (Sun-Sat), oldest first, so the
// bar chart reads left-to-right like a timeline. Each job lands in the
// bucket matching its updatedAt -- for applied+ jobs, that's the last time
// its status changed, which is the best available proxy for "when this
// became an application" without a dedicated appliedAt column.
function buildWeeklyBuckets(jobs: JobCardData[], weeks: number) {
  const now = new Date();
  const bucketStarts: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const s = startOfWeek(now);
    s.setDate(s.getDate() - i * 7);
    bucketStarts.push(s);
  }

  const applied = jobs.filter((j) => APPLIED_OR_LATER.includes(j.status));

  return bucketStarts.map((start, idx) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const count = applied.filter((j) => {
      const ts = j.updatedAt ? new Date(j.updatedAt) : null;
      return ts && ts >= start && ts < end;
    }).length;
    const label =
      idx === bucketStarts.length - 1
        ? "This week"
        : start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { label, count };
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestedJob, setInterestedJob] = useState<JobCardData | null>(null);
  const [feedFilter, setFeedFilter] = useState<JobStatus | null>(null);

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

  const weeklyBuckets = useMemo(() => buildWeeklyBuckets(jobs, 4), [jobs]);

  const sourceBreakdown = useMemo(() => {
    const sources: JobSource[] = ["LINKEDIN", "INDEED", "HIRINGCAFE", "MANUAL"];
    return sources.map((source) => ({
      key: source,
      label: JOB_SOURCE_LABELS[source],
      count: jobs.filter((j) => j.source === source).length,
      color: JOB_SOURCE_HEX[source],
    }));
  }, [jobs]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
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

      {/* Stat cards: 2 cols on phones, 3 on small tablets, 6 in one row
          from lg up. Hover a card for a quick preview of the jobs behind
          it; click to filter the Jobs Feed table further down. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {JOB_STATUSES.map((status) => {
          const count = counts[status] ?? 0;
          return (
            <StatCard
              key={status}
              status={status}
              label={JOB_STATUS_LABELS[status]}
              icon={JOB_STATUS_ICON[status]}
              count={count}
              sharePct={total > 0 ? Math.round((count / total) * 100) : null}
              jobs={jobs.filter((j) => j.status === status)}
              isActive={feedFilter === status}
              isLoading={isLoading && !stats}
              onSelect={() => setFeedFilter((prev) => (prev === status ? null : status))}
            />
          );
        })}
      </div>

      {/* Applications-over-time + source breakdown, side by side on
          desktop, stacked on mobile -- same two-panel layout as the
          reference dashboard's "Applications Statistics" / "Impressions"
          row. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Applications by Week</CardTitle>
            <p className="text-xs text-muted-foreground">
              Jobs moved to Applied or further, last 4 weeks
            </p>
          </CardHeader>
          <CardContent>
            <ApplicationsBarChart data={weeklyBuckets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Jobs by Source</CardTitle>
            <p className="text-xs text-muted-foreground">Where everything you're tracking came from</p>
          </CardHeader>
          <CardContent>
            <SourceDonutChart data={sourceBreakdown} total={total} />
          </CardContent>
        </Card>
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
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Jobs Feed</CardTitle>
              <p className="text-xs text-muted-foreground">Most recently updated first</p>
            </CardHeader>
            <CardContent>
              <JobsFeedTable
                jobs={jobs}
                filterStatus={feedFilter}
                filterLabel={feedFilter ? JOB_STATUS_LABELS[feedFilter] : null}
                onClearFilter={() => setFeedFilter(null)}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-foreground">Pipeline board</h2>
            <p className="-mt-1 text-xs text-muted-foreground">Drag a card between columns, or use the dropdown on each card.</p>
            <StatusBoard jobs={jobs} onStatusChange={handleStatusChange} onInterested={handleInterested} />
          </div>
        </>
      )}

      {interestedJob && (
        <InterestedModal job={interestedJob} userId={DEV_USER_ID} onClose={() => setInterestedJob(null)} />
      )}
    </div>
  );
}
