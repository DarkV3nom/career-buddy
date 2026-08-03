import type { JobSearchFilters, JobSourcePlatform } from "./types";

export const PLATFORM_LABELS: Record<JobSourcePlatform, string> = {
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  HIRINGCAFE: "Hiring.cafe",
};

// Labels show years of experience (what people actually think in) instead
// of LinkedIn's internal level jargon. The underlying `value` is unchanged
// -- LinkedIn's own filter is level-based (mapped to its f_E codes in
// linkedin-url-builder.ts), and Indeed/HiringCafe only support this as a
// best-effort text match against free-text seniority (normalize.ts), so
// there's no actor that actually accepts a numeric years value. These
// ranges are the commonly-cited approximation for each LinkedIn level.
export const EXPERIENCE_OPTIONS: { value: NonNullable<JobSearchFilters["experienceLevel"]> | ""; label: string }[] = [
  { value: "", label: "Any experience level" },
  { value: "internship", label: "Internship / student" },
  { value: "entry_level", label: "0–2 years" },
  { value: "associate", label: "2–4 years" },
  { value: "mid_senior_level", label: "4–8 years" },
  { value: "director", label: "8–12 years" },
  { value: "executive", label: "12+ years" },
];

export const WORKPLACE_OPTIONS: { value: NonNullable<JobSearchFilters["workplaceType"]> | ""; label: string }[] = [
  { value: "", label: "Any workplace type" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

export const DATE_OPTIONS: { value: JobSearchFilters["datePostedDays"] | 0; label: string }[] = [
  { value: 0, label: "Any time" },
  { value: 1, label: "Past 24 hours" },
  { value: 3, label: "Past 3 days" },
  { value: 7, label: "Past week" },
  { value: 14, label: "Past 2 weeks" },
];
