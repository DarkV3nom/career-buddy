import Link from "next/link";
import { MessagesSquare, FileText, ArrowRight, Briefcase, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Real landing page — replaces the Phase 0 scaffold placeholder. Links to
// the screens that actually exist today; add more cards here as new
// routes (interview prep, STAR builder, etc.) come online.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold text-primary">
          Career Application Assistant
        </h1>
        <p className="max-w-md text-muted-foreground">
          Resume optimization, cover letters, interview prep, and career
          coaching — grounded in your real experience, never invented.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col">
          <CardHeader>
            <MessagesSquare className="h-6 w-6 text-primary" aria-hidden="true" />
            <CardTitle>Chat</CardTitle>
            <CardDescription>
              Talk through any task — resume, cover letter, interview prep,
              or one of 20 other career tasks. Auto-routes to the right
              playbook, or pick a mode yourself.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/chat">
                Open Chat
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
            <CardTitle>Resume Editor</CardTitle>
            <CardDescription>
              Side-by-side original vs. ATS-optimized view with inline diff
              highlighting, keyword traceability, and a live compliance
              checklist.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/resumes/demo">
                Open Resume Editor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <Briefcase className="h-6 w-6 text-primary" aria-hidden="true" />
            <CardTitle>Job Search</CardTitle>
            <CardDescription>
              Search LinkedIn, Indeed, and Hiring.cafe in one place, then
              track every application through a six-stage status board.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/jobs">
                Open Job Search
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <LayoutDashboard className="h-6 w-6 text-primary" aria-hidden="true" />
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              A live count of every application by pipeline stage —
              applied, in progress, rejected, and beyond.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
