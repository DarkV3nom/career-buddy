"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, MessagesSquare } from "lucide-react";
import type { ComponentType } from "react";

// The 4 real sections of the app (matches the homepage's 4 cards in
// app/page.tsx and /about) -- moved from a left sidebar into a top
// navbar per the reference (Yo!Job-style horizontal nav with an
// underlined active tab), replacing the earlier sidebar layout.
const NAV_ITEMS: { href: string; label: string; icon: ComponentType<{ className?: string }>; match: (path: string) => boolean }[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: (path) => path.startsWith("/dashboard"),
  },
  {
    href: "/jobs",
    label: "Job Search",
    icon: Briefcase,
    match: (path) => path.startsWith("/jobs"),
  },
  {
    href: "/resumes/demo",
    label: "Resume Editor",
    icon: FileText,
    match: (path) => path.startsWith("/resumes"),
  },
  {
    href: "/chat",
    label: "Chat",
    icon: MessagesSquare,
    match: (path) => path.startsWith("/chat"),
  },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-border bg-card px-4 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          CB
        </span>
        <span className="hidden text-base font-semibold text-foreground sm:inline">Career Buddy</span>
      </Link>

      <nav className="flex h-full flex-1 items-center gap-1 overflow-x-auto sm:gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname ?? "");
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex h-full shrink-0 items-center gap-1.5 px-2 text-sm font-medium transition-colors sm:px-3 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">{label}</span>
              {isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
