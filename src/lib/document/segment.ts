import type { DocumentSection, PageText } from "@/types/pldn";

/**
 * Deterministic clause/section segmentation.
 *
 * Every section keeps the page it starts on and its verbatim source text, so
 * evidence locations are always derived from the document — never from the AI.
 */

const CLAUSE_LINE =
  /^\s{0,6}(?:(?:section|clause|article)\s+)?(\d{1,2}(?:\.\d{1,3}){0,3})[.)]?\s+(.{0,120})$/i;
const HEADING_LINE = /^\s{0,6}([A-Z][A-Z \u2019'&/,-]{5,70})\s*$/;

const MIN_SECTION_CHARS = 60;
const MAX_SECTION_CHARS = 4000;

interface Draft {
  clauseId: string | null;
  title: string | null;
  pageNumber: number;
  lines: string[];
}

function titleFrom(rest: string): string | null {
  const trimmed = rest.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([A-Z][A-Za-z \u2019'&/,-]{2,60})[.:]/);
  if (match?.[1]) return match[1].trim();
  const words = trimmed.split(/\s+/).slice(0, 8).join(" ");
  return words.length > 2 ? words.replace(/[.,;:]$/, "") : null;
}

export function segmentSections(pages: PageText[]): DocumentSection[] {
  const drafts: Draft[] = [];
  let current: Draft | null = null;

  for (const page of pages) {
    for (const rawLine of page.text.split("\n")) {
      const line = rawLine.trimEnd();
      if (!line.trim()) {
        if (current) current.lines.push("");
        continue;
      }

      const clauseMatch = line.match(CLAUSE_LINE);
      const headingMatch = !clauseMatch && line.match(HEADING_LINE);

      const startsNew =
        (clauseMatch && joinedLength(current) > MIN_SECTION_CHARS / 2) ||
        (headingMatch && joinedLength(current) > MIN_SECTION_CHARS) ||
        joinedLength(current) > MAX_SECTION_CHARS ||
        !current;

      if (startsNew) {
        if (current) drafts.push(current);
        current = {
          clauseId: clauseMatch?.[1] ?? null,
          title: clauseMatch
            ? titleFrom(clauseMatch[2] ?? "")
            : headingMatch
              ? toTitleCase(headingMatch[1] ?? "")
              : null,
          pageNumber: page.pageNumber,
          lines: [line],
        };
      } else {
        current!.lines.push(line);
      }
    }
  }
  if (current) drafts.push(current);

  const sections: DocumentSection[] = [];
  for (const draft of drafts) {
    const text = draft.lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text.replace(/\s/g, "").length < 20) continue;
    sections.push({
      id: `s-${sections.length + 1}`,
      clauseId: draft.clauseId,
      title: draft.title,
      pageNumber: draft.pageNumber,
      text: text.slice(0, MAX_SECTION_CHARS),
    });
  }

  // Fall back to one section per page when no structure could be detected.
  if (sections.length < 2) {
    return pages
      .filter((p) => p.text.replace(/\s/g, "").length > 0)
      .map((p, i) => ({
        id: `s-${i + 1}`,
        clauseId: null,
        title: `Page ${p.pageNumber}`,
        pageNumber: p.pageNumber,
        text: p.text.trim().slice(0, MAX_SECTION_CHARS),
      }));
  }

  return sections;
}

function joinedLength(draft: Draft | null): number {
  if (!draft) return 0;
  return draft.lines.join(" ").length;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim();
}

export function sectionLabel(section: {
  clauseId: string | null;
  title: string | null;
  pageNumber: number;
}): string {
  const head = section.clauseId
    ? `Clause ${section.clauseId}`
    : (section.title ?? "Section");
  return `${head} · Page ${section.pageNumber}`;
}
