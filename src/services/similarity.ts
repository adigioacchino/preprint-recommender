import { cosineSimilarity } from "fast-cosine-similarity";
import type { PreprintPaper, SeedPaper } from "../types";

/**
 * Finds the seed paper most similar to a given preprint.
 * @param preprint - The preprint paper to find a match for.
 * @param seedPapers - Array of seed papers to compare against.
 * @returns The closest seed paper and similarity score, or null if no match found.
 */
export function getClosestSeed(
  preprint: PreprintPaper,
  seedPapers: SeedPaper[]
): { closestSeed: SeedPaper; similarity: number } | null {
  let closestSeed: SeedPaper | null = null;
  let highestSimilarity = -1;

  // Collect the preprint embedding
  const paperEmbedding = preprint.embedding;
  if (!paperEmbedding) {
    console.warn(
      `Preprint paper "${preprint.title}" has no embedding. Skipping similarity computation.`
    );
    return null; // No embedding available
  }

  // Compute similarity with each seed paper
  // and find the closest one
  for (const seed of seedPapers) {
    if (seed.embedding) {
      const similarity = cosineSimilarity(paperEmbedding, seed.embedding);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        closestSeed = seed;
      }
    }
  }

  // Return the closest seed paper and its similarity score
  // or null if no seed papers had embeddings
  if (closestSeed) {
    return { closestSeed, similarity: highestSimilarity };
  } else {
    console.warn("No seed papers with embeddings found.");
    return null;
  }
}

/**
 * Computes a similarity threshold based on pairwise similarities between seed papers.
 * Uses the 90th percentile of pairwise similarities as the threshold.
 * @param seedPapers - Array of seed papers with embeddings.
 * @returns The computed similarity threshold.
 * @throws Error if fewer than two seed papers have embeddings.
 */
export function getSimilarityThreshold(seedPapers: SeedPaper[]): number {
  // Collect all pairwise similarities
  const similarities: number[] = [];
  for (let i = 0; i < seedPapers.length; i++) {
    for (let j = i + 1; j < seedPapers.length; j++) {
      const emb1 = seedPapers[i].embedding;
      const emb2 = seedPapers[j].embedding;
      if (emb1 && emb2) {
        const sim = cosineSimilarity(emb1, emb2);
        similarities.push(sim);
      }
    }
  }
  if (similarities.length === 0) {
    throw new Error(
      "No pairwise similarities could be computed. Need at least two seed papers with embeddings."
    );
  }

  // Sort similarities and get the 90% percentile
  similarities.sort((a, b) => a - b);
  const index = Math.floor(similarities.length * 0.9);
  return similarities[index];
}
