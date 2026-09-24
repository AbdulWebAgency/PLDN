import type { Concern, DocumentSection } from "@/types/pldn";

/**
 * Lightweight deterministic retrieval. Keeps the amount of document text sent
 * to the AI small: only the highest scoring sections travel to the server.
 */

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "for",
  "and",
  "or",
  "is",
  "are",
  "be",
  "this",
  "that",
  "it",
  "on",
  "with",
  "as",
  "at",
  "by",
  "i",
  "my",
  "me",
  "do",
  "does",
  "can",
  "what",
  "how",
  "if",
  "my",
  "their",
  "shall",
  "any",
  "from",
  "will",
  "would",
  "should",
  "about",
  "when",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.-]+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => (t.length > 2 || /^\d+$/.test(t)) && !STOP_WORDS.has(t));
}

export interface ScoredSection {
  section: DocumentSection;
  score: number;
}

function scoreSection(section: DocumentSection, terms: string[], phrases: string[]): number {
  const haystack = `${section.clauseId ?? ""} ${section.title ?? ""} ${section.text}`.toLowerCase();
  let score = 0;
  for (const phrase of phrases) {
    if (phrase.length > 4 && haystack.includes(phrase.toLowerCase())) score += 6;
  }
  for (const term of terms) {
    const occurrences = haystack.split(term).length - 1;
    if (occurrences > 0) score += Math.min(occurrences, 2) * 2;
  }
  if (section.title) score += 0.5;
  // Prefer substantive clauses over stubs.
  if (section.text.length > 250) score += 0.5;
  return score;
}

export function rankSections(
  sections: DocumentSection[],
  query: { terms: string[]; phrases: string[] },
  limit: number,
): ScoredSection[] {
  return sections
    .map((section) => ({ section, score: scoreSection(section, query.terms, query.phrases) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Sections relevant to one concern (plus the user's own wording). */
export function sectionsForConcern(
  sections: DocumentSection[],
  concern: Concern,
  situation: string,
  limit = 6,
): ScoredSection[] {
  const terms = [...new Set([...tokenize(concern.label), ...concern.keywords.flatMap(tokenize)])];
  const phrases = concern.keywords;
  const ranked = rankSections(sections, { terms, phrases }, limit);
  if (ranked.length > 0) return ranked;
  // Fall back to the user's own description so the model still sees context.
  return rankSections(sections, { terms: tokenize(situation), phrases: [] }, limit);
}

export function sectionsForQuestion(
  sections: DocumentSection[],
  question: string,
  situation: string,
  limit = 8,
): ScoredSection[] {
  const terms = [...new Set([...tokenize(question), ...tokenize(situation).slice(0, 8)])];
  const phrases = question
    .toLowerCase()
    .split(/[,.?;]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 8);
  return rankSections(sections, { terms, phrases }, limit);
}

/** Trims section text before it is sent to the model. */
export function toContextSections(
  scored: ScoredSection[],
  maxCharsPerSection = 1400,
): { id: string; clauseId: string | null; title: string | null; page: number; text: string }[] {
  return scored.map(({ section }) => ({
    id: section.id,
    clauseId: section.clauseId,
    title: section.title,
    page: section.pageNumber,
    text: section.text.slice(0, maxCharsPerSection),
  }));
}
