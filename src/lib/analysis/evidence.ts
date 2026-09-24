import type { Evidence, ParsedDocument } from "@/types/pldn";

/**
 * Deterministic evidence resolution. The AI only supplies section ids; pages,
 * clause numbers and source text always come from the parsed document. Unknown
 * ids are discarded rather than displayed.
 */
export function resolveEvidence(
  doc: ParsedDocument,
  sectionIds: readonly string[],
): Evidence[] {
  const seen = new Set<string>();
  const evidence: Evidence[] = [];
  for (const id of sectionIds) {
    if (seen.has(id)) continue;
    const section = doc.sections.find((s) => s.id === id);
    if (!section) continue;
    seen.add(id);
    evidence.push({
      documentId: doc.id,
      sectionId: section.id,
      clauseId: section.clauseId,
      pageNumber: section.pageNumber,
      sourceText: section.text,
    });
  }
  return evidence;
}

export function evidenceLabel(evidence: Evidence): string {
  return evidence.clauseId
    ? `Clause ${evidence.clauseId} · Page ${evidence.pageNumber}`
    : `Page ${evidence.pageNumber}`;
}
