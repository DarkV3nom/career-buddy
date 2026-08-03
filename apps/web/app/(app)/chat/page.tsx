import { ChatInterface } from "@/components/chat/chat-interface";

// TODO: replace with the real authenticated user ID once Supabase Auth is
// wired up -- matches DEV_USER_ID in app/(app)/jobs/page.tsx and
// app/(app)/dashboard/page.tsx. Must be a real row in `users`
// (job_descriptions.user_id and resumes.user_id are uuid FKs) -- seeded
// via migration 0003_seed_dev_user.
const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

export default function ChatPage() {
  return <ChatInterface userId={DEV_USER_ID} />;
}
