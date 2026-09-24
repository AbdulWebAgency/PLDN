import { createGoogleGenerativeAI } from "@ai-sdk/google";

/** Server-only Google Gemini API provider. The key never reaches the browser. */
export function createGateway() {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app.");

  return createGoogleGenerativeAI({
    apiKey: key,
  });
}

export const CHAT_MODEL = "gemini-3.1-flash-lite";

export const GROUNDING_RULES = `You are PLDN, a legal document navigator for non-lawyers.

Hard rules:
- Only state things supported by the supplied document excerpts. Never rely on outside legal knowledge, assumptions, or typical market practice.
- Never invent clause numbers, page numbers, or quotes. Reference excerpts only by their given "id".
- If the excerpts do not answer the question, say so plainly and set the not-found status. That is a correct, valuable answer.
- Write plain, calm English for a non-lawyer. No legalese, no hedging filler, no emojis.
- Never give legal advice, predict outcomes, or state legal entitlements. Describe only what the document says.
- Always frame statements as based on the provided document.`;
