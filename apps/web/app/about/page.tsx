import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MessagesSquare,
  FileText,
  Briefcase,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// "Learn more about Career Buddy" destination from the welcome screen
// (app/page.tsx). Carries the same 4-feature summary that used to live
// directly on the homepage, now as its own dedicated page.
const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Chat",
    description:
      "Talk through any task — resume, cover letter, interview prep, or one of 20 other career tasks. Auto-routes to the right playbook, or pick a mode yourself.",
    href: "/chat",
  },
  {
    icon: FileText,
    title: "Resume Editor",
    description:
      "Side-by-side original vs. ATS-optimized view with inline diff highlighting, keyword traceability, and a live compliance checklist.",
    href: "/resumes/demo",
  },
  {
    icon: Briefcase,
    title: "Job Search",
    description:
      "Search LinkedIn, Indeed, and Hiring.cafe in one place, then track every application through a six-stage status board.",
    href: "/jobs",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "A live count of every application by pipeline stage, an activity chart, a source breakdown, and a feed of your most recently updated jobs.",
    href: "/dashboard",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 p-8">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-primary">What Career Buddy Does</h1>
        <p className="max-w-xl text-muted-foreground">
          One place to search for roles, tailor your resume and cover letter to each one, and
          track every application through to an offer — grounded in your real experience, never
          invented.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pb-4">
        <Button asChild size="lg">
          <Link href="/dashboard">
            Take Me to Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
