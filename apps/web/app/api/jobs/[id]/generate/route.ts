import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@career-assistant/db";
import { composeSystemPrompt } from "@/lib/router/composer";
import { generateText } from "@/lib/generation/generate";
import { runGuardrailPass, toGuardrailLog } from "@/lib/guardrail";

// POST /api/jobs/[id]/generate -- the "click Interested, tell me what you
// need" workflow. Runs one or more of the existing router modes
// (resume_optimize / cover_letter / task_6_9) against the job's stored JD
// text, through the same Prompt Composer and Guardrail Diff Engine used
// everywhere else in the app -- this endpoint is not a separate
// generation path, it's the job-board entry point into the same pipeline
// Sections 1/2/6.9 already define.

const OUTPUT_TYPES = ["resume", "cover_letter", "message"] as const;
type OutputType = (typeof OUTPUT_TYPES)[number];

const MESSAGE_TYPES = [
  "recruiter_email",
  "linkedin_message",
  "referral_request",
  "follow_up",
] as const;

const requestSchema = z.object({
  outputs: z.array(z.enum(OUTPUT_TYPES)).min(1),
  messageType: z.enum(MESSAGE_TYPES).optional().default("recruiter_email"),
});

interface RouteParams {
  params: { id: string };
}

const GENERATION_INSTRUCTIONS: Record<OutputType, (messageType?: string) => string> = {
  resume: () =>
    "Optimize this candidate's resume for the target job description in the context above, following the ATS Optimization process. Return only the optimized resume content, structured by section (Professional Summary, Core Skills, Professional Experience, Education). Do not include commentary before or after the resume itself.",
  cover_letter: () =>
    "Write a complete, ready-to-send cover letter for this candidate for the target job description in the context above, following the cover letter structure (opening, value proposition, evidence, closing). Return only the letter itself.",
  message: (messageType) =>
    `Write a ${(messageType ?? "recruiter_email").replace(/_/g, " ")} for this candidate regarding the target job description in the context above. Return only the message text, ready to send.`,
};

const MODE_FOR_OUTPUT: Record<OutputType, "resume_optimize" | "cover_letter" | "task_6_9"> = {
  resume: "resume_optimize",
  cover_letter: "cover_letter",
  message: "task_6_9",
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { outputs, messageType } = parsed.data;

  const job = await prisma.jobDescription.findUnique({ where: { id: params.id } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Most recent resume on file is the ground truth for this generation --
  // same candidate-context pattern the chat composer already uses.
  const resume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const groundTruth = {
    resumeText: resume?.parsedText ?? null,
    candidateProfileSummary: null,
    conversationFacts: null,
  };

  const results: Record<string, unknown> = {};

  for (const output of outputs) {
    const mode = MODE_FOR_OUTPUT[output];
    const composed = await composeSystemPrompt(mode, {
      resumeText: resume?.parsedText,
      jobDescriptionText: job.rawText,
    });

    const rawText = await generateText(
      composed.system,
      GENERATION_INSTRUCTIONS[output](output === "message" ? messageType : undefined),
    );

    const guardrail = await runGuardrailPass(rawText, groundTruth);
    const guardrailLog = toGuardrailLog(guardrail);

    if (output === "resume") {
      if (!resume) {
        results.resume = { error: "No resume on file yet -- upload one before generating an optimized version." };
        continue;
      }
      const version = await prisma.resumeVersion.create({
        data: {
          resumeId: resume.id,
          jobDescriptionId: job.id,
          versionLabel: `${job.companyName ?? "Untitled"} — ATS-optimized`,
          contentJson: { markdown: guardrail.annotatedText },
        },
      });
      results.resume = { version, guardrail: guardrailLog };
    } else if (output === "cover_letter") {
      const coverLetter = await prisma.coverLetter.create({
        data: {
          userId,
          jobDescriptionId: job.id,
          resumeVersionId: null,
          content: guardrail.annotatedText,
        },
      });
      results.coverLetter = { coverLetter, guardrail: guardrailLog };
    } else {
      const message = await prisma.outreachMessage.create({
        data: {
          userId,
          jobDescriptionId: job.id,
          messageType,
          content: guardrail.annotatedText,
        },
      });
      results.message = { message, guardrail: guardrailLog };
    }
  }

  return NextResponse.json({ results });
}
