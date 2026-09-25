import { describe, expect, it } from "vitest";
import { segmentSections, sectionLabel } from "./segment";
import type { PageText } from "@/types/pldn";

describe("segmentSections", () => {
    it("segments numbered clauses and preserves their starting pages", () => {
        const pages: PageText[] = [
            {
                pageNumber: 1,
                text: [
                    "1. Lease Term",
                    "The lease begins on October 1, 2026 and ends on September 30, 2027.",
                    "The agreement may be extended in writing.",
                    "",
                    "2. Monthly Rent",
                    "The monthly rent is ₹24,000 and is due on or before the fifth day of each month.",
                ].join("\n"),
            },
            {
                pageNumber: 2,
                text: [
                    "3. Security Deposit",
                    "The tenant shall provide a refundable security deposit of ₹48,000.",
                ].join("\n"),
            },
        ];

        const sections = segmentSections(pages);

        expect(sections.length).toBeGreaterThanOrEqual(3);

        expect(sections[0]).toMatchObject({
            clauseId: "1",
            pageNumber: 1,
        });

        expect(sections[1]).toMatchObject({
            clauseId: "2",
            pageNumber: 1,
        });

        expect(sections[2]).toMatchObject({
            clauseId: "3",
            pageNumber: 2,
        });

        expect(sections[0]?.text).toContain("Lease Term");
        expect(sections[1]?.text).toContain("₹24,000");
    });

    it("falls back to one section per page for unstructured documents", () => {
        const pages: PageText[] = [
            {
                pageNumber: 1,
                text: "This page contains ordinary prose without a detectable clause or heading.",
            },
            {
                pageNumber: 2,
                text: "This second page also contains ordinary prose without document structure.",
            },
        ];

        const sections = segmentSections(pages);

        expect(sections).toHaveLength(2);
        expect(sections[0]).toMatchObject({
            title: "Page 1",
            pageNumber: 1,
            clauseId: null,
        });
        expect(sections[1]).toMatchObject({
            title: "Page 2",
            pageNumber: 2,
            clauseId: null,
        });
    });

    it("caps section text at the configured maximum", () => {
        const longText = `1. Long Clause\n${"This is deliberately long contract text. ".repeat(200)}`;

        const sections = segmentSections([
            {
                pageNumber: 4,
                text: longText,
            },
            {
                pageNumber: 5,
                text: "2. Another Clause\nThis provides enough content to create another section.",
            },
        ]);

        expect(sections[0]?.text.length).toBeLessThanOrEqual(4000);
    });
});

describe("sectionLabel", () => {
    it("formats clause and page information", () => {
        expect(
            sectionLabel({
                clauseId: "9",
                title: "Pets",
                pageNumber: 2,
            }),
        ).toBe("Clause 9 · Page 2");
    });

    it("uses the title when no clause ID exists", () => {
        expect(
            sectionLabel({
                clauseId: null,
                title: "Payment Terms",
                pageNumber: 3,
            }),
        ).toBe("Payment Terms · Page 3");
    });
});
