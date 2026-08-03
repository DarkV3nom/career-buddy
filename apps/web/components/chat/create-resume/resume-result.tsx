"use client";

import { ArrowLeft, Download, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResumeResultProps {
  markdown: string;
  versionId: string;
  userId: string;
  unsupportedCount: number;
  onBack: () => void;
  onStartOver: () => void;
}

/**
 * Result screen after generation. Download reuses the existing
 * /api/documents/resume/[id] route (built for the Interested workflow) --
 * a plain <a href>, not fetch, since that route already supports the
 * ?userId= query param specifically so a browser-native download link
 * works without custom headers.
 */
export function ResumeResult({ markdown, versionId, userId, unsupportedCount, onBack, onStartOver }: ResumeResultProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={onStartOver}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Build Another
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-accent" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-foreground">Your resume is ready</h1>
      </div>

      {unsupportedCount > 0 && (
        <Badge variant="warning" className="w-fit">
          {unsupportedCount} claim{unsupportedCount === 1 ? "" : "s"} flagged for confirmation — check the [confirm:
          ...] notes below
        </Badge>
      )}

      <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm">
        {markdown}
      </div>

      <Button asChild className="w-fit">
        <a href={`/api/documents/resume/${versionId}?format=docx&userId=${encodeURIComponent(userId)}`}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download .docx
        </a>
      </Button>
    </div>
  );
}
