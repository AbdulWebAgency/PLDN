import { defineTool } from "@lovable.dev/mcp-js";
import { CONCERNS, GOALS } from "@/lib/concerns";

export default defineTool({
  name: "list_focus_areas",
  title: "List goals and focus areas",
  description:
    "List the situations (goals) and focus areas PLDN can analyse a legal document against. Use the returned ids with analyze_document.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const goals = GOALS.map((g) => ({
      id: g.id,
      label: g.label,
      description: g.description,
      suggestedFocusAreas: g.suggestedConcerns.map((id) => id),
    }));
    const focusAreas = CONCERNS.map((c) => ({
      id: c.id,
      label: c.label,
      severity: c.severity,
    }));

    const text = [
      "Goals:",
      ...goals.map((g) => `- ${g.id}: ${g.label}`),
      "",
      "Focus areas:",
      ...focusAreas.map((f) => `- ${f.id}: ${f.label}`),
    ].join("\n");

    return { content: [{ type: "text", text }], structuredContent: { goals, focusAreas } };
  },
});
