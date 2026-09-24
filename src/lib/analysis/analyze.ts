import { analyzeConcern, askDocument } from "@/lib/pldn.functions";
import { getConcern, toCustomConcern } from "@/lib/concerns";
import {
  sectionsForConcern,
  sectionsForQuestion,
  toContextSections,
} from "@/lib/document/retrieval";
import { resolveEvidence } from "./evidence";
import type {
  Concern,
  Evidence,
  Finding,
  ParsedDocument,
  UserContext,
} from "@/types/pldn";

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

function friendlyAiError(error: unknown): AiError {
  const message = error instanceof Error ? error.message : String(error);
  if (/402|credit/i.test(message)) {
    return new AiError(
      "The AI workspace is out of credits. Add credits to continue the analysis.",
    );
  }
  if (/429|rate/i.test(message)) {
    return new AiError("The AI service is busy right now. Please try again in a moment.");
  }
  if (/not configured/i.test(message)) {
    return new AiError("AI is not configured for this app yet.");
  }
  return new AiError("The AI analysis could not be completed. Please try again.");
}

export function resolveConcerns(context: UserContext): Concern[] {
  const selected = context.concernIds
    .map((id) => getConcern(id))
    .filter((c): c is Concern => Boolean(c));
  const custom = context.customConcerns.map(toCustomConcern);
  return [...selected, ...custom];
}

/** Runs one concern through retrieval → AI → deterministic evidence mapping. */
export async function analyzeSingleConcern(
  doc: ParsedDocument,
  context: UserContext,
  concern: Concern,
): Promise<Finding> {
  const scored = sectionsForConcern(doc.sections, concern, context.situation);
  const sections = toContextSections(scored);

  let output;
  try {
    output = await analyzeConcern({
      data: {
        goalLabel: context.goalLabel,
        situation: context.situation,
        concernLabel: concern.label,
        sections,
      },
    });
  } catch (error) {
    throw friendlyAiError(error);
  }

  const evidence =
    output.status === "not_found" ? [] : resolveEvidence(doc, output.sectionIds ?? []);

  // A claimed finding with no resolvable evidence is downgraded, never shown
  // as if the document supported it.
  const status: Finding["status"] =
    output.status !== "not_found" && evidence.length === 0 ? "not_found" : output.status;

  return {
    id: `${concern.id}-${Date.now()}`,
    concernId: concern.id,
    concernLabel: concern.label,
    headline:
      status === "not_found" ? "Not found in this document" : output.headline.trim(),
    explanation: output.explanation.trim(),
    whyItMatters: output.whyItMatters?.trim() ? output.whyItMatters.trim() : null,
    status,
    severity: concern.severity,
    evidence,
    questions: (output.questions ?? []).map((q) => q.trim()).filter(Boolean).slice(0, 4),
  };
}

export interface AnswerResult {
  answer: string;
  evidence: Evidence[];
  unanswerable: boolean;
  questions: string[];
}

export async function askAboutDocument(
  doc: ParsedDocument,
  context: UserContext,
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<AnswerResult> {
  const scored = sectionsForQuestion(doc.sections, question, context.situation);
  const sections = toContextSections(scored);

  let output;
  try {
    output = await askDocument({
      data: {
        goalLabel: context.goalLabel,
        situation: context.situation,
        question,
        history: history.slice(-6),
        sections,
      },
    });
  } catch (error) {
    throw friendlyAiError(error);
  }

  const evidence = resolveEvidence(doc, output.sectionIds ?? []);
  return {
    answer: output.answer.trim(),
    evidence: output.canAnswer ? evidence : [],
    unanswerable: !output.canAnswer || (output.canAnswer && evidence.length === 0),
    questions: (output.questions ?? []).map((q) => q.trim()).filter(Boolean).slice(0, 3),
  };
}
