// Structured shape a resume must be in before it can be rendered to .docx.
// The generation pipeline (lib/generation/generate.ts) currently produces
// resumeVersion.contentJson as { markdown: string }. For faithful docx
// rendering against the Jake's Resume template we need discrete fields
// instead of a markdown blob, so this is the target shape the "resume"
// generation path should populate going forward (see parseMarkdownToResumeContent
// for a best-effort fallback when only markdown is available).

export interface ResumeContactInfo {
  fullName: string;
  headline?: string; // optional role/title line under the name
  phone?: string;
  email?: string;
  linkedin?: string;
  website?: string;
  location?: string;
}

export interface ResumeEducationEntry {
  degree: string;
  years: string; // e.g. "2019 - 2023"
  institution: string;
  location?: string;
  details?: string[];
}

export interface ResumeExperienceEntry {
  positionTitle: string;
  dateRange: string; // e.g. "Jan 2022 - Present"
  employerName: string;
  location?: string;
  bullets: string[];
}

export interface ResumeProjectEntry {
  projectTitle: string;
  skillsUsed?: string;
  dateRange?: string;
  bullets: string[];
}

export interface ResumeSkillCategory {
  category: string;
  items: string[];
}

export interface StructuredResumeContent {
  contact: ResumeContactInfo;
  summary?: string;
  education: ResumeEducationEntry[];
  experience: ResumeExperienceEntry[];
  projects: ResumeProjectEntry[];
  skills: ResumeSkillCategory[];
}

/**
 * Best-effort fallback: parse a markdown resume (the shape currently stored
 * by the generation pipeline) into the structured shape the docx generator
 * needs. This is intentionally forgiving -- headings are matched
 * case-insensitively and out of strict order -- because model output varies.
 * Prefer having the generation step emit StructuredResumeContent directly;
 * this parser exists so /api/documents/resume/[id] keeps working today.
 */
export function parseMarkdownToResumeContent(
  markdown: string,
  fallbackName: string,
): StructuredResumeContent {
  const lines = markdown.split("\n").map((l) => l.trimEnd());

  const result: StructuredResumeContent = {
    contact: { fullName: fallbackName },
    summary: undefined,
    education: [],
    experience: [],
    projects: [],
    skills: [],
  };

  type Section = "none" | "summary" | "education" | "experience" | "projects" | "skills";
  let section: Section = "none";

  const sectionHeadingMap: Record<string, Section> = {
    summary: "summary",
    "professional summary": "summary",
    education: "education",
    "work experience": "experience",
    experience: "experience",
    projects: "projects",
    "technical skills": "skills",
    skills: "skills",
  };

  let currentExperience: ResumeExperienceEntry | null = null;
  let currentProject: ResumeProjectEntry | null = null;
  let currentEducation: ResumeEducationEntry | null = null;

  const flushExperience = () => {
    if (currentExperience) result.experience.push(currentExperience);
    currentExperience = null;
  };
  const flushProject = () => {
    if (currentProject) result.projects.push(currentProject);
    currentProject = null;
  };
  const flushEducation = () => {
    if (currentEducation) result.education.push(currentEducation);
    currentEducation = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const h1 = line.match(/^#\s+(.*)/);
    if (h1 && section === "none" && !result.contact.fullName) {
      result.contact.fullName = h1[1].trim();
      continue;
    }

    const headingMatch = line.match(/^#{1,3}\s+(.*)/);
    if (headingMatch) {
      const key = headingMatch[1].trim().toLowerCase();
      if (sectionHeadingMap[key]) {
        flushExperience();
        flushProject();
        flushEducation();
        section = sectionHeadingMap[key];
        continue;
      }
    }

    if (section === "summary") {
      result.summary = result.summary ? `${result.summary} ${line}` : line;
      continue;
    }

    if (section === "education") {
      const bullet = line.match(/^[-*]\s+(.*)/);
      if (bullet && currentEducation) {
        currentEducation.details = currentEducation.details ?? [];
        currentEducation.details.push(bullet[1].trim());
        continue;
      }
      flushEducation();
      const [degreePart, institutionPart] = line.split("|").map((s) => s?.trim());
      currentEducation = {
        degree: degreePart ?? line,
        years: "",
        institution: institutionPart ?? "",
      };
      continue;
    }

    if (section === "experience") {
      const bullet = line.match(/^[-*]\s+(.*)/);
      if (bullet && currentExperience) {
        currentExperience.bullets.push(bullet[1].trim());
        continue;
      }
      flushExperience();
      const cleaned = line.replace(/\*\*/g, "");
      const [titlePart, rest] = cleaned.split("—").map((s) => s?.trim());
      currentExperience = {
        positionTitle: titlePart ?? cleaned,
        dateRange: "",
        employerName: rest ?? "",
        bullets: [],
      };
      continue;
    }

    if (section === "projects") {
      const bullet = line.match(/^[-*]\s+(.*)/);
      if (bullet && currentProject) {
        currentProject.bullets.push(bullet[1].trim());
        continue;
      }
      flushProject();
      const cleaned = line.replace(/\*\*/g, "");
      currentProject = { projectTitle: cleaned, bullets: [] };
      continue;
    }

    if (section === "skills") {
      const [catPart, itemsPart] = line.replace(/\*\*/g, "").split(":");
      if (itemsPart) {
        result.skills.push({
          category: catPart.trim(),
          items: itemsPart.split(",").map((s) => s.trim()).filter(Boolean),
        });
      }
      continue;
    }
  }

  flushExperience();
  flushProject();
  flushEducation();

  return result;
}
