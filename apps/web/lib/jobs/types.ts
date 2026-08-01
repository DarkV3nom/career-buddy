// Common shape every source normalizes into. See normalize.ts for the
// per-actor mapping -- field names below were confirmed against real
// sample output from each actor (curious_coder/linkedin-jobs-scraper,
// valig/indeed-jobs-scraper, memo23/apify-hiring-cafe-scraper), not
// guessed from their input schemas.

export type JobSourcePlatform = "LINKEDIN" | "INDEED" | "HIRINGCAFE";

export interface ScrapedJob {
  source: JobSourcePlatform;
  externalId: string;
  externalUrl: string;
  title: string;
  companyName: string | null;
  location: string | null;
  workplaceType: string | null; // remote | hybrid | onsite, when known
  salaryText: string | null;
  experienceLevel: string | null; // best-effort, not uniformly available -- see normalize.ts
  postedAt: string | null; // ISO date string
  rawText: string; // full description, used as the JobDescription.rawText for the generation pipeline
}

// Filters common to the search form. Not every field maps to every
// platform -- see apify-client.ts for what each source actually supports
// versus what gets applied as a post-filter.
export interface JobSearchFilters {
  keyword: string;
  location?: string;
  /** LinkedIn native levels; applied as a post-filter (substring match
   * against seniority/description) for Indeed and HiringCafe, which don't
   * expose this as a structured input. */
  experienceLevel?:
    | "internship"
    | "entry_level"
    | "associate"
    | "mid_senior_level"
    | "director"
    | "executive";
  workplaceType?: "remote" | "hybrid" | "onsite"; // HiringCafe native; post-filter elsewhere
  datePostedDays?: 1 | 3 | 7 | 14; // Indeed native; post-filter elsewhere
  limit?: number; // per-platform result cap
}

export interface JobSearchRequest {
  filters: JobSearchFilters;
  platforms: JobSourcePlatform[];
}
