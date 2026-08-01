import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DiffSegment } from "./types";

interface DiffSegmentViewProps {
  segment: DiffSegment;
}

/**
 * Renders one diff segment. Additions/removals never rely on color alone
 * (ux-guidelines.csv flags "color only" as a High-severity accessibility
 * issue) — the `+`/`–` text markers below carry the same information
 * as the background tint for colorblind users, per the implementation
 * plan, Section 3.5.
 */
export function DiffSegmentView({ segment }: DiffSegmentViewProps) {
  if (segment.type === "unchanged") {
    return <span>{segment.text}</span>;
  }

  if (segment.type === "removal") {
    return (
      <span className={cn("diff-removal", "px-0.5")}>
        <span aria-hidden="true">{"– "}</span>
        {segment.text}
      </span>
    );
  }

  // addition
  return (
    <span className={cn("diff-addition", "px-0.5")}>
      <span aria-hidden="true">{"+ "}</span>
      {segment.text}
      {segment.triggeringKeyword && (
        <Badge variant="accent" className="ml-1 align-middle text-[10px]">
          {segment.triggeringKeyword}
        </Badge>
      )}
    </span>
  );
}
