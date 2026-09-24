import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ContextSection,
  MAX_SECTIONS,
  runConcernAnalysis,
  runDocumentQuestion,
} from "./pldn-core.server";

/**
 * Server boundary for AI reasoning.
 *
 * The client sends only the small set of document excerpts its deterministic
 * retrieval selected — never the whole document. The model may reference those
 * excerpts by id only; the client resolves ids back to pages, clause numbers
 * and verbatim source text.
 */

const AnalyzeInput = z.object({
  goalLabel: z.string().max(200),
  situation: z.string().max(1200),
  concernLabel: z.string().max(120),
  sections: z.array(ContextSection).max(MAX_SECTIONS),
});

export const analyzeConcern = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }) => runConcernAnalysis(data));

const AskInput = z.object({
  goalLabel: z.string().max(200),
  situation: z.string().max(1200),
  question: z.string().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(8)
    .default([]),
  sections: z.array(ContextSection).max(MAX_SECTIONS),
});

export const askDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => runDocumentQuestion(data));
