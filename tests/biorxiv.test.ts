import { describe, it, expect } from "vitest";
import {
  fetchRecentPapersBiorxiv,
  fetchRecentPapersBiorxivCategory,
} from "../src/services/biorxiv.js";
import { getPreprintDateRange } from "../src/utils/date.js";

// Test params
const OFFSET_DAYS = 4;
const LOOKBACK_DAYS = 3;

describe("Biorxiv Fetcher", () => {
  it.each([["bioinformatics"], ["microbiology"]])(
    "fetch papers from bioRxiv [%s]",
    async (category) => {
      console.log(`Testing category: ${category}`);
      const papers = await fetchRecentPapersBiorxivCategory(
        category,
        LOOKBACK_DAYS,
        OFFSET_DAYS,
        true // verbose
      );

      expect(papers).toBeDefined();
      expect(Array.isArray(papers)).toBe(true);

      console.log(`Found ${papers.length} papers in ${category}.`);

      expect(papers.length).toBeGreaterThan(0); // Over the last OFFSET_DAYS + LOOKBACK_DAYS days it's expected to find at least one paper

      // Get expected date range
      const [paperStartDay, paperEndDay] = getPreprintDateRange(
        LOOKBACK_DAYS,
        OFFSET_DAYS
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
          expect(paper.published.getDate()).toBeGreaterThanOrEqual(
            paperStartDay.getDate()
          );
          expect(paper.published.getDate()).toBeLessThanOrEqual(
            paperEndDay.getDate()
          );
        }
      }

      // Sleep for 3 seconds to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 3000));
    },
    30_000
  ); // Increase timeout for this test


  it("fetch papers from bioRxiv with multiple-word category", async () => {
    // use the underscore first
    const category = "cancer_biology";
    const papers = await fetchRecentPapersBiorxivCategory(
      category,
      LOOKBACK_DAYS,
      OFFSET_DAYS,
      true // verbose
    );
    expect(papers).toBeDefined();
    expect(Array.isArray(papers)).toBe(true);
    expect(papers.length).toBeGreaterThan(0);

    // Now use space
    const categoryWithSpace = "cancer biology";
    const papersWithSpace = await fetchRecentPapersBiorxivCategory(
      categoryWithSpace,
      LOOKBACK_DAYS,
      OFFSET_DAYS,
      true // verbose
    );
    expect(papersWithSpace).toBeDefined();
    expect(Array.isArray(papersWithSpace)).toBe(true);
    expect(papersWithSpace).toEqual(papers);

    // Now use minus
    const categoryWithMinus = "cancer-biology";
    const papersWithMinus = await fetchRecentPapersBiorxivCategory(
      categoryWithMinus,
      LOOKBACK_DAYS,
      OFFSET_DAYS,
      true // verbose
    );
    expect(papersWithMinus).toBeDefined();
    expect(Array.isArray(papersWithMinus)).toBe(true);
    expect(papersWithMinus).toEqual(papers);
  }, 90_000); // Increase timeout for this test

  it("fetch papers from bioRxiv [multiple categories]", async () => {
    const categories = ["bioinformatics", "microbiology"];
    const papers = await fetchRecentPapersBiorxiv(
      categories,
      LOOKBACK_DAYS,
      OFFSET_DAYS
    );

    expect(papers).toBeDefined();
    expect(Array.isArray(papers)).toBe(true);

    expect(papers.length).toBeGreaterThan(0); // Over the last OFFSET_DAYS + LOOKBACK_DAYS days it's expected to find at least one paper
    console.log(
      `Found ${papers.length} papers across categories: ${categories.join(
        ", "
      )}.`
    );
  }, 60_000); // Increase timeout for this test
});
