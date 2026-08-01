"use client";

import { useState } from "react";
import { Send, PanelLeft } from "lucide-react";
import type { RouterMode } from "@career-assistant/shared-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModeSelector } from "./mode-selector";
import { ContextPanel, type ActiveContext } from "./context-panel";
import { MessageThread, type ChatMessage } from "./message-thread";
import { MODE_LABELS, PRIMARY_RAIL_MODES, OTHER_TASK_MODES } from "./mode-labels";

export interface ChatInterfaceProps {
  initialMessages?: ChatMessage[];
  activeContext?: ActiveContext;
  /** Wire this to POST /api/chat — left as a prop rather than hardcoded
   * fetch so this component stays testable without a live backend. */
  onSendMessage?: (text: string, mode: RouterMode | null) => void;
}

const ALL_MODES: RouterMode[] = [...PRIMARY_RAIL_MODES, ...OTHER_TASK_MODES];

/**
 * Full chat view from the implementation plan, Section 3.4: mode selector
 * left rail + message thread center + context panel right rail.
 * Responsive behavior:
 *  - below md (768px): context panel hides (ContextPanel handles this
 *    itself via `hidden md:flex`)
 *  - below xs (480px): mode selector rail hides in favor of a top
 *    dropdown, handled here since it needs to swap for a <select>
 */
export function ChatInterface({
  initialMessages = [],
  activeContext = {},
  onSendMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedMode, setSelectedMode] = useState<RouterMode | null>(null);
  const [draft, setDraft] = useState("");

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    onSendMessage?.(text, selectedMode);
    setDraft("");
  }

  return (
    <div className="flex h-screen w-full">
      <ModeSelector
        selectedMode={selectedMode}
        onSelectMode={setSelectedMode}
        className="hidden xs:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile mode dropdown — replaces the rail below 480px */}
        <div className="flex items-center gap-2 border-b border-border p-2 xs:hidden">
          <PanelLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <select
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            value={selectedMode ?? ""}
            onChange={(e) => setSelectedMode((e.target.value || null) as RouterMode | null)}
            aria-label="Task mode"
          >
            <option value="">Auto-detect from message</option>
            {ALL_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>

        <MessageThread messages={messages} />

        <div className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe what you need — a target job description, or just ask..."
            className="min-h-[44px] resize-none"
            rows={1}
          />
          <Button size="icon" onClick={handleSend} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ContextPanel context={activeContext} />
    </div>
  );
}
