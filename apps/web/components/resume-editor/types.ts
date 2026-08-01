// A resume version's diff, expressed as a flat sequence of segments so the
// UI never has to run its own text-diff algorithm — the resume_versions
// row (or the generation step that produces it) is the source of truth
// for what changed and why.
export type DiffSegmentType = "unchanged" | "addition" | "removal";

export interface DiffSegment {
  type: DiffSegmentType;
  text: string;
  /** Which JD keyword triggered this addition, if any — Section 1 Step 9
   * requires the model justify keyword insertions rather than stuffing
   * them invisibly. Only meaningful on "addition" segments. */
  triggeringKeyword?: string;
}

export interface AtsChecklistState {
  standardHeadings: boolean;
  singleColumn: boolean;
  searchableText: boolean;
  keywordsMatchRole: boolean;
  datesAndTitlesClear: boolean;
  skillsRelevant: boolean;
  noUnsupportedClaims: boolean;
  appropriateLength: boolean;
}

export const ATS_CHECKLIST_LABELS: Record<keyof AtsChecklistState, string> = {
  standardHeadings: "Resume uses standard headings",
  singleColumn: "Resume is single-column",
  searchableText: "Important information is searchable text",
  keywordsMatchRole: "Keywords match the target role",
  datesAndTitlesClear: "Dates and job titles are clear",
  skillsRelevant: "Skills are relevant",
  noUnsupportedClaims: "No unsupported claims added",
  appropriateLength: "Resume length is appropriate for experience level",
};
