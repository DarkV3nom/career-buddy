import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@career-assistant/db";
import { generateCoverLetterDocx } from "@/lib/documents/cover-letter-docx";

// GET /api/documents/cover-letter/[id]?format=docx -- streams a generated
// .docx cover letter. The generation pipeline returns the letter as a
// single flowing text block (salutation and sign-off included in the
// prose, per the cover-letter prompt), so this splits on blank lines into
// paragraphs rather than trying to fragile-parse out a separate
// recipient/salutation/signOff -- that keeps rendering robust across
// whatever structure the model actually produces.

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

  const coverLetter = await prisma.coverLetter.findUnique({
    where: { id: params.id },
    include: { user: true, jobDescription: true },
  });

  if (!coverLetter || !coverLetter.user) {
    return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
  }
  if (coverLetter.userId !== userId) {
    return NextResponse.json({ error: "Not authorized to access this cover letter" }, { status: 403 });
  }
  const user = coverLetter.user;

  const bodyParagraphs = coverLetter.content
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

  const buffer = await generateCoverLetterDocx({
    fullName: user.fullName ?? "Candidate",
    contactLine: user.email,
    date: new Date(coverLetter.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    bodyParagraphs,
  });

  const filenameBase = [user.fullName ?? "cover-letter", coverLetter.jobDescription?.companyName]
    .filter(Boolean)
    .join(" - ")
    .replace(/[^a-z0-9 _-]/gi, "")
    .trim() || "cover-letter";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filenameBase}.docx"`,
    },
  });
}
