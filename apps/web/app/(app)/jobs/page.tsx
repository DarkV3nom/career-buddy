"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, LayoutDashboard, SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobSearchTopbar } from "@/components/jobs/job-search-topbar";
import { JobFiltersSidebar } from "@/components/jobs/job-filters-sidebar";
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

const DEFAULT_PLATFORMS: JobSourcePlatform[] = ["LINKEDIN", "INDEED", "HIRINGCAFE"];

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [interestedJob, setInterestedJob] = useState<JobCardData | null>(null);

  // Filter state lives here (not inside the topbar/sidebar components) so
  // both can stay controlled and share one source of truth for the search
  // request -- the sidebar sits in a different part of the page tree than
  // the topbar, so it can't hold its own local state the way the old
  // single-form version did.
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<JobSearchFilters["experienceLevel"] | "">("");
  const [workplaceType, setWorkplaceType] = useState<JobSearchFilters["workplaceType"] | "">("");
  const [datePostedDays, setDatePostedDays] = useState(0);
  const [platforms, setPlatforms] = useState<Set<JobSourcePlatform>>(new Set(DEFAULT_PLATFORMS));

  function togglePlatform(platform: JobSourcePlatform) {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  }

  function resetFilters() {
    setExperienceLevel("");
    setWorkplaceType("");
    setDatePostedDays(0);
    setPlatforms(new Set(DEFAULT_PLATFORMS));
  }

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

  async function handleSearch() {
    setIsSearching(true);
    setSearchNote(null);
    try {
      const filters: JobSearchFilters = {
        keyword: keyword.trim(),
        location: location.trim() || undefined,
        experienceLevel: experienceLevel || undefined,
        workplaceType: workplaceType || undefined,
        datePostedDays: (datePostedDays || undefined) as JobSearchFilters["datePostedDays"],
        limit: 25,
      };
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": DEV_USER_ID },
        body: JSON.stringify({ filters, platforms: Array.from(platforms) }),
      });
      const { data, ok } = await parseJsonSafely(res);
      if (!res.ok || !ok) {
        const message = ok ? (data as { error?: string }).error : null;
        setSearchNote(message ?? "Search failed -- something went wrong on our end. Try again in a moment.");
        return;
      }
      const body = data as {
        resultCounts: { platform: string; count: number }[];
        errors?: { platform: string; error: string }[];
      };
      const counts = body.resultCounts.map((r) => `${r.platform}: ${r.count}`).join(", ");
      // The backend already captures a per-platform error when one
      // source's Apify actor throws (rate limit, bad location, etc.) --
      // it just never made it into this message before, so a real error
      // on one platform looked identical to "found nothing there."
      const errorNote = body.errors?.length
        ? " — " + body.errors.map((e) => `${e.platform} failed: ${e.error}`).join("; ")
        : "";
      setSearchNote(`Found — ${counts}${errorNote}`);
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
    <div className="flex flex-col gap-4 p-4 sm:p-6">
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

      <JobSearchTopbar
        keyword={keyword}
        onKeywordChange={setKeyword}
        location={location}
        onLocationChange={setLocation}
        onSubmit={handleSearch}
        isSearching={isSearching}
        disabled={platforms.size === 0}
        disabledReason="Select at least one source in the filters panel"
      />

      {searchNote && <p className="text-sm text-muted-foreground">{searchNote}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <CardContent className="pt-4">
              <JobFiltersSidebar
                platforms={platforms}
                onTogglePlatform={togglePlatform}
                experienceLevel={experienceLevel}
                onExperienceLevelChange={setExperienceLevel}
                workplaceType={workplaceType}
                onWorkplaceTypeChange={setWorkplaceType}
                datePostedDays={datePostedDays}
                onDatePostedDaysChange={setDatePostedDays}
                onReset={resetFilters}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {undecidedJobs.length > 0 ? `${undecidedJobs.length} Jobs Found` : "Results"}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {undecidedJobs.map((job) => (
                <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onInterested={handleInterested} />
              ))}
            </div>
          )}
        </div>
      </div>

      {interestedJob && (
        <InterestedModal job={interestedJob} userId={DEV_USER_ID} onClose={() => setInterestedJob(null)} />
      )}
    </div>
  );
}
