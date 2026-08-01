import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Guardrail Diff Engine — the code-level backstop for the single hardest
// constraint in base-framework.md: "never invent qualifications, skills,
// employers, metrics, dates, or experience." A system prompt alone can't
// be trusted for this at production scale (implementation plan, Section
// 1.2), so every generated response gets checked against the candidate's
// stored ground truth before it's treated as final.
//
// Design note on "streaming chunks": claim extraction needs complete
// sentences to be reliable — a metric or employer name can straddle a
// chunk boundary. So this module accumulates the full stream first, then
// runs one diff pass, rather than checking claims mid-stream. The user
// still sees the raw stream in real time in the UI; the guardrail pass
// runs as a fast follow-up against the buffered final text and the
// annotated version is what gets persisted to `messages.content`.

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GUARDRAIL_MODEL = process.env.GUARDRAIL_MODEL ?? "claude-3-5-haiku-latest";

export type ClaimCategory =
  | "skill"
  | "employer"
  | "title"
  | "metric"
  | "date"
  | "certification"
  | "other";

export interface GuardrailFlag {
  claim: string; // the exact substring from the generated text
  category: ClaimCategory;
  supported: boolean;
  reason: string; // why it was flagged, or confirmation it matched ground truth
}

export interface GroundTruth {
  resumeText?: string | null;
  candidateProfileSummary?: string | null; // e.g. "Title: X | Years: Y | Industry: Z"
  conversationFacts?: string | null; // anything the candidate stated explicitly in-chat
}

const claimReportSchema = z.object({
  claims: z.array(
    z.object({
      claim: z.string(),
      category: z.enum([
        "skill",
        "employer",
        "title",
        "metric",
        "date",
        "certification",
        "other",
      ]),
      supported: z.boolean(),
      reason: z.string(),
    }),
  ),
});

const reportClaimsTool: Anthropic.Tool = {
  name: "report_claims",
  description:
    "List every factual claim in the generated text about the candidate's background (skills, employers, titles, metrics, dates, certifications) and whether each is directly supported by the provided ground truth.",
  input_schema: {
    type: "object",
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim: {
              type: "string",
              description:
                "The exact substring from the generated text making the claim (verbatim, so it can be located and annotated).",
            },
            category: {
              type: "string",
              enum: [
                "skill",
                "employer",
                "title",
                "metric",
                "date",
                "certification",
                "other",
              ],
            },
            supported: {
              type: "boolean",
              description:
                "true only if this exact fact appears in or is a reasonable restatement of the ground truth. A plausible-sounding but unverified number or employer is NOT supported.",
            },
            reason: {
              type: "string",
              description:
                "One short sentence: what ground-truth text supports this, or why nothing does.",
            },
          },
          required: ["claim", "category", "supported", "reason"],
        },
      },
    },
    required: ["claims"],
  },
};

function buildGroundTruthBlock(groundTruth: GroundTruth): string {
  const parts: string[] = [];
  if (groundTruth.resumeText) parts.push(`Resume:\n${groundTruth.resumeText}`);
  if (groundTruth.candidateProfileSummary)
    parts.push(`Candidate profile:\n${groundTruth.candidateProfileSummary}`);
  if (groundTruth.conversationFacts)
    parts.push(`Stated in conversation:\n${groundTruth.conversationFacts}`);
  return parts.length > 0
    ? parts.join("\n\n")
    : "(No ground truth on file — treat every specific factual claim as unsupported.)";
}

/** Accumulate an async stream of text chunks (e.g. an Anthropic streaming
 * response) into the complete text the guardrail pass needs to check. */
export async function accumulateStream(
  chunks: AsyncIterable<string>,
): Promise<string> {
  let full = "";
  for await (const chunk of chunks) {
    full += chunk;
  }
  return full;
}

export async function checkClaims(
  generatedText: string,
  groundTruth: GroundTruth,
): Promise<GuardrailFlag[]> {
  const response = await anthropic.messages.create({
    model: GUARDRAIL_MODEL,
    max_tokens: 2048,
    system:
      "You are a fact-checker. You will be given ground-truth information about a job candidate and a piece of generated text (resume, cover letter, interview answer, etc.) about that same candidate. Report every specific factual claim about the candidate's background and whether it's supported.",
    tools: [reportClaimsTool],
    tool_choice: { type: "tool", name: "report_claims" },
    messages: [
      {
        role: "user",
        content: `<ground_truth>\n${buildGroundTruthBlock(groundTruth)}\n</ground_truth>\n\n<generated_text>\n${generatedText}\n</generated_text>`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) return [];

  const parsed = claimReportSchema.parse(toolUse.input);
  return parsed.claims;
}

export interface AnnotationResult {
  annotatedText: string;
  appliedFlags: GuardrailFlag[]; // unsupported claims successfully located and annotated
  unmatchedFlags: GuardrailFlag[]; // unsupported claims that couldn't be located verbatim (logged, not silently dropped)
}

/** Replace unsupported claims in the text with a bracketed confirmation
 * tag rather than silently deleting them — the person can confirm or
 * correct, per base-framework.md's "ask, don't assume" rule. */
export function annotateUnsupportedClaims(
  text: string,
  flags: GuardrailFlag[],
): AnnotationResult {
  let annotatedText = text;
  const appliedFlags: GuardrailFlag[] = [];
  const unmatchedFlags: GuardrailFlag[] = [];

  for (const flag of flags) {
    if (flag.supported) continue;

    const tag = `${flag.claim} [confirm: is this accurate? — flagged as unsupported by your resume/profile]`;

    if (annotatedText.includes(flag.claim)) {
      annotatedText = annotatedText.replace(flag.claim, tag);
      appliedFlags.push(flag);
    } else {
      // Model paraphrased rather than quoting verbatim — don't guess at a
      // fuzzy replace, just log it so it's visible in guardrail_flags even
      // though the inline text wasn't annotated.
      unmatchedFlags.push(flag);
    }
  }

  return { annotatedText, appliedFlags, unmatchedFlags };
}

export interface GuardrailPassResult {
  annotatedText: string;
  flags: GuardrailFlag[]; // full report, supported + unsupported, for guardrail_flags JSONB logging
  unsupportedCount: number;
}

/** Main entry point — run after a generation call completes (see the
 * streaming-accumulation note above). Returns the text with unsupported
 * claims annotated, plus the full flag list to persist to
 * `messages.guardrail_flags` and `task_runs`. */
export async function runGuardrailPass(
  generatedText: string,
  groundTruth: GroundTruth,
): Promise<GuardrailPassResult> {
  const flags = await checkClaims(generatedText, groundTruth);
  const { annotatedText, appliedFlags, unmatchedFlags } =
    annotateUnsupportedClaims(generatedText, flags);

  if (unmatchedFlags.length > 0) {
    // Non-fatal — still surfaced in the logged flags below so nothing is
    // silently lost, but worth knowing this happens if it's frequent in
    // practice (would suggest tightening the tool's "verbatim" instruction).
    console.warn(
      `Guardrail: ${unmatchedFlags.length} unsupported claim(s) could not be located verbatim in the output`,
      unmatchedFlags,
    );
  }

  return {
    annotatedText,
    flags,
    unsupportedCount: appliedFlags.length + unmatchedFlags.length,
  };
}

/** Shape persisted to messages.guardrail_flags / task_runs (Prisma Json
 * column) — kept as a plain function rather than a class so it serializes
 * with JSON.stringify with no surprises. */
export function toGuardrailLog(result: GuardrailPassResult) {
  return {
    unsupportedCount: result.unsupportedCount,
    flags: result.flags,
  };
}
