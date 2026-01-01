import { describe, it, expect } from "vitest";
import {
  fetchRecentPapersArxiv,
  fetchRecentPapersArxivArxivCategory,
} from "../src/services/arxiv.js";
import { getPreprintDateRange } from "../src/utils/date.js";

// Test params
const OFFSET_DAYS = 4;
const LOOKBACK_DAYS = 3;
const MAX_RESULTS = 800;

describe("Arxiv Fetcher", () => {
  it.each([
    ["cs.AI"], // Artificial Intelligence
    ["cs.LG"], // Machine Learning
  ])(
    "fetch papers from Arxiv [%s]",
    async (category) => {
      console.log(`Testing category: ${category}`);
      const papers = await fetchRecentPapersArxivArxivCategory(
        category,
        MAX_RESULTS,
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
          expect(paper).toHaveProperty("id");
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
    10_000
  ); // Increase timeout for this test

  it("fetch papers from Arxiv [multiple categories]", async () => {
    const categories = ["cs.AI", "cs.LG"];
    const papers = await fetchRecentPapersArxiv(
      categories,
      MAX_RESULTS,
      LOOKBACK_DAYS,
      OFFSET_DAYS,
      true
    );

    expect(papers).toBeDefined();
    expect(Array.isArray(papers)).toBe(true);

    expect(papers.length).toBeGreaterThan(0); // Over the last OFFSET_DAYS + LOOKBACK_DAYS days it's expected to find at least one paper

    console.log(
      `Found ${papers.length} papers across categories: ${categories.join(
        ", "
      )}.`
    );
  }, 20_000); // Increase timeout for this test
});
