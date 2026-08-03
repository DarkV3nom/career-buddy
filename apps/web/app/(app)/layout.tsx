import { AppNavbar } from "@/components/layout/app-navbar";

// Shared shell for the app's 4 real sections (dashboard, jobs, resume
// editor, chat) -- top navbar (moved from an earlier left-sidebar
// version per the reference's horizontal nav) so switching between
// sections doesn't route back through the homepage.
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-muted/40">
      <AppNavbar />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
