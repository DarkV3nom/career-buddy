import { NextRequest, NextResponse } from "next/server";
import { JOB_STATUSES } from "@/components/jobs/status-labels";
import { prisma, type JobStatus } from "@career-assistant/db";

// GET /api/jobs?status=APPLIED -- list jobs for the board/dashboard.
// Omit ?status to get everything, grouped client-side. Always scoped to
// the requesting user (x-user-id header, same placeholder-auth pattern as
// /api/jobs/search until Supabase Auth replaces it).
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam && JOB_STATUSES.includes(statusParam as JobStatus)
      ? (statusParam as JobStatus)
      : undefined;

  const jobs = await prisma.jobDescription.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: [{ scrapedAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ jobs });
}
