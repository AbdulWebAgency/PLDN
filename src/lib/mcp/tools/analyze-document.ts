import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { CONCERNS, GOALS, getConcern, toCustomConcern } from "@/lib/concerns";
import { sectionsForConcern, toContextSections } from "@/lib/document/retrieval";
import { runConcernAnalysis } from "@/lib/pldn-core.server";
import { evidenceJson, prepareDocument } from "../document";
import type { Concern, DocumentSection } from "@/types/pldn";

const MAX_AREAS = 4;

export default defineTool({
  name: "analyze_document",
  title: "Analyse a legal document",
  description:
    "Analyse the text of a legal document against a person's situation and chosen focus areas. Returns grounded findings, the verbatim source text behind each one, what could NOT be determined from the document, and questions to clarify with a legal professional. Split pages with form-feed characters (\\f) to get page numbers in citations.",
  inputSchema: {
    documentText: z
      .string()
      .min(200)
      .max(400_000)
      .describe("Plain text of the document. Separate pages with form-feed (\\f) characters."),
    situation: z
      .string()
      .max(1200)
      .default("")
      .describe("What the person is trying to figure out, in their own words."),
    goalId: z
      .string()
      .default("something-else")
      .describe("Goal id from list_focus_areas, e.g. 'considering-leaving'."),
    focusAreaIds: z
      .array(z.string())
      .max(MAX_AREAS)
      .default([])
      .describe(
        `Up to ${MAX_AREAS} focus area ids from list_focus_areas. Defaults to the goal's suggested areas.`,
      ),
    customFocusAreas: z
      .array(z.string().max(80))
      .max(2)
      .default([])
      .describe("Free-text topics to assess in addition to the catalogue areas."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const { sections, pagesKnown } = prepareDocument(input.documentText);
    if (sections.length === 0) {
      throw new ToolError("No readable text could be segmented from the supplied document.");
    }

    const goal = GOALS.find((g) => g.id === input.goalId);
    const requested = input.focusAreaIds.length
      ? input.focusAreaIds
      : (goal?.suggestedConcerns ?? CONCERNS.slice(0, 3).map((c) => c.id));

    const areas: Concern[] = [
      ...requested.map((id) => getConcern(id)).filter((c): c is Concern => Boolean(c)),
      ...input.customFocusAreas.map(toCustomConcern),
    ].slice(0, MAX_AREAS);

    if (areas.length === 0) {
      throw new ToolError(
        "No valid focus areas. Call list_focus_areas for the available ids, or pass customFocusAreas.",
      );
    }

    const goalLabel = goal?.label ?? "Understand this document";
    const byId = new Map(sections.map((s) => [s.id, s] as const));

    const findings = await Promise.all(
      areas.map(async (area, index) => {
        if (ctx.signal.aborted) throw new ToolError("Cancelled.");
        const scored = sectionsForConcern(sections, area, input.situation);
        const output = await runConcernAnalysis({
          goalLabel,
          situation: input.situation,
          concernLabel: area.label,
          sections: toContextSections(scored),
        });
        await ctx.progress({
          progress: index + 1,
          total: areas.length,
          message: `Analysed ${area.label}`,
        });

        const cited: DocumentSection[] =
          output.status === "not_found"
            ? []
            : (output.sectionIds ?? [])
                .map((id) => byId.get(id))
                .filter((s): s is DocumentSection => Boolean(s));

        // A claimed finding with no resolvable evidence is downgraded rather
        // than presented as supported by the document.
        const status = output.status !== "not_found" && cited.length === 0 ? "not_found" : output.status;

        return {
          focusArea: area.label,
          status,
          headline: status === "not_found" ? "Not found in this document" : output.headline.trim(),
          explanation: output.explanation.trim(),
          whyItMatters: output.whyItMatters?.trim() || null,
          evidence: evidenceJson(cited, pagesKnown),
          questionsToClarify: (output.questions ?? []).map((q) => q.trim()).filter(Boolean).slice(0, 4),
        };
      }),
    );

    const text = findings
      .map((f) => {
        const cites = f.evidence.map((e) => e.citation).join("; ") || "no supporting clause found";
        return `${f.focusArea.toUpperCase()} — ${f.headline} [${f.status}]\n${f.explanation}\nEvidence: ${cites}\nQuestions: ${f.questionsToClarify.join(" | ") || "none"}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `${text}\n\nPLDN provides document understanding, not legal advice. Findings are based only on the supplied document.`,
        },
      ],
      structuredContent: { pagesKnown, findings },
    };
  },
});
