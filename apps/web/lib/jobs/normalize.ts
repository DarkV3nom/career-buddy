import type { ScrapedJob, JobSearchFilters } from "./types";

// Field mappings below were confirmed against real sample output from each
// actor (one live test call per source, Aug 2026), not inferred from input
// schemas alone -- those only describe what you can search with, not what
// you get back.

// --- LinkedIn (curious_coder/linkedin-jobs-scraper) ---------------------
// Flat shape: id, link, title, companyName, location, postedAt, applyUrl,
// salary, descriptionText, seniorityLevel, employmentType, ...

interface LinkedInRawJob {
  id?: string;
  link?: string;
  title?: string;
  companyName?: string;
  location?: string;
  postedAt?: string;
  salary?: string;
  descriptionText?: string;
  seniorityLevel?: string;
}

export function normalizeLinkedInJob(raw: LinkedInRawJob): ScrapedJob | null {
  if (!raw.link || !raw.title) return null;
  return {
    source: "LINKEDIN",
    externalId: raw.id ?? raw.link,
    externalUrl: raw.link,
    title: raw.title,
    companyName: raw.companyName ?? null,
    location: raw.location ?? null,
    workplaceType: null, // not exposed by this actor's output
    salaryText: raw.salary && raw.salary.trim() ? raw.salary : null,
    experienceLevel:
      raw.seniorityLevel && raw.seniorityLevel !== "Not Applicable"
        ? raw.seniorityLevel
        : null,
    postedAt: raw.postedAt ?? null,
    rawText: raw.descriptionText ?? "",
  };
}

// --- Indeed (valig/indeed-jobs-scraper) ----------------------------------
// Nested shape: key, url, title, datePublished, location: {city,
// admin1Code, countryName}, employer: {name}, baseSalary: {min, max,
// unitOfWork, currencyCode}, description: {text, html}

interface IndeedRawJob {
  key?: string;
  url?: string;
  title?: string;
  datePublished?: string;
  location?: { city?: string; admin1Code?: string; countryName?: string };
  employer?: { name?: string };
  baseSalary?: {
    min?: number;
    max?: number;
    unitOfWork?: string;
    currencyCode?: string;
  };
  description?: { text?: string };
}

function formatIndeedSalary(salary: IndeedRawJob["baseSalary"]): string | null {
  if (!salary || (salary.min == null && salary.max == null)) return null;
  const currency = salary.currencyCode ?? "USD";
  const unit = salary.unitOfWork ? `/${salary.unitOfWork.toLowerCase()}` : "";
  if (salary.min != null && salary.max != null && salary.min !== salary.max) {
    return `${currency} ${salary.min.toLocaleString()}–${salary.max.toLocaleString()}${unit}`;
  }
  const value = salary.min ?? salary.max;
  return `${currency} ${value?.toLocaleString()}${unit}`;
}

export function normalizeIndeedJob(raw: IndeedRawJob): ScrapedJob | null {
  if (!raw.url || !raw.title) return null;
  const locationParts = [raw.location?.city, raw.location?.admin1Code].filter(
    Boolean,
  );
  return {
    source: "INDEED",
    externalId: raw.key ?? raw.url,
    externalUrl: raw.url,
    title: raw.title,
    companyName: raw.employer?.name ?? null,
    location: locationParts.length > 0 ? locationParts.join(", ") : null,
    workplaceType: null, // not exposed by this actor's output
    salaryText: formatIndeedSalary(raw.baseSalary),
    experienceLevel: null, // not exposed -- see JobSearchFilters.experienceLevel post-filter
    postedAt: raw.datePublished ?? null,
    rawText: raw.description?.text ?? "",
  };
}

// --- HiringCafe (memo23/apify-hiring-cafe-scraper) -----------------------
// Nested shape: id, apply_url, job_information: {title, description?},
// v5_processed_job_data: {company_name, formatted_workplace_location,
// workplace_type, seniority_level, yearly_min/max_compensation,
// listed_compensation_currency, estimated_publish_date, requirements_summary}

interface HiringCafeRawJob {
  id?: string;
  apply_url?: string;
  job_information?: { title?: string; description?: string };
  v5_processed_job_data?: {
    company_name?: string;
    formatted_workplace_location?: string;
    workplace_type?: string;
    seniority_level?: string;
    yearly_min_compensation?: number;
    yearly_max_compensation?: number;
    listed_compensation_currency?: string;
    estimated_publish_date?: string;
    requirements_summary?: string;
  };
}

function formatHiringCafeSalary(
  data: HiringCafeRawJob["v5_processed_job_data"],
): string | null {
  if (!data || (!data.yearly_min_compensation && !data.yearly_max_compensation))
    return null;
  const currency = data.listed_compensation_currency ?? "USD";
  const { yearly_min_compensation: min, yearly_max_compensation: max } = data;
  if (min && max && min !== max) {
    return `${currency} ${min.toLocaleString()}–${max.toLocaleString()}/year`;
  }
  return `${currency} ${(min ?? max)?.toLocaleString()}/year`;
}

export function normalizeHiringCafeJob(raw: HiringCafeRawJob): ScrapedJob | null {
  const title = raw.job_information?.title;
  if (!raw.apply_url || !title) return null;
  const data = raw.v5_processed_job_data;
  return {
    source: "HIRINGCAFE",
    externalId: raw.id ?? raw.apply_url,
    externalUrl: raw.apply_url,
    title,
    companyName: data?.company_name ?? null,
    location: data?.formatted_workplace_location ?? null,
    workplaceType: data?.workplace_type?.toLowerCase() ?? null,
    salaryText: formatHiringCafeSalary(data),
    experienceLevel: data?.seniority_level ?? null,
    postedAt: data?.estimated_publish_date ?? null,
    // Prefer the full description (only present when the actor's
    // enrichDescription input is on); fall back to the shorter
    // requirements summary otherwise.
    rawText: raw.job_information?.description ?? data?.requirements_summary ?? "",
  };
}

// --- Post-filtering for platforms without a native experience/date filter -

export function matchesExperienceLevel(
  job: ScrapedJob,
  level: JobSearchFilters["experienceLevel"],
): boolean {
  if (!level) return true;
  if (!job.experienceLevel) return true; // don't drop jobs we can't classify
  const normalized = job.experienceLevel.toLowerCase();
  const needle = level.replace(/_/g, "[ -]?");
  return new RegExp(needle, "i").test(normalized);
}
