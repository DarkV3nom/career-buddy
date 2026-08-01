// Shared between apps/web/lib/router and apps/web/lib/guardrail so the
// message-persistence layer (Section 4 `messages.mode`, `task_runs`) and
// the UI (mode selector, context panel) all agree on the same mode set.

export const ROUTER_MODES = [
  "resume_optimize",
  "cover_letter",
  "career_coach",
  "interview_prep",
  "writing_style",
  "task_6_1",
  "task_6_2",
  "task_6_3",
  "task_6_4",
  "task_6_5",
  "task_6_6",
  "task_6_7",
  "task_6_8",
  "task_6_9",
  "task_6_10",
  "task_6_11",
  "task_6_12",
  "task_6_13",
  "task_6_14",
  "task_6_15",
  "task_6_16",
  "task_6_17",
  "task_6_18",
  "task_6_19",
  "task_6_20",
] as const;

export type RouterMode = (typeof ROUTER_MODES)[number];

export interface RouterContext {
  hasResume: boolean;
  hasJobDescription: boolean;
  hasStarStories: boolean;
}

export interface RouterResult {
  mode: RouterMode;
  confidence: number; // 0-1
  missingInfo: string[]; // non-empty => orchestrator asks instead of generating
  reasoning?: string; // short internal note, not shown to the user
}

export interface ComposedPrompt {
  system: string;
  mode: RouterMode;
  playbookSource: string; // which prompt file(s) were injected, for task_runs logging
}
