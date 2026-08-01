import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

// Welcome screen, styled after a "Get Started" onboarding card (icon
// badge + pill + heading + two CTAs on a gradient-to-white panel) but
// built entirely from this app's own design tokens (globals.css --
// primary navy, secondary blue) rather than the reference's purple.
// Replaces the old plain card-grid landing page; that grid's content now
// lives on /about as the "Learn more" destination.
export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="flex flex-col items-center gap-5 bg-gradient-to-b from-primary via-secondary/60 to-card px-8 pb-10 pt-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner">
            <Compass className="h-8 w-8" aria-hidden="true" />
          </span>
          <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-foreground shadow-sm">
            Welcome to Career Buddy
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 px-8 pb-8 pt-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Get Started with Career Buddy</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-powered career assistant — search jobs, tailor resumes, and track every
            application in one place, or learn more about{" "}
            <span className="font-semibold text-foreground">what Career Buddy can do</span>.
          </p>

          <div className="mt-3 flex w-full flex-col gap-3">
            <Link
              href="/about"
              className="flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Learn More About Career Buddy
            </Link>
            <Link
              href="/dashboard"
              className="flex w-full items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              <span className="flex-1 text-center">Take Me to Dashboard</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
