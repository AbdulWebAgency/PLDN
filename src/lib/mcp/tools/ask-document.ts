import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { sectionsForQuestion, toContextSections } from "@/lib/document/retrieval";
import { runDocumentQuestion } from "@/lib/pldn-core.server";
import { evidenceJson, prepareDocument } from "../document";
import type { DocumentSection } from "@/types/pldn";

export default defineTool({
  name: "ask_document",
  title: "Ask a question about a document",
  description:
    "Answer one question about the text of a legal document, grounded only in that document. Returns the answer, the verbatim clauses it came from, and says plainly when the document does not contain the answer. Split pages with form-feed characters (\\f) to get page numbers in citations.",
  inputSchema: {
    documentText: z
      .string()
      .min(200)
      .max(400_000)
      .describe("Plain text of the document. Separate pages with form-feed (\\f) characters."),
    question: z.string().min(3).max(1000).describe("The question to answer from the document."),
    situation: z
      .string()
      .max(1200)
      .default("")
      .describe("Optional context about the person's situation."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async (input) => {
    const { sections, pagesKnown } = prepareDocument(input.documentText);
    if (sections.length === 0) {
      throw new ToolError("No readable text could be segmented from the supplied document.");
    }

    const scored = sectionsForQuestion(sections, input.question, input.situation);
    const output = await runDocumentQuestion({
      goalLabel: "Understand this document",
      situation: input.situation,
      question: input.question,
      history: [],
      sections: toContextSections(scored),
    });

    const byId = new Map(sections.map((s) => [s.id, s] as const));
    const cited: DocumentSection[] = (output.sectionIds ?? [])
      .map((id) => byId.get(id))
      .filter((s): s is DocumentSection => Boolean(s));

    const answered = output.canAnswer && cited.length > 0;
    const evidence = answered ? evidenceJson(cited, pagesKnown) : [];
    const questions = (output.questions ?? []).map((q) => q.trim()).filter(Boolean).slice(0, 3);

    const text = [
      output.answer.trim(),
      evidence.length ? `Evidence: ${evidence.map((e) => e.citation).join("; ")}` : "",
      answered ? "" : "This could not be determined from the supplied document.",
      questions.length ? `Questions to clarify: ${questions.join(" | ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: {
        answeredFromDocument: answered,
        answer: output.answer.trim(),
        evidence,
        questionsToClarify: questions,
        pagesKnown,
      },
    };
  },
});
