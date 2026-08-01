"use client";

import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MODE_LABELS } from "./mode-labels";
import type { RouterMode } from "@career-assistant/shared-types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: RouterMode | null;
  unsupportedCount?: number; // from guardrail_flags, surfaced inline rather than silently
}

interface MessageThreadProps {
  messages: ChatMessage[];
  className?: string;
}

/**
 * Center column. Structured artifact output (a generated resume section,
 * cover letter, etc.) still renders as a message here, but in the real
 * app should render as an artifact card with "Insert into Editor"/"Copy"
 * actions rather than raw markdown — see the implementation plan, Section
 * 3.4. That card component is a natural next addition once /api/chat is
 * wired up to return structured artifacts, not just prose.
 */
export function MessageThread({ messages, className }: MessageThreadProps) {
  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        {messages.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Pick a mode on the left, or just start typing — free text
            auto-routes to the right playbook.
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" && "flex-row-reverse",
            )}
          >
            <Avatar>
              <AvatarFallback>
                {message.role === "user" ? (
                  <User className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Bot className="h-4 w-4" aria-hidden="true" />
                )}
              </AvatarFallback>
            </Avatar>

            <div
              className={cn(
                "flex max-w-[80%] flex-col gap-1 rounded-lg border border-border px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground",
              )}
            >
              {message.role === "assistant" && message.mode && (
                <span className="text-xs font-medium text-muted-foreground">
                  {MODE_LABELS[message.mode]}
                </span>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              {Boolean(message.unsupportedCount) && (
                <Badge variant="warning" className="mt-1 w-fit">
                  {message.unsupportedCount} claim
                  {message.unsupportedCount === 1 ? "" : "s"} flagged for confirmation
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
