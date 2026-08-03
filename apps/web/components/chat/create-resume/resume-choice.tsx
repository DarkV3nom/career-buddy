"use client";

import { ArrowLeft, PenLine, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeChoiceProps {
  onSelectFromScratch: () => void;
  onBack: () => void;
}

/**
 * "Create Resume" landing: from scratch vs. optimize an upload. Upload is
 * a "Coming soon" stub for now -- no spec for that flow has been written
 * yet (it needs file parsing, which From Scratch doesn't), so it's shown
 * but disabled rather than half-built.
 */
export function ResumeChoice({ onSelectFromScratch, onBack }: ResumeChoiceProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="w-fit">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Create Resume</h1>
        <p className="text-sm text-muted-foreground">How would you like to start?</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-xl">
        <button
          type="button"
          onClick={onSelectFromScratch}
          className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PenLine className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-foreground">From Scratch</p>
          <p className="text-xs text-muted-foreground">
            Answer a few questions about your background and I&apos;ll build a resume for you.
          </p>
        </button>

        <button type="button" disabled className="flex cursor-not-allowed flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left opacity-50">
          <div className="flex w-full items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Coming soon
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">Upload Resume to Optimize</p>
          <p className="text-xs text-muted-foreground">
            Upload an existing resume and I&apos;ll tailor it to a target job.
          </p>
        </button>
      </div>
    </div>
  );
}
