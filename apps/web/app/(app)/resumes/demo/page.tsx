import { ResumeEditor } from "@/components/resume-editor/resume-editor";
import type { DiffSegment, AtsChecklistState } from "@/components/resume-editor/types";

// Demo route with representative sample data so the split-view editor is
// visually reachable before real /api/resumes wiring exists. Replace with
// server-fetched resume_versions data once that route is built.
const sampleOriginal = `Managed customer accounts and handled support tickets.
Worked with the engineering team on product improvements.`;

const sampleSegments: DiffSegment[] = [
  { type: "unchanged", text: "Managed " },
  { type: "addition", text: "key enterprise customer accounts", triggeringKeyword: "enterprise" },
  { type: "unchanged", text: ", improving retention and " },
  { type: "removal", text: "handling support tickets" },
  { type: "addition", text: "resolving 40+ support tickets weekly", triggeringKeyword: "customer support" },
  { type: "unchanged", text: ".\nCollaborated with the engineering team on " },
  { type: "addition", text: "product roadmap prioritization", triggeringKeyword: "cross-functional" },
  { type: "unchanged", text: "." },
];

const sampleChecklist: AtsChecklistState = {
  standardHeadings: true,
  singleColumn: true,
  searchableText: true,
  keywordsMatchRole: true,
  datesAndTitlesClear: true,
  skillsRelevant: true,
  noUnsupportedClaims: false,
  appropriateLength: true,
};

export default function ResumeDemoPage() {
  return (
    <ResumeEditor
      originalText={sampleOriginal}
      optimizedSegments={sampleSegments}
      atsChecklist={sampleChecklist}
      versionLabel="ATS-optimized v2"
    />
  );
}
