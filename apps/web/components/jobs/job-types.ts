import type { JobSource, JobStatus } from "@prisma/client";

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
}
