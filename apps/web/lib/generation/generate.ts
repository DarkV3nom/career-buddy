import Anthropic from "@anthropic-ai/sdk";

// The main generation call -- the piece Section 5.2 of the implementation
// plan described ("Generation call (main model, streaming to client)")
// but that was never wired into a route during Phases 0-4 (only the
// router's classification call and the guardrail's fact-check call were
// built). This is intentionally non-streaming: it's called from the
// Interested modal and the job-apply generation routes, which show a
// loading state and display the finished result, not a live-typing chat
// bubble -- streaming would add complexity with no user-facing benefit
// there. apps/web/lib/router/composer.ts still owns prompt assembly.

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GENERATION_MODEL = process.env.GENERATION_MODEL ?? "claude-sonnet-4-5";

export async function generateText(
  systemPrompt: string,
  userInstruction: string,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userInstruction }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  return textBlock?.text ?? "";
}
