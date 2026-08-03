"use client";

import type { ComponentType } from "react";
import {
  FileText,
  Mail,
  Compass,
  MessagesSquare,
  Pencil,
  Search,
  TrendingUp,
  Repeat,
  Sparkles,
  Linkedin,
  Users,
  UserCheck,
  Send,
  Briefcase,
  DollarSign,
  ClipboardCheck,
  Map,
  BookOpen,
  Target,
  Award,
  Building2,
  BarChart3,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import type { RouterMode } from "@career-assistant/shared-types";

interface FunctionDef {
  mode: RouterMode;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  enabled: boolean;
}

// One card per RouterMode. Only "Create Resume" is enabled -- everything
// else is being rebuilt one function at a time (each needs its own
// purpose-built flow, the same way Create Resume gets a guided Q&A rather
// than a generic chat box) rather than routed through free-text chat.
const FUNCTIONS: FunctionDef[] = [
  {
    mode: "resume_optimize",
    title: "Create Resume",
    description: "Build a new resume from scratch, or optimize one you already have.",
    icon: FileText,
    enabled: true,
  },
  { mode: "cover_letter", title: "Cover Letter", description: "A complete, ready-to-send cover letter for a target role.", icon: Mail, enabled: false },
  { mode: "career_coach", title: "Career Coach", description: "LinkedIn help, job search strategy, networking, recruiter messages.", icon: Compass, enabled: false },
  { mode: "interview_prep", title: "Interview Prep", description: "STAR stories and mock interview practice.", icon: MessagesSquare, enabled: false },
  { mode: "writing_style", title: "Writing Review", description: "Editing and rewriting feedback on existing content.", icon: Pencil, enabled: false },
  { mode: "task_6_1", title: "Job Description Analysis", description: "Break down what a job posting is really asking for.", icon: Search, enabled: false },
  { mode: "task_6_2", title: "Resume Gap Analysis", description: "Find what's missing against a target role.", icon: TrendingUp, enabled: false },
  { mode: "task_6_3", title: "Career Transition Planning", description: "Plan a move into a new field or role.", icon: Repeat, enabled: false },
  { mode: "task_6_4", title: "Personal Branding Strategy", description: "Define your professional positioning.", icon: Sparkles, enabled: false },
  { mode: "task_6_5", title: "LinkedIn Content Strategy", description: "Plan what to post and why.", icon: Linkedin, enabled: false },
  { mode: "task_6_6", title: "Networking Strategy", description: "Build a plan for outreach and relationship-building.", icon: Users, enabled: false },
  { mode: "task_6_7", title: "Recruiter Communication", description: "Messages and replies to recruiters.", icon: UserCheck, enabled: false },
  { mode: "task_6_8", title: "Cover Letter (Quick)", description: "A fast, lighter-weight cover letter pass.", icon: Send, enabled: false },
  { mode: "task_6_9", title: "Professional Email/Message", description: "Emails, DMs, and follow-ups.", icon: Mail, enabled: false },
  { mode: "task_6_10", title: "Portfolio & Project Review", description: "Feedback on portfolio pieces or projects.", icon: Briefcase, enabled: false },
  { mode: "task_6_11", title: "Salary Negotiation Prep", description: "Prepare talking points before a negotiation.", icon: DollarSign, enabled: false },
  { mode: "task_6_12", title: "Offer Evaluation", description: "Weigh an offer against what matters to you.", icon: ClipboardCheck, enabled: false },
  { mode: "task_6_13", title: "Career Development Plan", description: "A roadmap for where you want to go next.", icon: Map, enabled: false },
  { mode: "task_6_14", title: "Skill Development Roadmap", description: "What to learn next, and in what order.", icon: BookOpen, enabled: false },
  { mode: "task_6_15", title: "Job Search Optimization", description: "Make your search more effective.", icon: Target, enabled: false },
  { mode: "task_6_16", title: "Executive Career Support", description: "Positioning for senior and executive roles.", icon: Award, enabled: false },
  { mode: "task_6_17", title: "Freelance/Consulting Profile", description: "Build a profile for independent work.", icon: Building2, enabled: false },
  { mode: "task_6_18", title: "Performance Review & Promotion", description: "Prepare for reviews and promotion cases.", icon: BarChart3, enabled: false },
  { mode: "task_6_19", title: "Workplace Communication Coaching", description: "Navigate tricky workplace conversations.", icon: MessageCircle, enabled: false },
  { mode: "task_6_20", title: "Career Research & Market Insights", description: "Understand a role, industry, or market.", icon: Lightbulb, enabled: false },
];

interface FunctionPickerProps {
  onSelect: (mode: RouterMode) => void;
}

export function FunctionPicker({ onSelect }: FunctionPickerProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">What do you need help with?</h1>
        <p className="text-sm text-muted-foreground">
          Pick a function to get started. Each one walks you through exactly what it needs, one step at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FUNCTIONS.map(({ mode, title, description, icon: Icon, enabled }) => (
          <button
            key={mode}
            type="button"
            disabled={!enabled}
            onClick={() => enabled && onSelect(mode)}
            className={`flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all ${
              enabled
                ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {!enabled && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Coming soon
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
