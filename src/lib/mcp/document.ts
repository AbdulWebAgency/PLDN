import { segmentSections } from "@/lib/document/segment";
import type { DocumentSection, PageText } from "@/types/pldn";

/**
 * Deterministic text → pages → sections pipeline for MCP callers.
 *
 * MCP callers supply plain text (the PDF itself is parsed in the browser in the
 * app). Page numbers come only from explicit page breaks in the supplied text;
 * they are never guessed, and never produced by the model.
 */

export const PAGE_BREAK = "\f";

export interface PreparedDocument {
  pages: PageText[];
  sections: DocumentSection[];
  /** True when the caller supplied explicit page breaks (form feeds). */
  pagesKnown: boolean;
}

export function prepareDocument(documentText: string): PreparedDocument {
  const normalized = documentText.replace(/\r\n/g, "\n");
  const parts = normalized.split(PAGE_BREAK);
  const pagesKnown = parts.length > 1;
  const pages: PageText[] = parts
    .map((text, index) => ({ pageNumber: index + 1, text: text.trim() }))
    .filter((p) => p.text.length > 0);

  return { pages, sections: segmentSections(pages), pagesKnown };
}

export function citationFor(
  section: Pick<DocumentSection, "clauseId" | "title" | "pageNumber">,
  pagesKnown: boolean,
): string {
  const head = section.clauseId ? `Clause ${section.clauseId}` : (section.title ?? "Section");
  return pagesKnown ? `${head} · Page ${section.pageNumber}` : head;
}

export function evidenceJson(sections: DocumentSection[], pagesKnown: boolean) {
  return sections.map((section) => ({
    citation: citationFor(section, pagesKnown),
    clause: section.clauseId,
    title: section.title,
    page: pagesKnown ? section.pageNumber : null,
    sourceText: section.text.slice(0, 1200),
  }));
}
