import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@career-assistant/db";
import { JOB_STATUSES } from "@/components/jobs/status-labels";

const patchSchema = z.object({
  status: z.enum(JOB_STATUSES as [string, ...string[]]).optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: { id: string };
}

// GET /api/jobs/[id] -- full job detail, used by the "Interested" panel
// to pull the stored JD text before generating a resume/cover letter.
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const job = await prisma.jobDescription.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

// PATCH /api/jobs/[id] -- status/notes updates from the board. This is the
// "tag on them as per progress" action -- deliberately narrow (only these
// two fields) so it can't accidentally overwrite scraped content.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const job = await prisma.jobDescription.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ job });
}
