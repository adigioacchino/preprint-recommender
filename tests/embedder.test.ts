import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

import * as embedderModule from "../src/services/embedder.js";
import type { PreprintPaper } from "../src/types.js";

const hasApiKey = !!process.env.GENAI_API_KEY;

describe("Embedder Service", () => {
  beforeAll(() => {
    if (!hasApiKey) {
      console.warn(
        "⚠️  GENAI_API_KEY not set - using mocked embedder for tests"
      );
      vi.spyOn(embedderModule, "embedPaper").mockImplementation(
        async (paper) => {
          paper.embedding = new Array(3072).fill(0);
        }
      );
    }
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("embed mock paper", async () => {
    const mockPaper: PreprintPaper = {
      title: "A Novel Approach to Machine Learning",
      abstract:
        "This paper presents a novel approach to machine learning that significantly improves performance on benchmark datasets.",
      authors: ["Alice Smith", "Bob Johnson"],
      published: new Date(),
      link: "http://arxiv.org/abs/1234.5678v1",
    };
    await embedderModule.embedPaper(mockPaper, true);
    expect(mockPaper.embedding).toBeDefined();
    expect(Array.isArray(mockPaper.embedding)).toBe(true);
    expect(mockPaper.embedding?.length).toBe(3072);
  });
});
