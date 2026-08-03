"use client";

import { useState } from "react";
import { ArrowLeft, Send, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageThread, type ChatMessage } from "../message-thread";

// One question at a time, in this exact order -- per the request: "one
// question asked, one answered, line by line," not a single form and not
// a free-form back-and-forth. `required` gates whether the Skip button
// shows; targetJob and contactDetails are the only two genuinely optional
// inputs (the resume still works without them -- see the API route's
// buildUserInstruction fallback for targetJob specifically).
const QUESTIONS = [
  {
    key: "targetJob",
    required: false,
    prompt:
      "What job or company are you targeting? Paste a posting if you have one, or just describe the industry/role — or say \"not sure yet\" and I'll keep it general.",
  },
  {
    key: "targetRole",
    required: true,
    prompt: "What's the job title or role you're targeting?",
  },
  {
    key: "experienceLevel",
    required: true,
    prompt: "What's your experience level? (e.g. entry-level, 3 years, senior, 10+ years)",
  },
  {
    key: "workExperience",
    required: true,
    prompt:
      "Tell me about your work experience, projects, or anything else relevant — employer/organization names, your role, dates, and what you did or achieved. The more detail here, the better the resume.",
  },
  {
    key: "education",
    required: true,
    prompt: "What's your education background? (degree, field, school, and year)",
  },
  {
    key: "fullName",
    required: true,
    prompt: "What's your full name?",
  },
  {
    key: "contactDetails",
    required: false,
    prompt: "Last one — what contact details would you like on your resume? Email, phone, LinkedIn, whatever you'd like to include.",
  },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]["key"];
export type FromScratchAnswers = Record<QuestionKey, string>;

interface FromScratchQaProps {
  onBack: () => void;
  onComplete: (answers: FromScratchAnswers) => void;
  isSubmitting: boolean;
}

export function FromScratchQa({ onBack, onComplete, isSubmitting }: FromScratchQaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: `Great! Let's build your resume from scratch. I'll ask you a few questions, one at a time.\n\n${QUESTIONS[0].prompt}`,
    },
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<FromScratchAnswers>>({});
  const [draft, setDraft] = useState("");

  const currentQuestion = QUESTIONS[stepIndex];
  const isLastQuestion = stepIndex === QUESTIONS.length - 1;

  function advance(answerText: string) {
    const nextAnswers = { ...answers, [currentQuestion.key]: answerText };
    setAnswers(nextAnswers);
    setDraft("");

    if (isLastQuestion) {
      setMessages((prev) => [
        ...prev,
        { id: `a-${currentQuestion.key}`, role: "user", content: answerText || "(skipped)" },
        { id: "generating", role: "assistant", content: "Got it — give me a moment to put your resume together…" },
      ]);
      onComplete(nextAnswers as FromScratchAnswers);
      return;
    }

    const next = QUESTIONS[stepIndex + 1];
    setMessages((prev) => [
      ...prev,
      { id: `a-${currentQuestion.key}`, role: "user", content: answerText || "(skipped)" },
      { id: `q-${next.key}`, role: "assistant", content: next.prompt },
    ]);
    setStepIndex((i) => i + 1);
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) {
      if (!currentQuestion.required) advance("");
      return;
    }
    advance(text);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-3">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <p className="text-xs text-muted-foreground">
          Question {stepIndex + 1} of {QUESTIONS.length}
        </p>
      </div>

      <MessageThread messages={messages} className="flex-1" />

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={currentQuestion.required ? "Type your answer…" : "Type your answer, or skip…"}
          className="min-h-[44px] resize-none"
          rows={1}
          disabled={isSubmitting}
        />
        {!currentQuestion.required && !isSubmitting && (
          <Button variant="outline" onClick={() => advance("")} aria-label="Skip this question">
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            Skip
          </Button>
        )}
        <Button onClick={handleSend} disabled={isSubmitting} aria-label="Send answer">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
