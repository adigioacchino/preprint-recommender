import { describe, it, expect } from "vitest";
import {
  fetchRecentPapersBiorxiv,
  fetchRecentPapersBiorxivCategory,
} from "../src/services/biorxiv.js";

describe("Biorxiv Fetcher", () => {
  it.each([["bioinformatics"], ["microbiology"]])(
    "fetch papers from bioRxiv [%s]",
    async (category) => {
      console.log(`Testing category: ${category}`);
      const papers = await fetchRecentPapersBiorxivCategory(category, 4);

      expect(papers).toBeDefined();
      expect(Array.isArray(papers)).toBe(true);

      console.log(`Found ${papers.length} papers in ${category}.`);

      expect(papers.length).toBeGreaterThan(0); // Over the last 7 + 4 days it's expected to find at least one paper

      const now = new Date();
      const lookBackLimit = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      if (papers.length > 0) {
        console.log(`First paper title in ${category}:`, papers[0].title);
        // Verify the structure of each paper
        for (const paper of papers) {
          expect(paper).toHaveProperty("title");
          expect(paper).toHaveProperty("abstract");
          expect(paper).toHaveProperty("authors");
          expect(paper).toHaveProperty("published");
          expect(paper).toHaveProperty("link");
          expect(paper.embedding).toBeUndefined();
          expect(Array.isArray(paper.authors)).toBe(true);
          expect(paper.published instanceof Date).toBe(true);
          // All papers should have date within the lookBackDays + offsetDays
          expect(paper.published <= lookBackLimit).toBe(true);
        }
      }

      // Sleep for 3 seconds to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 3000));
    },
    30_000
  ); // Increase timeout for this test

  it("fetch papers from bioRxiv [multiple categories]", async () => {
    const categories = ["bioinformatics", "microbiology"];
    const papers = await fetchRecentPapersBiorxiv(categories, 7);

    expect(papers).toBeDefined();
    expect(Array.isArray(papers)).toBe(true);

    expect(papers.length).toBeGreaterThan(0); // Over the last 7 days it's expected to find at least one paper

    console.log(
      `Found ${papers.length} papers across categories: ${categories.join(
        ", "
      )}.`
    );
  }, 30_000); // Increase timeout for this test
});
