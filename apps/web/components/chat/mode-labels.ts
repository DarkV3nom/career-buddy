import type { RouterMode } from "@career-assistant/shared-types";

// Human-readable labels for the mode selector rail + "Other Tasks"
// dropdown. Keys must cover every RouterMode — TypeScript enforces that
// via the Record type below, so adding a new mode to shared-types without
// a label here is a type error, not a silent UI gap.
export const MODE_LABELS: Record<RouterMode, string> = {
  resume_optimize: "Resume / ATS Optimizer",
  cover_letter: "Cover Letter",
  career_coach: "Career Coach",
  interview_prep: "Interview Prep",
  writing_style: "Writing Review",
  task_6_1: "Job Description Analysis",
  task_6_2: "Resume Gap Analysis",
  task_6_3: "Career Transition Planning",
  task_6_4: "Personal Branding Strategy",
  task_6_5: "LinkedIn Content Strategy",
  task_6_6: "Networking Strategy",
  task_6_7: "Recruiter Communication",
  task_6_8: "Cover Letter (Quick)",
  task_6_9: "Professional Email/Message",
  task_6_10: "Portfolio & Project Review",
  task_6_11: "Salary Negotiation Prep",
  task_6_12: "Offer Evaluation",
  task_6_13: "Career Development Plan",
  task_6_14: "Skill Development Roadmap",
  task_6_15: "Job Search Optimization",
  task_6_16: "Executive Career Support",
  task_6_17: "Freelance/Consulting Profile",
  task_6_18: "Performance Review & Promotion",
  task_6_19: "Workplace Communication Coaching",
  task_6_20: "Career Research & Market Insights",
};

// The four primary rail buttons (Section 3.4). Everything else — including
// writing_style — lives in the "Other Tasks" dropdown.
export const PRIMARY_RAIL_MODES: RouterMode[] = [
  "resume_optimize",
  "cover_letter",
  "career_coach",
  "interview_prep",
];

export const OTHER_TASK_MODES: RouterMode[] = [
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
];
