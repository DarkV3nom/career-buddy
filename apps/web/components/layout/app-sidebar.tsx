"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, MessagesSquare } from "lucide-react";
import type { ComponentType } from "react";

// The 4 real sections of the app (matches the homepage's 4 cards in
// app/page.tsx) -- put in a persistent left rail per the reference design
// (Findex-style dashboard) so switching between them doesn't require going
// back through the homepage every time.
const NAV_ITEMS: { href: string; label: string; icon: ComponentType<{ className?: string }>; match: (path: string) => boolean }[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: (path) => path.startsWith("/dashboard"),
  },
  {
    href: "/jobs",
    label: "Jobs",
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card p-4 sm:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          CB
        </span>
        <span className="text-base font-semibold text-foreground">Career Buddy</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname ?? "");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Compact bottom-tab variant for phones (< sm) where the rail hides.
export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card py-1.5 sm:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
        const isActive = match(pathname ?? "");
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-[10px] font-medium ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
