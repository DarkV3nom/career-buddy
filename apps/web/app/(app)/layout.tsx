import { AppSidebar, AppMobileNav } from "@/components/layout/app-sidebar";

// Shared shell for the app's 4 real sections (dashboard, jobs, resume
// editor, chat) -- a persistent left rail so switching between them
// doesn't route back through the homepage, per the reference dashboard
// design. Bottom tab bar takes over on phones where the rail hides.
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/40">
      <AppSidebar />
      <div className="min-w-0 flex-1 overflow-y-auto pb-14 sm:pb-0">{children}</div>
      <AppMobileNav />
    </div>
  );
}
