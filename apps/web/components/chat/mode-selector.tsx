"use client";

import { useState } from "react";
import { ChevronDown, FileText, Mail, Compass, MessagesSquare } from "lucide-react";
import type { RouterMode } from "@career-assistant/shared-types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MODE_LABELS, PRIMARY_RAIL_MODES, OTHER_TASK_MODES } from "./mode-labels";

const PRIMARY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  resume_optimize: FileText,
  cover_letter: Mail,
  career_coach: Compass,
  interview_prep: MessagesSquare,
};

interface ModeSelectorProps {
  selectedMode: RouterMode | null;
  onSelectMode: (mode: RouterMode) => void;
  className?: string;
}

/**
 * Left rail from the implementation plan, Section 3.4: mirrors the Mode
 * Router table. Selecting a mode here *pre-seeds* the router rather than
 * replacing it — free-text in the composer still auto-routes if the user
 * ignores this rail (see apps/web/lib/router). Below 480px this collapses
 * to a top dropdown (rendered by ChatInterface, not this component).
 */
export function ModeSelector({ selectedMode, onSelectMode, className }: ModeSelectorProps) {
  const [otherTasksOpen, setOtherTasksOpen] = useState(false);

  return (
    <nav className={cn("flex h-full w-64 flex-col gap-1 border-r border-border bg-card p-3", className)}>
      <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Task Mode
      </p>

      {PRIMARY_RAIL_MODES.map((mode) => {
        const Icon = PRIMARY_ICONS[mode];
        const active = selectedMode === mode;
        return (
          <Button
            key={mode}
            variant={active ? "default" : "ghost"}
            className="justify-start gap-2"
            onClick={() => onSelectMode(mode)}
            aria-pressed={active}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {MODE_LABELS[mode]}
          </Button>
        );
      })}

      <Separator className="my-2" />

      <button
        type="button"
        className="flex items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted"
        onClick={() => setOtherTasksOpen((v) => !v)}
        aria-expanded={otherTasksOpen}
      >
        Other Tasks
        <ChevronDown className={cn("h-4 w-4 transition-transform", otherTasksOpen && "rotate-180")} />
      </button>

      {otherTasksOpen && (
        <div className="flex flex-col gap-1 pl-2">
          {OTHER_TASK_MODES.map((mode) => {
            const active = selectedMode === mode;
            return (
              <Button
                key={mode}
                variant={active ? "default" : "ghost"}
                size="sm"
                className="justify-start text-xs"
                onClick={() => onSelectMode(mode)}
                aria-pressed={active}
              >
                {MODE_LABELS[mode]}
              </Button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
