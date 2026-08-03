// Job descriptions come back from the Apify actors as either plain text
// or HTML fragments depending on the source (see normalize.ts) -- strip
// any tags before truncating for display so a card never shows a
// half-cut "<p>We are looking for..." if a description happens to be
// HTML.
export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

// Flattens the keyword-extraction step's {required, preferred, tools}
// shape into a single deduped list, capped so a card's tag row can't grow
// unbounded. Defensive about shape -- extractedKeywords is a Prisma Json
// column, so it's whatever the extraction step happened to write, not a
// type-checked structure.
export function flattenKeywords(
  extracted: { required?: string[]; preferred?: string[]; tools?: string[] } | null,
  limit = 4,
): string[] {
  if (!extracted) return [];
  const all = [
    ...(Array.isArray(extracted.required) ? extracted.required : []),
    ...(Array.isArray(extracted.tools) ? extracted.tools : []),
    ...(Array.isArray(extracted.preferred) ? extracted.preferred : []),
  ].filter((k): k is string => typeof k === "string" && k.trim().length > 0);
  return Array.from(new Set(all)).slice(0, limit);
}
