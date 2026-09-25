import { describe, expect, it } from "vitest";
import {
    rankSections,
    toContextSections,
    tokenize,
} from "./retrieval";
import type { DocumentSection } from "@/types/pldn";

const section = (
    id: string,
    title: string | null,
    text: string,
    pageNumber = 1,
    clauseId: string | null = null,
): DocumentSection => ({
    id,
    title,
    text,
    pageNumber,
    clauseId,
});

describe("tokenize", () => {
    it("removes stop words while keeping meaningful terms and numbers", () => {
        expect(tokenize("How much is the monthly rent due on the 5th?")).toEqual([
            "much",
            "monthly",
            "rent",
            "due",
            "5th",
        ]);
    });

    it("normalizes punctuation and casing", () => {
        expect(tokenize("TERMINATION, Notice-period; Payment.")).toEqual([
            "termination",
            "notice-period",
            "payment",
        ]);
    });
});

describe("rankSections", () => {
    it("ranks the section containing the requested phrase highest", () => {
        const sections = [
            section(
                "s-1",
                "Pets",
                "The tenant may keep one domestic cat with prior written notice.",
            ),
            section(
                "s-2",
                "Termination",
                "The tenant may terminate this agreement with at least 45 days written notice.",
            ),
        ];

        const ranked = rankSections(
            sections,
            {
                terms: ["terminate", "notice"],
                phrases: ["45 days written notice"],
            },
            5,
        );

        expect(ranked[0]?.section.id).toBe("s-2");
        expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
    });

    it("excludes sections with no matching terms", () => {
        const sections = [
            section("s-1", null, "One domestic cat is permitted."),
            section("s-2", null, "Monthly rent is ₹24,000."),
        ];

        const ranked = rankSections(
            sections,
            {
                terms: ["termination"],
                phrases: [],
            },
            5,
        );

        expect(ranked).toHaveLength(0);
    });

    it("respects the requested result limit", () => {
        const sections = [
            section("s-1", "Rent", "Monthly rent is due on the fifth day."),
            section("s-2", "Payment", "Payment must be made each month."),
            section("s-3", "Late Payment", "Late payment may constitute a breach."),
        ];

        const ranked = rankSections(
            sections,
            {
                terms: ["payment"],
                phrases: [],
            },
            2,
        );

        expect(ranked).toHaveLength(2);
    });
});

describe("toContextSections", () => {
    it("truncates section text to the requested context limit", () => {
        const longText = "A".repeat(2000);

        const result = toContextSections(
            [
                {
                    section: section("s-1", "Long Clause", longText, 3, "7"),
                    score: 10,
                },
            ],
            1400,
        );

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: "s-1",
            clauseId: "7",
            title: "Long Clause",
            page: 3,
        });
        expect(result[0]?.text).toHaveLength(1400);
    });
});