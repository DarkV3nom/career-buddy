import type { JobSource, JobStatus } from "@career-assistant/db";

// Shape of a job_descriptions row as it comes back over the API (dates
// arrive as ISO strings via JSON, not Date objects).
export interface JobCardData {
  id: string;
  source: JobSource;
  companyName: string | null;
  roleTitle: string | null;
  location: string | null;
  workplaceType: string | null;
  salaryText: string | null;
  experienceLevel: string | null;
  externalUrl: string | null;
  postedAt: string | null;
  scrapedAt: string | null;
  status: JobStatus;
  notes: string | null;
  // The API route (`/api/jobs`) does an unfiltered `findMany`, so these
  // come back on every row even though earlier code never typed them.
  // `updatedAt` is Prisma's `@updatedAt` -- it bumps on every PATCH,
  // including status changes, so it's the closest real signal we have to
  // "when this got tagged" for the dashboard's activity feed/chart.
  createdAt: string;
  updatedAt: string;
  // Also always present on the API response (rawText is a required
  // column) -- the full scraped/entered job description, used server-side
  // for resume/cover-letter generation. Now also read here for the job
  // card's short description snippet (truncated client-side, see
  // job-card.tsx's stripAndTruncate).
  rawText: string;
  // Populated by the keyword-extraction step that runs during resume/
  // cover-letter generation (see Interested workflow) -- null on a job
  // that hasn't gone through that yet, which is most freshly-scraped
  // jobs. Used as real skill tags when available; job-card.tsx falls
  // back to source/status tags when it's null rather than inventing
  // skills.
  extractedKeywords: { required?: string[]; preferred?: string[]; tools?: string[] } | null;
}
