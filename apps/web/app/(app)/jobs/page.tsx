"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { StatusBoard } from "@/components/jobs/status-board";
import { InterestedModal } from "@/components/jobs/interested-modal";
import type { JobCardData } from "@/components/jobs/job-types";
import type { JobSearchFilters, JobSourcePlatform } from "@/lib/jobs/types";
import type { JobStatus } from "@prisma/client";

// TODO: replace with the real authenticated user ID once Supabase Auth is
// wired up -- see the matching TODO in app/api/jobs/search/route.ts. Kept
// as a single constant so it's a one-line swap.
const DEV_USER_ID = "dev-user";

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
      const data = await res.json();
      setJobs(data.jobs ?? []);
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
      const data = await res.json();
      if (!res.ok) {
        setSearchNote(data.error ?? "Search failed");
        return;
      }
      const counts = (data.resultCounts as { platform: string; count: number }[])
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Job Search</h1>
          <p className="text-sm text-muted-foreground">
            Search LinkedIn, Indeed, and Hiring.cafe, then track progress on the board below.
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

      <StatusBoard jobs={jobs} onStatusChange={handleStatusChange} onInterested={handleInterested} />

      {interestedJob && (
        <InterestedModal job={interestedJob} userId={DEV_USER_ID} onClose={() => setInterestedJob(null)} />
      )}
    </div>
  );
}
