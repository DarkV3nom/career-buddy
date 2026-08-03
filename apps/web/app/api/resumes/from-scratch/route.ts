import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@career-assistant/db";
import { composeSystemPrompt } from "@/lib/router/composer";
import { generateText } from "@/lib/generation/generate";
import { runGuardrailPass, toGuardrailLog } from "@/lib/guardrail";

// POST /api/resumes/from-scratch -- the "Create Resume -> From Scratch"
// flow's backend. Takes the 6 answers collected by the guided Q&A
// (components/chat/create-resume/from-scratch-qa.tsx) and runs them
// through the same Prompt Composer + Guardrail Diff Engine pipeline
// already used by /api/jobs/[id]/generate, rather than a separate ad hoc
// generation path.
//
// Unlike the job-apply generate route (which optimizes an *existing*
// resume against a job description), there's no prior resume here -- the
// candidate's answers ARE the ground truth. Those answers are passed to
// the guardrail pass as `conversationFacts` (a real field on
// GroundTruth, meant for exactly this: "anything the candidate stated
// explicitly in-chat"), so the fact-checker correctly treats what the
// person just told us as supported, and only flags anything the model
// added beyond that.

const requestSchema = z.object({
  targetJob: z.string().trim().optional(),
  targetRole: z.string().trim().min(1, "Target role is required"),
  experienceLevel: z.string().trim().min(1, "Experience level is required"),
  workExperience: z.string().trim().min(1, "Work experience is required"),
  education: z.string().trim().min(1, "Education background is required"),
  contact: z.object({
    fullName: z.string().trim().min(1, "Full name is required"),
    // Free text -- "email, phone, LinkedIn, whatever you'd like to
    // include" is asked as one question in the Q&A flow (see
    // from-scratch-qa.tsx), not split into separate fields the person has
    // to fill in one at a time. An email is best-effort extracted from it
    // below for the user record; the raw text still goes into the resume
    // itself so nothing the person typed gets silently dropped.
    details: z.string().trim().optional(),
  }),
});

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// The exact markdown shape lib/documents/resume-content.ts's
// parseMarkdownToResumeContent() parses into docx sections -- headings
// matched case-insensitively, experience as "**Title** — Employer" then
// bullets, education as "Degree | Institution", skills as
// "Category: item, item". Deviating from this means the download button
// silently produces a worse docx, so it's spelled out explicitly rather
// than left to the model's own formatting instincts.
const OUTPUT_FORMAT_SPEC = `Output Format (follow this exactly -- it is parsed programmatically, not just displayed as text):

# Full Name

## Summary
2-3 sentences positioning the candidate for the target role.

## Skills
Category One: item, item, item
Category Two: item, item, item

## Experience
**Job Title** — Employer Name
- Achievement-focused bullet (Action Verb + What + How + Result)
- Another bullet

## Education
Degree | Institution
- Optional detail (honors, relevant coursework, GPA if given)

## Projects
Only include this section if the candidate described a project separate from their work experience.
Project Title
- Bullet describing the project and outcome

Do not include any commentary, preamble, or sign-off before or after the resume itself -- return only the resume content in this structure.`;

function buildUserInstruction(data: z.infer<typeof requestSchema>): string {
  const contactLine = [data.contact.fullName, data.contact.details].filter(Boolean).join(" | ");

  return `Act as an experienced resume writer and career coach. Build a complete, ATS-friendly resume from scratch for this candidate, following the Step 4-12 resume-building process in the playbook above (structure, professional summary, skills, achievement-focused experience bullets, ATS compliance).

Audience: hiring managers and recruiters who will screen this resume, and the ATS software that parses it before a human sees it.

Tone: professional and confident, without generic filler or clichés.

Here is everything the candidate has told me about themselves -- this is the complete and only source of truth. Do not invent any employer, title, skill, metric, or credential beyond what's given here; if the candidate's answer is thin in a section, keep that section proportionally shorter rather than padding it with invented specifics.

Target job / company: ${data.targetJob || "Not specified -- keep the resume general-purpose rather than tailoring keywords to a specific posting."}
Target role: ${data.targetRole}
Experience level: ${data.experienceLevel}
Work experience, projects, and other relevant experience (in the candidate's own words): ${data.workExperience}
Education background: ${data.education}
Contact details: ${contactLine}

${OUTPUT_FORMAT_SPEC}`;
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let composed;
  let rawText: string;
  try {
    composed = await composeSystemPrompt("resume_optimize", {
      jobDescriptionText: data.targetJob || undefined,
    });
    rawText = await generateText(composed.system, buildUserInstruction(data));
  } catch (err) {
    console.error("Resume-from-scratch generation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong generating your resume. Try again in a moment." },
      { status: 502 },
    );
  }

  if (!rawText.trim()) {
    return NextResponse.json(
      { error: "The model returned an empty response. Try again." },
      { status: 502 },
    );
  }

  // The candidate's own answers are the ground truth -- see file header.
  const conversationFacts = [
    `Name: ${data.contact.fullName}`,
    `Target role: ${data.targetRole}`,
    `Experience level: ${data.experienceLevel}`,
    `Work experience / projects: ${data.workExperience}`,
    `Education: ${data.education}`,
    data.targetJob ? `Target job/company: ${data.targetJob}` : null,
    data.contact.details ? `Contact details: ${data.contact.details}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const guardrail = await runGuardrailPass(rawText, { conversationFacts });
  const guardrailLog = toGuardrailLog(guardrail);

  const extractedEmail = data.contact.details?.match(EMAIL_PATTERN)?.[0];

  try {
    const [resume] = await prisma.$transaction([
      prisma.resume.create({
        data: {
          userId,
          sourceType: "built_from_scratch",
          parsedText: conversationFacts,
        },
      }),
      // Keep the candidate's stated name/target role on the user record --
      // the docx download route reads user.fullName/email directly and
      // candidateProfile.currentTitle for the headline, so without this the
      // downloaded file would still show the seeded placeholder ("Dev
      // User") instead of what was just entered.
      prisma.user.update({
        where: { id: userId },
        data: {
          fullName: data.contact.fullName,
          ...(extractedEmail ? { email: extractedEmail } : {}),
        },
      }),
      prisma.candidateProfile.upsert({
        where: { userId },
        create: { userId, currentTitle: data.targetRole },
        update: { currentTitle: data.targetRole },
      }),
    ]);

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        versionLabel: "Built from scratch",
        contentJson: { markdown: guardrail.annotatedText },
      },
    });

    return NextResponse.json({ resume, version, guardrail: guardrailLog });
  } catch (err) {
    // Most likely cause: the entered email collides with another user's
    // (email is unique) -- surface a clear message rather than a raw 500,
    // and note that the resume itself still generated fine.
    console.error("Resume-from-scratch persistence failed:", err);
    return NextResponse.json(
      {
        error:
          "Your resume was generated but couldn't be saved (the email you entered may already be in use). Try a different email.",
      },
      { status: 500 },
    );
  }
}
