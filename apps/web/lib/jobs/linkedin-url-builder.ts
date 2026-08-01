import type { JobSearchFilters } from "./types";

// LinkedIn's public jobs-search URL scheme. curious_coder/linkedin-jobs-scraper
// takes a finished search URL rather than structured filter params (see its
// input schema -- `urls: string[]`), so filters have to be encoded here.
// These query param codes are LinkedIn's own long-standing public scheme,
// not something the actor defines.
const EXPERIENCE_LEVEL_CODES: Record<
  NonNullable<JobSearchFilters["experienceLevel"]>,
  string
> = {
  internship: "1",
  entry_level: "2",
  associate: "3",
  mid_senior_level: "4",
  director: "5",
  executive: "6",
};

const WORKPLACE_TYPE_CODES: Record<
  NonNullable<JobSearchFilters["workplaceType"]>,
  string
> = {
  onsite: "1",
  remote: "2",
  hybrid: "3",
};

// f_TPR wants seconds-in-the-past, e.g. r86400 = last 24h.
const DATE_POSTED_SECONDS: Record<number, string> = {
  1: "r86400",
  3: "r259200",
  7: "r604800",
  14: "r1209600",
};

export function buildLinkedInSearchUrl(filters: JobSearchFilters): string {
  const params = new URLSearchParams();
  params.set("keywords", filters.keyword);

  if (filters.location) {
    params.set("location", filters.location);
  }
  if (filters.experienceLevel) {
    params.set("f_E", EXPERIENCE_LEVEL_CODES[filters.experienceLevel]);
  }
  if (filters.workplaceType) {
    params.set("f_WT", WORKPLACE_TYPE_CODES[filters.workplaceType]);
  }
  if (filters.datePostedDays) {
    const code = DATE_POSTED_SECONDS[filters.datePostedDays];
    if (code) params.set("f_TPR", code);
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}
