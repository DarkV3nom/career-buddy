"use client";

import { useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DiffSegmentView } from "./diff-segment";
import { AtsChecklist } from "./ats-checklist";
import type { DiffSegment, AtsChecklistState } from "./types";

export interface ResumeEditorProps {
  originalText: string;
  /** Optimized resume expressed as diff segments against the original —
   * see types.ts. Rendering from segments (rather than diffing client
   * side) keeps the UI dumb and the generation step authoritative about
   * what changed and why. */
  optimizedSegments: DiffSegment[];
  atsChecklist: AtsChecklistState;
  versionLabel?: string;
}

/**
 * Split-view editor from the implementation plan, Section 3.4: original
 * (read-only) vs. optimized (diff-annotated), synchronized scroll.
 * Below ~600px the two panes stack and become a toggle instead of a
 * side-by-side split, since diff comparison isn't usable at that width.
 */
export function ResumeEditor({
  originalText,
  optimizedSegments,
  atsChecklist,
  versionLabel = "Optimized",
}: ResumeEditorProps) {
  const originalRef = useRef<HTMLDivElement>(null);
  const optimizedRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef<"original" | "optimized" | null>(null);
  const [mobileView, setMobileView] = useState<"original" | "optimized">("optimized");

  const syncScroll = useCallback(
    (source: "original" | "optimized") => {
      const sourceEl = source === "original" ? originalRef.current : optimizedRef.current;
      const targetEl = source === "original" ? optimizedRef.current : originalRef.current;
      if (!sourceEl || !targetEl) return;

      // Guard against feedback loops: the programmatic scroll we set on
      // the target below would otherwise re-trigger this handler on the
      // target's own onScroll.
      if (syncingRef.current === source) return;

      const scrollableHeight = sourceEl.scrollHeight - sourceEl.clientHeight;
      const ratio = scrollableHeight > 0 ? sourceEl.scrollTop / scrollableHeight : 0;
      const targetScrollable = targetEl.scrollHeight - targetEl.clientHeight;

      syncingRef.current = source === "original" ? "optimized" : "original";
      targetEl.scrollTop = ratio * targetScrollable;
      requestAnimationFrame(() => {
        syncingRef.current = null;
      });
    },
    [],
  );

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Resume Editor</h2>
        <Badge variant="accent">{versionLabel}</Badge>
      </div>

      {/* Mobile toggle — replaces the split view below sm (640px) */}
      <div className="flex gap-1 sm:hidden">
        <Button
          size="sm"
          variant={mobileView === "original" ? "default" : "outline"}
          onClick={() => setMobileView("original")}
          className="flex-1"
        >
          Original
        </Button>
        <Button
          size="sm"
          variant={mobileView === "optimized" ? "default" : "outline"}
          onClick={() => setMobileView("optimized")}
          className="flex-1"
        >
          Optimized
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className={cn(
            "flex min-h-0 flex-col rounded-lg border border-border",
            mobileView !== "original" && "hidden sm:flex",
          )}
        >
          <div className="border-b border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
            Original (read-only)
          </div>
          <div
            ref={originalRef}
            onScroll={() => syncScroll("original")}
            className="flex-1 overflow-y-auto whitespace-pre-wrap p-3 text-sm text-muted-foreground"
          >
            {originalText}
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-col rounded-lg border border-border",
            mobileView !== "optimized" && "hidden sm:flex",
          )}
        >
          <div className="border-b border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
            Optimized (editable)
          </div>
          <div
            ref={optimizedRef}
            onScroll={() => syncScroll("optimized")}
            className="flex-1 overflow-y-auto whitespace-pre-wrap p-3 text-sm"
            contentEditable
            suppressContentEditableWarning
          >
            {optimizedSegments.map((segment, i) => (
              <DiffSegmentView key={i} segment={segment} />
            ))}
          </div>
        </div>
      </div>

      <AtsChecklist checklist={atsChecklist} />
    </div>
  );
}
