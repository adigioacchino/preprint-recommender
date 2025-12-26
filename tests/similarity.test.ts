import { describe, it, expect } from "vitest";
import {
  getClosestSeed,
  getSimilarityThreshold,
} from "../src/services/similarity.js";
import type { PreprintPaper, SeedPaper } from "../src/types.js";

// Helper to create mock embeddings (unit vectors for predictable cosine similarity)
function createMockEmbedding(values: number[]): number[] {
  // Normalize to unit vector
  const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return values.map((v) => v / magnitude);
}

describe("getClosestSeed", () => {
  const mockSeedPapers: SeedPaper[] = [
    {
      title: "Seed Paper A",
      abstract: "About topic A",
      embedding: createMockEmbedding([1, 0, 0]),
    },
    {
      title: "Seed Paper B",
      abstract: "About topic B",
      embedding: createMockEmbedding([0, 1, 0]),
    },
    {
      title: "Seed Paper C",
      abstract: "About topic C",
      embedding: createMockEmbedding([0, 0, 1]),
    },
  ];

  it("should find the closest seed paper", () => {
    const preprint: PreprintPaper = {
      title: "Test Preprint",
      abstract: "Test abstract",
      authors: ["Author 1"],
      published: new Date(),
      link: "https://example.com",
      embedding: createMockEmbedding([1, 0.1, 0]), // Close to Seed A
    };

    const result = getClosestSeed(preprint, mockSeedPapers);

    expect(result).not.toBeNull();
    expect(result?.closestSeed.title).toBe("Seed Paper A");
    expect(result?.similarity).toBeGreaterThan(0.9);
  });

  it("should return correct similarity for exact match", () => {
    const preprint: PreprintPaper = {
      title: "Test Preprint",
      abstract: "Test abstract",
      authors: ["Author 1"],
      published: new Date(),
      link: "https://example.com",
      embedding: createMockEmbedding([0, 1, 0]), // Exact match with Seed B
    };

    const result = getClosestSeed(preprint, mockSeedPapers);

    expect(result).not.toBeNull();
    expect(result?.closestSeed.title).toBe("Seed Paper B");
    expect(result?.similarity).toBeCloseTo(1.0, 5);
  });

  it("should return null when preprint has no embedding", () => {
    const preprint: PreprintPaper = {
      title: "Test Preprint",
      abstract: "Test abstract",
      authors: ["Author 1"],
      published: new Date(),
      link: "https://example.com",
      embedding: null,
    };

    const result = getClosestSeed(preprint, mockSeedPapers);

    expect(result).toBeNull();
  });

  it("should return null when no seed papers have embeddings", () => {
    const preprint: PreprintPaper = {
      title: "Test Preprint",
      abstract: "Test abstract",
      authors: ["Author 1"],
      published: new Date(),
      link: "https://example.com",
      embedding: createMockEmbedding([1, 0, 0]),
    };

    const seedsWithoutEmbeddings: SeedPaper[] = [
      { title: "Seed 1", abstract: "Abstract 1", embedding: null },
      { title: "Seed 2", abstract: "Abstract 2", embedding: null },
    ];

    const result = getClosestSeed(preprint, seedsWithoutEmbeddings);

    expect(result).toBeNull();
  });

  it("should skip seed papers without embeddings", () => {
    const preprint: PreprintPaper = {
      title: "Test Preprint",
      abstract: "Test abstract",
      authors: ["Author 1"],
      published: new Date(),
      link: "https://example.com",
      embedding: createMockEmbedding([0, 0, 1]), // Close to Seed C
    };

    const mixedSeeds: SeedPaper[] = [
      { title: "Seed No Emb", abstract: "No embedding", embedding: null },
      ...mockSeedPapers,
    ];

    const result = getClosestSeed(preprint, mixedSeeds);

    expect(result).not.toBeNull();
    expect(result?.closestSeed.title).toBe("Seed Paper C");
  });
});

describe("getSimilarityThreshold", () => {
  it("should compute 10th percentile of pairwise similarities", () => {
    // Create seed papers with known embeddings
    const seedPapers: SeedPaper[] = [
      {
        title: "Seed 1",
        abstract: "Abstract",
        embedding: createMockEmbedding([1, 0, 0]),
      },
      {
        title: "Seed 2",
        abstract: "Abstract",
        embedding: createMockEmbedding([0, 1, 0]),
      },
      {
        title: "Seed 3",
        abstract: "Abstract",
        embedding: createMockEmbedding([0, 0, 1]),
      },
      {
        title: "Seed 4",
        abstract: "Abstract",
        embedding: createMockEmbedding([1, 1, 0]),
      },
    ];

    const threshold = getSimilarityThreshold(seedPapers);

    // With 4 papers, we have 6 pairwise similarities
    // 90% of 6 = 5.4, floor = 5, so threshold is the second highest similarity
    expect(threshold).toBeGreaterThanOrEqual(0);
    expect(threshold).toBeLessThanOrEqual(1);
    expect(threshold).toBeCloseTo(1 / Math.sqrt(2), 4); // Similarity between [1,0,0] and [1,1,0]
  });

  it("should throw error when no seed papers have embeddings", () => {
    const seedPapers: SeedPaper[] = [
      { title: "Seed 1", abstract: "Abstract", embedding: null },
      { title: "Seed 2", abstract: "Abstract", embedding: null },
    ];

    expect(() => getSimilarityThreshold(seedPapers)).toThrow(
      "No pairwise similarities could be computed"
    );
  });

  it("should throw error when only one seed paper has embedding", () => {
    const seedPapers: SeedPaper[] = [
      {
        title: "Seed 1",
        abstract: "Abstract",
        embedding: createMockEmbedding([1, 0, 0]),
      },
      { title: "Seed 2", abstract: "Abstract", embedding: null },
    ];

    expect(() => getSimilarityThreshold(seedPapers)).toThrow(
      "No pairwise similarities could be computed"
    );
  });

  it("should throw error for empty seed papers array", () => {
    expect(() => getSimilarityThreshold([])).toThrow(
      "No pairwise similarities could be computed"
    );
  });

  it("should compute correct threshold for similar papers", () => {
    // Create papers that are all similar to each other
    const seedPapers: SeedPaper[] = [
      {
        title: "Seed 1",
        abstract: "Abstract",
        embedding: createMockEmbedding([1, 0.9, 0.8]),
      },
      {
        title: "Seed 2",
        abstract: "Abstract",
        embedding: createMockEmbedding([0.9, 1, 0.85]),
      },
      {
        title: "Seed 3",
        abstract: "Abstract",
        embedding: createMockEmbedding([0., 0.4, -0.2]),
      },
    ];

    const threshold = getSimilarityThreshold(seedPapers);

    // First two papers are similar, so threshold should be high
    expect(threshold).toBeGreaterThan(0.9);
  });
});
