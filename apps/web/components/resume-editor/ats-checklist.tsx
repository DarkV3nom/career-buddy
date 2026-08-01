import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ATS_CHECKLIST_LABELS, type AtsChecklistState } from "./types";

interface AtsChecklistProps {
  checklist: AtsChecklistState;
}

/**
 * Section 1 Step 10's checklist, rendered as literal checkboxes (per the
 * implementation plan, Section 3.4) rather than summarized prose — the
 * point is the candidate can see exactly which ATS gate passed or failed.
 */
export function AtsChecklist({ checklist }: AtsChecklistProps) {
  const entries = Object.entries(checklist) as [keyof AtsChecklistState, boolean][];
  const passedCount = entries.filter(([, passed]) => passed).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>ATS Compliance Checklist</span>
          <span className="text-xs font-normal text-muted-foreground">
            {passedCount}/{entries.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-1.5 pt-0 sm:grid-cols-2">
        {entries.map(([key, passed]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            {passed ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
            )}
            <span className={cn(!passed && "text-muted-foreground")}>
              {ATS_CHECKLIST_LABELS[key]}
            </span>
            <span className="sr-only">{passed ? "Passed" : "Not passed"}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
