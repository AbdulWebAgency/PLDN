import { describe, expect, it } from "vitest";
import { evidenceLabel, resolveEvidence } from "./evidence";
import type { Evidence, ParsedDocument } from "@/types/pldn";

const makeDocument = (): ParsedDocument => ({
    id: "doc-123",
    fileName: "test.pdf",
    byteSize: 1000,
    pageCount: 3,
    lowTextConfidence: false,
    pages: [
        {
            pageNumber: 2,
            text: "One domestic cat or dog is permitted with prior written notice.",
        },
        {
            pageNumber: 3,
            text: "The tenant may terminate with at least 45 days written notice.",
        },
    ],
    sections: [
        {
            id: "s-1",
            clauseId: "9",
            title: "Pets",
            pageNumber: 2,
            text: "One domestic cat or dog is permitted with prior written notice.",
        },
        {
            id: "s-2",
            clauseId: "12",
            title: "Termination by Tenant",
            pageNumber: 3,
            text: "The tenant may terminate with at least 45 days written notice.",
        },
    ],
});

describe("resolveEvidence", () => {
    it("resolves valid section IDs using document-owned evidence", () => {
        const evidence = resolveEvidence(makeDocument(), ["s-2"]);

        expect(evidence).toEqual([
            {
                documentId: "doc-123",
                sectionId: "s-2",
                clauseId: "12",
                pageNumber: 3,
                sourceText:
                    "The tenant may terminate with at least 45 days written notice.",
            },
        ]);
    });

    it("discards unknown section IDs", () => {
        const evidence = resolveEvidence(makeDocument(), [
            "s-does-not-exist",
            "fake-ai-generated-id",
        ]);

        expect(evidence).toEqual([]);
    });

    it("deduplicates repeated section IDs", () => {
        const evidence = resolveEvidence(makeDocument(), [
            "s-1",
            "s-1",
            "s-2",
            "s-2",
        ]);

        expect(evidence).toHaveLength(2);
        expect(evidence.map((item) => item.sectionId)).toEqual(["s-1", "s-2"]);
    });
});

describe("evidenceLabel", () => {
    it("includes the clause and page when a clause ID exists", () => {
        const evidence: Evidence = {
            documentId: "doc-123",
            sectionId: "s-1",
            clauseId: "9",
            pageNumber: 2,
            sourceText: "Pet clause",
        };

        expect(evidenceLabel(evidence)).toBe("Clause 9 · Page 2");
    });

    it("falls back to the page when there is no clause ID", () => {
        const evidence: Evidence = {
            documentId: "doc-123",
            sectionId: "s-3",
            clauseId: null,
            pageNumber: 5,
            sourceText: "General information",
        };

        expect(evidenceLabel(evidence)).toBe("Page 5");
    });
});