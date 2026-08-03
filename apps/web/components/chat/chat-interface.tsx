"use client";

import { useState } from "react";
import type { RouterMode } from "@career-assistant/shared-types";
import { FunctionPicker } from "./function-picker";
import { CreateResumeFlow } from "./create-resume/create-resume-flow";

export interface ChatInterfaceProps {
  userId: string;
}

/**
 * Chat is a function picker, not a freeform chatbot -- each career-help
 * function gets its own guided flow with its own UI, rather than one
 * generic message box auto-routing between 24 modes. Only "Create
 * Resume" is built so far; the rest of FUNCTIONS in function-picker.tsx
 * are visible but disabled, to be built one at a time.
 *
 * This replaces the earlier mode-selector + free-text chat version
 * entirely (ModeSelector, ContextPanel, and the old chat-composer/
 * auto-routing flow are no longer used) -- there was never a working
 * /api/chat behind it anyway, per the request to strip it back down and
 * rebuild function by function.
 */
export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [activeFunction, setActiveFunction] = useState<RouterMode | null>(null);

  return (
    <div className="flex h-full w-full flex-col">
      {activeFunction === null && <FunctionPicker onSelect={setActiveFunction} />}
      {activeFunction === "resume_optimize" && (
        <CreateResumeFlow userId={userId} onExit={() => setActiveFunction(null)} />
      )}
    </div>
  );
}
