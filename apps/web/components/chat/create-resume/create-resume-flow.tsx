"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeChoice } from "./resume-choice";
import { FromScratchQa, type FromScratchAnswers } from "./from-scratch-qa";
import { ResumeResult } from "./resume-result";

interface CreateResumeFlowProps {
  userId: string;
  onExit: () => void;
}

type Step = "choice" | "from-scratch" | "result";

interface GeneratedResume {
  markdown: string;
  versionId: string;
  unsupportedCount: number;
}

async function parseJsonSafely(res: Response): Promise<{ data: unknown; ok: boolean }> {
  try {
    return { data: await res.json(), ok: true };
  } catch {
    return { data: null, ok: false };
  }
}

export function CreateResumeFlow({ userId, onExit }: CreateResumeFlowProps) {
  const [step, setStep] = useState<Step>("choice");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResume | null>(null);

  async function handleFromScratchComplete(answers: FromScratchAnswers) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/resumes/from-scratch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          targetJob: answers.targetJob,
          targetRole: answers.targetRole,
          experienceLevel: answers.experienceLevel,
          workExperience: answers.workExperience,
          education: answers.education,
          contact: { fullName: answers.fullName, details: answers.contactDetails },
        }),
      });
      const { data, ok } = await parseJsonSafely(res);
      if (!res.ok || !ok) {
        const message = ok ? (data as { error?: string }).error : null;
        setError(message ?? "Something went wrong generating your resume. Try again in a moment.");
        return;
      }
      const body = data as {
        version: { id: string; contentJson?: { markdown?: string } };
        guardrail: { unsupportedCount: number };
      };
      setResult({
        markdown: body.version.contentJson?.markdown ?? "",
        versionId: body.version.id,
        unsupportedCount: body.guardrail.unsupportedCount,
      });
      setStep("result");
    } catch {
      setError("Something went wrong generating your resume. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startOver() {
    setResult(null);
    setError(null);
    setStep("choice");
  }

  if (step === "choice") {
    return <ResumeChoice onSelectFromScratch={() => setStep("from-scratch")} onBack={onExit} />;
  }

  if (step === "from-scratch") {
    return (
      <div className="flex h-full flex-col">
        {error && (
          <div className="flex items-center justify-between gap-2 border-b border-border bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}
        <FromScratchQa
          onBack={() => setStep("choice")}
          onComplete={handleFromScratchComplete}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <ResumeResult
        markdown={result.markdown}
        versionId={result.versionId}
        userId={userId}
        unsupportedCount={result.unsupportedCount}
        onBack={onExit}
        onStartOver={startOver}
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-muted-foreground">Something went wrong. Let&apos;s start over.</p>
      <Button variant="outline" onClick={startOver}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Start Over
      </Button>
    </div>
  );
}
