import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@career-assistant/db";
import { generateResumeDocx } from "@/lib/documents/resume-docx";
import { parseMarkdownToResumeContent } from "@/lib/documents/resume-content";

// GET /api/documents/resume/[id]?format=docx -- streams a generated .docx
// for the given ResumeVersion, styled after the Jake's Resume TECH /
// Calibri / US Letter template. PDF export is intentionally not
// implemented yet -- the user asked for docx first, "add PDF later".
//
// contentJson today is { markdown: string } (see generate/route.ts).
// parseMarkdownToResumeContent() does a best-effort parse into the
// structured shape the docx generator needs; once the generation prompt
// is updated to emit structured JSON directly, swap this for a direct
// read of contentJson.

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Accepts x-user-id header (fetch calls) or ?userId= query param
  // (plain <a href> downloads can't set custom headers). Same
  // placeholder-auth pattern as the rest of the job pipeline --
  // swap for the real Supabase session once auth is wired up.
  const userId = req.headers.get("x-user-id") ?? req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") ?? "docx";
  if (format !== "docx") {
    return NextResponse.json(
      { error: "Only format=docx is supported today. PDF export is planned." },
      { status: 400 },
    );
  }

  const version = await prisma.resumeVersion.findUnique({
    where: { id: params.id },
    include: { resume: { include: { user: { include: { candidateProfile: true } } } }, jobDescription: true },
  });

  if (!version || !version.resume || !version.resume.user) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }
  if (version.resume.userId !== userId) {
    return NextResponse.json({ error: "Not authorized to access this resume" }, { status: 403 });
  }

  const markdown = (version.contentJson as { markdown?: string } | null)?.markdown;
  if (!markdown) {
    return NextResponse.json(
      { error: "This resume version has no generated content yet." },
      { status: 422 },
    );
  }

  const user = version.resume.user;
  if (!user) {
    return NextResponse.json({ error: "Resume owner not found" }, { status: 404 });
  }
  const content = parseMarkdownToResumeContent(markdown, user.fullName ?? "Candidate");
  content.contact.email = user.email;
  if (user.candidateProfile?.currentTitle) {
    content.contact.headline = user.candidateProfile.currentTitle;
  }

  const buffer = await generateResumeDocx(content);
  const filenameBase = [user.fullName ?? "resume", version.jobDescription?.companyName]
    .filter(Boolean)
    .join(" - ")
    .replace(/[^a-z0-9 _-]/gi, "")
    .trim() || "resume";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filenameBase}.docx"`,
    },
  });
}
