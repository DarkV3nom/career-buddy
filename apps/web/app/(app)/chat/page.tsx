import { ChatInterface } from "@/components/chat/chat-interface";

// Route for the chat view (implementation plan, Section 3.4 / repo
// structure Section 6). Wiring initialMessages/activeContext from Supabase
// and onSendMessage to POST /api/chat is the next integration step once
// the API route itself is built — this scaffolds the UI shell.
export default function ChatPage() {
  return <ChatInterface />;
}
