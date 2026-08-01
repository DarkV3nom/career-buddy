import fs from "node:fs/promises";
import path from "node:path";
import type { ComposedPrompt, RouterMode } from "@career-assistant/shared-types";

// Prompt Composer — assembles the final system prompt from three layers:
//   1. base-framework.md (immutable constraints, always first)
//   2. the active mode's playbook (packages/prompts/section-*.md)
//   3. retrieved candidate context (resume / JD / STAR stories already on
//      file), injected as data, never as instructions
// Section 5 (Writing Style Standard) is appended after the playbook for
// every mode except writing_style itself, per the source doc's own
// instruction that it "applies to everything you write in this skill...
// regardless of which mode you're in."
//
// Playbooks are read from disk rather than hardcoded in this file so a
// prompt-library edit doesn't require an app code deploy (implementation
// plan, Section 5.3). See next.config.js `outputFileTracingIncludes` —
// Vercel's serverless bundler needs to be told explicitly to include
// packages/prompts/**, since it lives outside apps/web and won't be
// auto-traced from a dynamic fs.readFile() call the way a static import
// would be.

const PROMPTS_ROOT = path.join(process.cwd(), "..", "..", "packages", "prompts");

const MODE_FILE_MAP: Record<RouterMode, string> = {
  resume_optimize: "section-1-resume.md",
  cover_letter: "section-2-cover-letter.md",
  career_coach: "section-3-career-coach.md",
  interview_prep: "section-4-interview-prep.md",
  writing_style: "section-5-writing-style.md",
  task_6_1: "section-6/6.1-job-description-analysis.md",
  task_6_2: "section-6/6.2-resume-gap-analysis.md",
  task_6_3: "section-6/6.3-career-transition-planning.md",
  task_6_4: "section-6/6.4-personal-branding-strategy.md",
  task_6_5: "section-6/6.5-linkedin-content-strategy.md",
  task_6_6: "section-6/6.6-networking-strategy.md",
  task_6_7: "section-6/6.7-recruiter-communication-support.md",
  task_6_8: "section-6/6.8-cover-letter-customization.md",
  task_6_9: "section-6/6.9-professional-email-and-message-writing.md",
  task_6_10: "section-6/6.10-portfolio-and-project-review.md",
  task_6_11: "section-6/6.11-salary-negotiation-preparation.md",
  task_6_12: "section-6/6.12-offer-evaluation-support.md",
  task_6_13: "section-6/6.13-career-development-planning.md",
  task_6_14: "section-6/6.14-skill-development-roadmap.md",
  task_6_15: "section-6/6.15-job-search-optimization.md",
  task_6_16: "section-6/6.16-executive-career-support.md",
  task_6_17: "section-6/6.17-freelance-and-consulting-profile-development.md",
  task_6_18: "section-6/6.18-performance-review-and-promotion-support.md",
  task_6_19: "section-6/6.19-workplace-communication-coaching.md",
  task_6_20: "section-6/6.20-career-research-and-market-insights.md",
};

export interface CandidateContext {
  resumeText?: string | null;
  jobDescriptionText?: string | null;
  activeStarStories?: Array<{ title: string; situation: string; task: string; action: string; result: string }>;
}

async function readPromptFile(relativePath: string): Promise<string> {
  const fullPath = path.join(PROMPTS_ROOT, relativePath);
  return fs.readFile(fullPath, "utf-8");
}

function buildContextBlock(context: CandidateContext): string {
  const parts: string[] = [];

  if (context.resumeText) {
    parts.push(
      `<candidate_resume>\n${context.resumeText}\n</candidate_resume>`,
    );
  }
  if (context.jobDescriptionText) {
    parts.push(
      `<target_job_description>\n${context.jobDescriptionText}\n</target_job_description>`,
    );
  }
  if (context.activeStarStories && context.activeStarStories.length > 0) {
    const stories = context.activeStarStories
      .map(
        (s) =>
          `- ${s.title}: Situation: ${s.situation} | Task: ${s.task} | Action: ${s.action} | Result: ${s.result}`,
      )
      .join("\n");
    parts.push(`<star_story_library>\n${stories}\n</star_story_library>`);
  }

  if (parts.length === 0) {
    return "<candidate_context>\nNo resume, job description, or STAR stories on file yet for this conversation.\n</candidate_context>";
  }

  return `<candidate_context>\nEverything below is ground truth for this candidate. Do not state anything as fact about their background that isn't present here or explicitly said in the conversation — this is what the Guardrail Diff Engine checks generated output against.\n\n${parts.join("\n\n")}\n</candidate_context>`;
}

export async function composeSystemPrompt(
  mode: RouterMode,
  context: CandidateContext,
): Promise<ComposedPrompt> {
  const playbookFile = MODE_FILE_MAP[mode];

  const [baseFramework, playbook] = await Promise.all([
    readPromptFile("base-framework.md"),
    readPromptFile(playbookFile),
  ]);

  const sections = [baseFramework, playbook];
  let playbookSource = `base-framework.md, ${playbookFile}`;

  if (mode !== "writing_style") {
    const writingStyle = await readPromptFile("section-5-writing-style.md");
    sections.push(writingStyle);
    playbookSource += ", section-5-writing-style.md";
  }

  sections.push(buildContextBlock(context));

  return {
    system: sections.join("\n\n---\n\n"),
    mode,
    playbookSource,
  };
}
