"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, LayoutDashboard, SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { JobCard } from "@/components/jobs/job-card";
import { InterestedModal } from "@/components/jobs/interested-modal";
import type { JobCardData } from "@/components/jobs/job-types";
import type { JobSearchFilters, JobSourcePlatform } from "@/lib/jobs/types";
import type { JobStatus } from "@career-assistant/db";

// Errors above 500-only-HTML-page level (Vercel's default error page, a
// crashed function, etc.) aren't JSON -- res.json() throws on those. Without
// this, a real server error looked identical to "search found nothing."
async function parseJsonSafely(res: Response): Promise<{ data: unknown; ok: boolean }> {
  try {
    return { data: await res.json(), ok: true };
  } catch {
    return { data: null, ok: false };
  }
}

// TODO: replace with the real authenticated user ID once Supabase Auth is
// wired up -- see the matching TODO in app/api/jobs/search/route.ts. Kept
// as a single constant so it's a one-line swap. Must be a real row in
// `users` (job_descriptions.user_id is a uuid FK) -- seeded via migration
// 0003_seed_dev_user.
const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [interestedJob, setInterestedJob] = useState<JobCardData | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/jobs", { headers: { "x-user-id": DEV_USER_ID } });
      const { data, ok } = await parseJsonSafely(res);
      if (!res.ok || !ok) {
        setSearchNote("Couldn't load your jobs. Check your connection and try again.");
        return;
      }
      setJobs((data as { jobs?: JobCardData[] }).jobs ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function handleSearch(filters: JobSearchFilters, platforms: JobSourcePlatform[]) {
    setIsSearching(true);
    setSearchNote(null);
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": DEV_USER_ID },
        body: JSON.stringify({ filters, platforms }),
      });
      const { data, ok } = await parseJsonSafely(res);
      if (!res.ok || !ok) {
        const message = ok ? (data as { error?: string }).error : null;
        setSearchNote(message ?? "Search failed -- something went wrong on our end. Try again in a moment.");
        return;
      }
      const counts = (data as { resultCounts: { platform: string; count: number }[] }).resultCounts
        .map((r) => `${r.platform}: ${r.count}`)
        .join(", ");
      setSearchNote(`Found — ${counts}`);
      await loadJobs();
    } finally {
      setIsSearching(false);
    }
  }

  async function handleStatusChange(jobId: string, status: JobStatus) {
    // Optimistic update -- the board should feel instant when tagging
    // progress, which is the whole point of the status board.
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

  // This page is for finding and triaging roles, not tracking the whole
  // pipeline -- once something's APPLIED or further, it belongs on the
  // dashboard's status board instead. Newest listings first.
  const undecidedJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.status === "AVAILABLE_TO_APPLY" || j.status === "TO_BE_APPLIED")
        .sort((a, b) => (b.scrapedAt ?? "").localeCompare(a.scrapedAt ?? "")),
    [jobs],
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Job Search</h1>
          <p className="text-sm text-muted-foreground">
            Search LinkedIn, Indeed, and Hiring.cafe -- results to triage appear below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={loadJobs} disabled={isLoading}>
            <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      <JobSearchForm onSearch={handleSearch} isSearching={isSearching} />

      {searchNote && <p className="text-sm text-muted-foreground">{searchNote}</p>}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {undecidedJobs.length > 0 ? `${undecidedJobs.length} to review` : "Results"}
          </h2>
          {undecidedJobs.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Already applied or further along? Check the <Link href="/dashboard" className="underline underline-offset-2">dashboard</Link>.
            </p>
          )}
        </div>

        {undecidedJobs.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <SearchX className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Nothing to review yet. Run a search above to find roles.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {undecidedJobs.map((job) => (
              <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onInterested={handleInterested} />
            ))}
          </div>
        )}
      </div>

      {interestedJob && (
        <InterestedModal job={interestedJob} userId={DEV_USER_ID} onClose={() => setInterestedJob(null)} />
      )}
    </div>
  );
}
