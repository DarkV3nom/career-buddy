import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  ROUTER_MODES,
  type RouterContext,
  type RouterResult,
} from "@career-assistant/shared-types";

// Intent Router — classifies a user turn against the Mode Router table
// (implementation plan, Section 1.2) using Claude's structured tool-use
// output rather than the source doc's literal trigger-phrase table, since
// real user phrasing is messier than a keyword match. See
// packages/prompts/base-framework.md for why this result feeds a
// short-circuit ("missing_info non-empty -> ask, don't generate") instead
// of always calling the main generation prompt.

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fast/cheap model for classification only — the expensive model is
// reserved for the Prompt Composer's generation call.
const ROUTER_MODEL = process.env.ROUTER_MODEL ?? "claude-3-5-haiku-latest";

const classifyIntentTool: Anthropic.Tool = {
  name: "classify_intent",
  description:
    "Classify the user's request into exactly one Career Application Assistant mode, and flag any information that's required before the mode's playbook can run.",
  input_schema: {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: [...ROUTER_MODES],
        description: "The single best-matching mode for this request.",
      },
      confidence: {
        type: "number",
        description: "0-1 confidence that this is the correct mode.",
      },
      missing_info: {
        type: "array",
        items: { type: "string" },
        description:
          "Specific questions to ask the user before generation can proceed accurately (e.g. 'target job title', 'job description text'). Empty array if nothing is missing.",
      },
      reasoning: {
        type: "string",
        description:
          "One sentence on why this mode was chosen. Not shown to the user.",
      },
    },
    required: ["mode", "confidence", "missing_info"],
  },
};

const routerResultSchema = z.object({
  mode: z.enum(ROUTER_MODES),
  confidence: z.number().min(0).max(1),
  missing_info: z.array(z.string()),
  reasoning: z.string().optional(),
});

const MODE_ROUTER_TABLE = `
| Trigger / request sounds like | Mode |
|---|---|
| "build me a resume," "resume-builder," no resume exists yet | resume_optimize |
| "optimize my resume," "resume-optimizer," "ats-check," "will this pass ATS" | resume_optimize |
| "cover-letter-writer," "write a cover letter," "cover letter for this job" | cover_letter |
| "career-coach," LinkedIn help, job search strategy, networking, recruiter messages | career_coach |
| "interview-prep," STAR stories, mock interview, behavioral questions | interview_prep |
| Writing quality, editing, rewriting existing content | writing_style |
| Job description analysis | task_6_1 |
| Resume gap analysis | task_6_2 |
| Career transition planning | task_6_3 |
| Personal branding strategy | task_6_4 |
| LinkedIn content strategy | task_6_5 |
| Networking strategy | task_6_6 |
| Recruiter communication support | task_6_7 |
| Cover letter customization (quick version) | task_6_8 |
| Professional email/message writing | task_6_9 |
| Portfolio and project review | task_6_10 |
| Salary negotiation preparation | task_6_11 |
| Offer evaluation support | task_6_12 |
| Career development planning | task_6_13 |
| Skill development roadmap | task_6_14 |
| Job search optimization | task_6_15 |
| Executive career support | task_6_16 |
| Freelance/consulting profile development | task_6_17 |
| Performance review and promotion support | task_6_18 |
| Workplace communication coaching | task_6_19 |
| Career research and market insights | task_6_20 |
`.trim();

function buildRouterSystemPrompt(context: RouterContext): string {
  return `You are the intent router for a career-application assistant. Classify the user's message into exactly one mode using the table below. If a request spans more than one mode (e.g. "optimize my resume and write a cover letter"), pick the FIRST relevant mode — the app runs modes in sequence turn by turn, it does not blend them into one response.

${MODE_ROUTER_TABLE}

Known context for this conversation:
- Resume on file: ${context.hasResume ? "yes" : "no"}
- Job description on file: ${context.hasJobDescription ? "yes" : "no"}
- STAR story library: ${context.hasStarStories ? "has entries" : "empty"}

Flag missing_info when the chosen mode cannot run accurately without
something the user hasn't provided yet (e.g. resume_optimize with no
resume on file and none pasted in this message, or cover_letter with no
target job description). Do not flag missing_info for things that are
merely nice-to-have.`;
}

export async function classifyIntent(
  userMessage: string,
  context: RouterContext,
): Promise<RouterResult> {
  const response = await anthropic.messages.create({
    model: ROUTER_MODEL,
    max_tokens: 512,
    system: buildRouterSystemPrompt(context),
    tools: [classifyIntentTool],
    tool_choice: { type: "tool", name: "classify_intent" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    // Should not happen with tool_choice forced, but fail closed rather
    // than guessing a mode.
    throw new Error("Router did not return a tool_use block");
  }

  const parsed = routerResultSchema.parse(toolUse.input);

  return {
    mode: parsed.mode,
    confidence: parsed.confidence,
    missingInfo: parsed.missing_info,
    reasoning: parsed.reasoning,
  };
}
