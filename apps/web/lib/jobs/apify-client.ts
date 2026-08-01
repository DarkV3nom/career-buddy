import { ApifyClient } from "apify-client";
import { buildLinkedInSearchUrl } from "./linkedin-url-builder";
import {
  normalizeLinkedInJob,
  normalizeIndeedJob,
  normalizeHiringCafeJob,
  matchesExperienceLevel,
} from "./normalize";
import type { JobSearchFilters, JobSourcePlatform, ScrapedJob } from "./types";

// Actor IDs confirmed via Apify Store lookup -- see the implementation
// notes in packages/prompts or the chat history for the console.apify.com
// links these came from.
const ACTOR_IDS = {
  LINKEDIN: "curious_coder/linkedin-jobs-scraper",
  INDEED: "valig/indeed-jobs-scraper",
  HIRINGCAFE: "memo23/apify-hiring-cafe-scraper",
} as const;

function getClient(): ApifyClient {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error(
      "APIFY_API_TOKEN is not set. Add it in Vercel's project environment variables.",
    );
  }
  return new ApifyClient({ token });
}

async function runAndCollect(
  actorId: string,
  input: Record<string, unknown>,
): Promise<unknown[]> {
  const client = getClient();
  const run = await client.actor(actorId).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
}

export async function searchLinkedInJobs(
  filters: JobSearchFilters,
): Promise<ScrapedJob[]> {
  const url = buildLinkedInSearchUrl(filters);
  // The actor rejects count < 10 outright (confirmed via a live test
  // call), so floor whatever limit the caller asked for.
  const count = Math.max(filters.limit ?? 25, 10);

  const items = await runAndCollect(ACTOR_IDS.LINKEDIN, {
    urls: [url],
    scrapeCompany: false,
    count,
  });

  return items
    .map((item) => normalizeLinkedInJob(item as never))
    .filter((job): job is ScrapedJob => job !== null);
}

export async function searchIndeedJobs(
  filters: JobSearchFilters,
): Promise<ScrapedJob[]> {
  const items = await runAndCollect(ACTOR_IDS.INDEED, {
    country: "us",
    title: filters.keyword,
    location: filters.location ?? "",
    limit: filters.limit ?? 25,
    ...(filters.datePostedDays
      ? { datePosted: String(filters.datePostedDays) }
      : {}),
  });

  const jobs = items
    .map((item) => normalizeIndeedJob(item as never))
    .filter((job): job is ScrapedJob => job !== null);

  // Indeed's actor has no experience-level input -- post-filter using the
  // same heuristic applied to HiringCafe results.
  return jobs.filter((job) => matchesExperienceLevel(job, filters.experienceLevel));
}

export async function searchHiringCafeJobs(
  filters: JobSearchFilters,
): Promise<ScrapedJob[]> {
  const items = await runAndCollect(ACTOR_IDS.HIRINGCAFE, {
    keyword: filters.keyword,
    location: filters.location ?? "United States",
    workplaceType: filters.workplaceType
      ? filters.workplaceType[0].toUpperCase() + filters.workplaceType.slice(1)
      : "Any",
    maxItems: filters.limit ?? 25,
    // Full description text, not just the requirements summary -- costs
    // one extra request per job but the generation pipeline needs the
    // real JD text, not a condensed paraphrase.
    enrichDescription: true,
  });

  const jobs = items
    .map((item) => normalizeHiringCafeJob(item as never))
    .filter((job): job is ScrapedJob => job !== null);

  return jobs.filter((job) => matchesExperienceLevel(job, filters.experienceLevel));
}

const SEARCH_FNS: Record<
  JobSourcePlatform,
  (filters: JobSearchFilters) => Promise<ScrapedJob[]>
> = {
  LINKEDIN: searchLinkedInJobs,
  INDEED: searchIndeedJobs,
  HIRINGCAFE: searchHiringCafeJobs,
};

export interface PlatformSearchResult {
  platform: JobSourcePlatform;
  jobs: ScrapedJob[];
  error?: string;
}

/** Runs the requested platforms in parallel. Each platform fails
 * independently -- one actor erroring (rate limit, bad location string,
 * etc.) shouldn't blank out results from the other two. */
export async function searchJobs(
  filters: JobSearchFilters,
  platforms: JobSourcePlatform[],
): Promise<PlatformSearchResult[]> {
  return Promise.all(
    platforms.map(async (platform) => {
      try {
        const jobs = await SEARCH_FNS[platform](filters);
        return { platform, jobs };
      } catch (err) {
        return {
          platform,
          jobs: [],
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }),
  );
}
