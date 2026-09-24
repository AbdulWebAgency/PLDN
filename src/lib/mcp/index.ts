import { defineMcp } from "@lovable.dev/mcp-js";
import analyzeDocumentTool from "./tools/analyze-document";
import askDocumentTool from "./tools/ask-document";
import listFocusAreasTool from "./tools/list-focus-areas";

export default defineMcp({
  name: "document-insight-pro",
  title: "Document Insight Pro",
  version: "0.1.0",
  instructions:
    "PLDN analyses legal documents for non-lawyers. Call list_focus_areas for the available goals and focus areas, analyze_document to assess a document against someone's situation, and ask_document for a single grounded question. Every answer is based only on the document text you supply: pass the full plain text with form-feed (\\f) characters between pages so citations can include page numbers. PLDN states plainly when something cannot be determined from the document, and provides document understanding, not legal advice.",
  tools: [listFocusAreasTool, analyzeDocumentTool, askDocumentTool],
});
