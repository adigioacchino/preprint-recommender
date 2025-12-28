import { describe, it, expect } from "vitest";
import {
  fetchRecentPapersArxiv,
  fetchRecentPapersArxivArxivCategory,
} from "../src/services/arxiv.js";

describe("Arxiv Fetcher", () => {
  it.each([
    ["cs.AI"], // Artificial Intelligence
    ["cs.LG"], // Machine Learning
    ["cs.CV"], // Computer Vision
  ])("fetch papers from Arxiv [%s]", async (category) => {
    console.log(`Testing category: ${category}`);
    const papers = await fetchRecentPapersArxivArxivCategory(category, 50, 7);

    expect(papers).toBeDefined();
    expect(Array.isArray(papers)).toBe(true);

    console.log(`Found ${papers.length} papers in ${category}.`);

    expect(papers.length).toBeGreaterThan(0); // Over the last 7 days it's expected to find at least one paper

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
      }
    }

    // Sleep for 3 seconds to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  it("fetch papers from Arxiv [multiple categories]", async () => {
    const categories = ["cs.AI", "cs.LG", "cs.CV"];
    const papers = await fetchRecentPapersArxiv(categories, 50, 7, true);

    expect(papers).toBeDefined();
    expect(Array.isArray(papers)).toBe(true);

    expect(papers.length).toBeGreaterThan(0); // Over the last 7 days it's expected to find at least one paper

    console.log(
      `Found ${papers.length} papers across categories: ${categories.join(
        ", "
      )}.`
    );
  }, 15_000); // Increase timeout for this test
});
