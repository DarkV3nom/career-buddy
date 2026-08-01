"use client";

import { FileText, Briefcase, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ActiveContext {
  resumeVersionLabel?: string | null;
  jobDescriptionTitle?: string | null;
  jobDescriptionCompany?: string | null;
}

interface ContextPanelProps {
  context: ActiveContext;
  className?: string;
}

/**
 * Right rail from the implementation plan, Section 3.4: shows which
 * resume version and job description are "in scope" for the active
 * conversation (conversations.active_resume_version_id /
 * active_job_description_id). Collapses below the md breakpoint (768px)
 * per the same section.
 */
export function ContextPanel({ context, className }: ContextPanelProps) {
  const hasResume = Boolean(context.resumeVersionLabel);
  const hasJobDescription = Boolean(context.jobDescriptionTitle);

  return (
    <aside className={cn("hidden w-72 flex-col gap-3 border-l border-border bg-card p-3 md:flex", className)}>
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Active Context
      </p>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-sm">Resume</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {hasResume ? (
            <Badge variant="accent">{context.resumeVersionLabel}</Badge>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              No resume in scope yet
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
          <Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-sm">Target Role</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {hasJobDescription ? (
            <div className="text-xs">
              <p className="font-medium text-foreground">{context.jobDescriptionTitle}</p>
              {context.jobDescriptionCompany && (
                <p className="text-muted-foreground">{context.jobDescriptionCompany}</p>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              No job description in scope yet
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
