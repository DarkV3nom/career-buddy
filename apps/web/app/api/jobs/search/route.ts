import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@career-assistant/db";
import { searchJobs } from "@/lib/jobs/apify-client";
import type { JobSearchRequest } from "@/lib/jobs/types";

// POST /api/jobs/search
// Runs the requested Apify actors, normalizes results, and upserts them
// into job_descriptions (status defaults to AVAILABLE_TO_APPLY -- see the
// JobStatus enum in schema.prisma). Dedup is by externalUrl: re-running a
// search with overlapping results updates scrapedAt rather than creating
// duplicate rows, so the job board doesn't fill up with repeats every time
// someone searches the same query.
//
// NOTE: this endpoint calls paid Apify actors (fractions of a cent per
// result, see the pricing notes in lib/jobs/apify-client.ts) -- it's a
// deliberate user action (the search form's submit button), never called
// automatically on page load or on a schedule.

const requestSchema = z.object({
  filters: z.object({
    keyword: z.string().min(1),
    location: z.string().optional(),
    experienceLevel: z
      .enum([
        "internship",
        "entry_level",
        "associate",
        "mid_senior_level",
        "director",
        "executive",
      ])
      .optional(),
    workplaceType: z.enum(["remote", "hybrid", "onsite"]).optional(),
    datePostedDays: z.union([z.literal(1), z.literal(3), z.literal(7), z.literal(14)]).optional(),
    limit: z.number().int().positive().max(100).optional(),
  }),
  platforms: z.array(z.enum(["LINKEDIN", "INDEED", "HIRINGCAFE"])).min(1),
});

export async function POST(req: NextRequest) {
  // TODO: replace with the authenticated user's ID once Supabase Auth is
  // wired up (see the implementation plan, Section 2.1). Every write below
  // is scoped to userId so swapping this one line is the only change
  // needed once auth exists.
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { filters, platforms } = parsed.data as JobSearchRequest;

  const results = await searchJobs(filters, platforms);
  const now = new Date();

  const upserted = await Promise.all(
    results.flatMap((result) =>
      result.jobs.map((job) =>
        prisma.jobDescription.upsert({
          where: { externalUrl: job.externalUrl },
          create: {
            userId,
            source: job.source,
            externalId: job.externalId,
            externalUrl: job.externalUrl,
            companyName: job.companyName,
            roleTitle: job.title,
            rawText: job.rawText,
            location: job.location,
            workplaceType: job.workplaceType,
            salaryText: job.salaryText,
            experienceLevel: job.experienceLevel,
            postedAt: job.postedAt ? new Date(job.postedAt) : null,
            scrapedAt: now,
            status: "AVAILABLE_TO_APPLY",
          },
          update: {
            // Refresh content in case the listing changed, but never touch
            // status/notes -- those are the user's own pipeline tracking
            // and a re-search should never silently reset progress.
            rawText: job.rawText,
            salaryText: job.salaryText,
            scrapedAt: now,
          },
        }),
      ),
    ),
  );

  const errors = results.filter((r) => r.error).map((r) => ({ platform: r.platform, error: r.error }));

  return NextResponse.json({
    jobs: upserted,
    resultCounts: results.map((r) => ({ platform: r.platform, count: r.jobs.length })),
    errors: errors.length > 0 ? errors : undefined,
  });
}
