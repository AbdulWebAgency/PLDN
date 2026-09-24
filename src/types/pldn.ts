/**
 * Core domain types for PLDN.
 *
 * The architecture deliberately separates:
 *  - deterministic document structure (pages, sections, evidence locations)
 *  - AI reasoning (claims, explanations, gaps, questions)
 *
 * The AI may only reference `sectionId` values that came from the parsed
 * document. Page numbers, clause identifiers and source text are always
 * resolved by the application, never produced by the model.
 */

export interface PageText {
  pageNumber: number;
  text: string;
}

/** A deterministically extracted clause/section of the document. */
export interface DocumentSection {
  /** Stable app-generated identifier, e.g. "s-12". */
  id: string;
  /** Clause number found in the document text, e.g. "11.8" (may be absent). */
  clauseId: string | null;
  /** Heading text where one could be detected. */
  title: string | null;
  /** 1-based page the section starts on. */
  pageNumber: number;
  /** Verbatim source text of the section. */
  text: string;
}

export interface ParsedDocument {
  id: string;
  fileName: string;
  byteSize: number;
  pageCount: number;
  pages: PageText[];
  sections: DocumentSection[];
  /** True when the PDF yielded almost no extractable text (likely a scan). */
  lowTextConfidence: boolean;
}

/** A deterministic pointer back into the original document. */
export interface Evidence {
  documentId: string;
  sectionId: string;
  clauseId: string | null;
  pageNumber: number;
  /** Verbatim text from the document used as the highlight target. */
  sourceText: string;
}

export type FindingStatus = "found" | "partial" | "not_found";
export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  /** Concern id this finding answers, e.g. "notice-period". */
  concernId: string;
  concernLabel: string;
  /** Short headline claim, e.g. "60 days' written notice". */
  headline: string;
  /** Plain-language explanation grounded in the cited evidence. */
  explanation: string;
  whyItMatters: string | null;
  status: FindingStatus;
  severity: Severity;
  evidence: Evidence[];
  questions: string[];
}

export interface AnalysisResult {
  findings: Finding[];
  /** Concerns where nothing relevant could be located in the document. */
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Present on assistant messages that are grounded in the document. */
  evidence?: Evidence[];
  /** True when the assistant could not answer from the document. */
  unanswerable?: boolean;
  questions?: string[];
  pending?: boolean;
  error?: boolean;
}

export interface Concern {
  id: string;
  label: string;
  keywords: string[];
  severity: Severity;
}

export interface GoalOption {
  id: string;
  label: string;
  description: string;
  /** Concern ids suggested when this goal is picked. */
  suggestedConcerns: string[];
}

export interface UserContext {
  goalId: string;
  goalLabel: string;
  situation: string;
  concernIds: string[];
  customConcerns: string[];
}

/** Evidence the workspace is currently focused on. */
export interface ActiveEvidence extends Evidence {
  /** Bumped on every click so re-clicking the same citation re-triggers. */
  nonce: number;
}
