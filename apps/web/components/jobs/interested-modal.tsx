"use client";

import { useState } from "react";
import { X, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobCardData } from "./job-types";

type OutputType = "resume" | "cover_letter" | "message";
type MessageType = "recruiter_email" | "linkedin_message" | "referral_request" | "follow_up";

interface GeneratedResult {
  resume?: { version?: { id: string; contentJson?: { markdown?: string } }; error?: string };
  coverLetter?: { coverLetter?: { id: string; content: string } };
  message?: { message?: { id: string; content: string } };
}

interface InterestedModalProps {
  job: JobCardData;
  userId: string;
  onClose: () => void;
}

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  recruiter_email: "Recruiter email",
  linkedin_message: "LinkedIn message",
  referral_request: "Referral request",
  follow_up: "Follow-up",
};

/**
 * "Click Interested, tell me what you need" panel from the request. Asks
 * which outputs to generate before doing anything -- never auto-generates
 * on open, since a resume/cover letter/message is a real LLM call each
 * time, not free.
 */
export function InterestedModal({ job, userId, onClose }: InterestedModalProps) {
  const [outputs, setOutputs] = useState<Set<OutputType>>(new Set(["resume"]));
  const [messageType, setMessageType] = useState<MessageType>("recruiter_email");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult | null>(null);

  function toggleOutput(output: OutputType) {
    setOutputs((prev) => {
      const next = new Set(prev);
      if (next.has(output)) next.delete(output);
      else next.add(output);
      return next;
    });
  }

  async function handleGenerate() {
    if (outputs.size === 0) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ outputs: Array.from(outputs), messageType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setResults(data.results);
    } catch {
      setError("Something went wrong generating your documents. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <Card className="max-h-[85vh] w-full max-w-lg overflow-y-auto">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{job.roleTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">{job.companyName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {!results && (
            <>
              <p className="text-sm text-muted-foreground">What do you need for this application?</p>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={outputs.has("resume")}
                    onChange={() => toggleOutput("resume")}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Optimized resume for this role
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={outputs.has("cover_letter")}
                    onChange={() => toggleOutput("cover_letter")}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Cover letter
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={outputs.has("message")}
                    onChange={() => toggleOutput("message")}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Custom message / email
                </label>

                {outputs.has("message") && (
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as MessageType)}
                    className="ml-6 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    aria-label="Message type"
                  >
                    {(Object.keys(MESSAGE_TYPE_LABELS) as MessageType[]).map((type) => (
                      <option key={type} value={type}>
                        {MESSAGE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={handleGenerate} disabled={isGenerating || outputs.size === 0}>
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isGenerating ? "Generating…" : "Generate"}
              </Button>
            </>
          )}

          {results && (
            <div className="flex flex-col gap-4">
              {results.resume?.error && (
                <p className="text-sm text-warning">{results.resume.error}</p>
              )}
              {results.resume?.version && (
                <GeneratedBlock
                  title="Resume"
                  content={results.resume.version.contentJson?.markdown ?? ""}
                  downloadHref={`/api/documents/resume/${results.resume.version.id}?format=docx&userId=${encodeURIComponent(userId)}`}
                />
              )}
              {results.coverLetter?.coverLetter && (
                <GeneratedBlock
                  title="Cover Letter"
                  content={results.coverLetter.coverLetter.content}
                  downloadHref={`/api/documents/cover-letter/${results.coverLetter.coverLetter.id}?format=docx&userId=${encodeURIComponent(userId)}`}
                />
              )}
              {results.message?.message && (
                <GeneratedBlock title="Message" content={results.message.message.content} />
              )}

              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GeneratedBlock({
  title,
  content,
  downloadHref,
}: {
  title: string;
  content: string;
  downloadHref?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {downloadHref && (
          <Button size="sm" variant="outline" asChild>
            <a href={downloadHref}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              .docx
            </a>
          </Button>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-xs">
        {content}
      </div>
    </div>
  );
}
