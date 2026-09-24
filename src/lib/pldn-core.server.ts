import { streamText, Output } from "ai";
import { z } from "zod";
import { CHAT_MODEL, GROUNDING_RULES, createGateway } from "./ai-gateway.server";

/**
 * Shared AI reasoning core.
 *
 * Both the in-app server functions and the MCP tools call these helpers, so
 * grounding rules, schemas and prompt shape stay identical across surfaces.
 * The model only ever sees the excerpts it is given, and may reference them by
 * id only — pages, clause numbers and source text are resolved by the caller.
 */

export const ContextSection = z.object({
  id: z.string().max(24),
  clauseId: z.string().nullable(),
  title: z.string().nullable(),
  page: z.number().int().positive(),
  text: z.string().max(4000),
});

export type ContextSectionInput = z.infer<typeof ContextSection>;

export const MAX_SECTIONS = 10;

function renderSections(sections: ContextSectionInput[]): string {
  return sections
    .slice(0, MAX_SECTIONS)
    .map(
      (s) =>
        `<excerpt id="${s.id}"${s.clauseId ? ` clause="${s.clauseId}"` : ""}>\n${s.text}\n</excerpt>`,
    )
    .join("\n\n");
}

export const FindingSchema = z.object({
  status: z
    .enum(["found", "partial", "not_found"])
    .describe(
      "found = clearly addressed; partial = touched on but incomplete; not_found = not addressed in the excerpts",
    ),
  headline: z
    .string()
    .describe("Very short answer, e.g. '60 days' written notice' or 'Not addressed'. Max 60 chars."),
  explanation: z.string().describe("2-3 plain sentences describing only what the excerpts say."),
  whyItMatters: z
    .string()
    .describe("One sentence on why this matters for the user's situation, or empty string."),
  sectionIds: z
    .array(z.string())
    .describe("Ids of the excerpts that support this. Empty when status is not_found."),
  questions: z
    .array(z.string())
    .describe("1-3 questions the user should clarify with a legal professional."),
});

export const AnswerSchema = z.object({
  canAnswer: z
    .boolean()
    .describe("False when the excerpts do not contain enough information to answer."),
  answer: z
    .string()
    .describe(
      "Plain-language answer based only on the excerpts. When canAnswer is false, explain plainly what could not be found in the document.",
    ),
  sectionIds: z.array(z.string()).describe("Ids of excerpts that support the answer."),
  questions: z
    .array(z.string())
    .describe("Up to 3 follow-up questions to clarify with a legal professional. May be empty."),
});

export interface ConcernRequest {
  goalLabel: string;
  situation: string;
  concernLabel: string;
  sections: ContextSectionInput[];
}

export async function runConcernAnalysis(data: ConcernRequest) {
  const gateway = createGateway();

  const prompt = `The user's goal: ${data.goalLabel}
The user described their situation as: "${data.situation || "(not described)"}"

Topic to assess: "${data.concernLabel}"

Document excerpts (the ONLY permitted source):
${data.sections.length ? renderSections(data.sections) : "(no excerpts matched this topic)"}

Assess whether these excerpts address the topic for this user's situation.`;

  const result = streamText({
    model: gateway(CHAT_MODEL),
    system: GROUNDING_RULES,
    prompt,
    output: Output.object({ schema: FindingSchema }),
  });

  return await result.output;
}

export interface QuestionRequest {
  goalLabel: string;
  situation: string;
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
  sections: ContextSectionInput[];
}

export async function runDocumentQuestion(data: QuestionRequest) {
  const gateway = createGateway();

  const conversation = data.history
    .map((m) => `${m.role === "user" ? "User" : "PLDN"}: ${m.content}`)
    .join("\n");

  const prompt = `The user's goal: ${data.goalLabel}
The user described their situation as: "${data.situation || "(not described)"}"
${conversation ? `\nEarlier in this conversation:\n${conversation}\n` : ""}
Question: "${data.question}"

Document excerpts (the ONLY permitted source):
${data.sections.length ? renderSections(data.sections) : "(no excerpts matched this question)"}`;

  const result = streamText({
    model: gateway(CHAT_MODEL),
    system: GROUNDING_RULES,
    prompt,
    output: Output.object({ schema: AnswerSchema }),
  });

  return await result.output;
}
