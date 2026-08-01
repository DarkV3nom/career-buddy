import { NextRequest, NextResponse } from "next/server";
import { JOB_STATUSES } from "@/components/jobs/status-labels";
import { prisma, type JobStatus } from "@career-assistant/db";

// GET /api/jobs/stats -- counts per pipeline status for the dashboard.
// Always returns all six statuses (zero-filled), so the board never has a
// missing card just because a user hasn't tagged anything into that
// column yet.

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") ?? req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 401 });
  }

  const grouped = (await prisma.jobDescription.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  })) as { status: JobStatus; _count: { _all: number } }[];

  const counts = Object.fromEntries(JOB_STATUSES.map((status) => [status, 0])) as Record<
    JobStatus,
    number
  >;
  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return NextResponse.json({ counts, total, updatedAt: new Date().toISOString() });
}
