/**
 * Represents a preprint paper fetched from arXiv or bioRxiv.
 */
export interface PreprintPaper {
  /** The title of the paper. */
  title: string;
  /** The abstract/summary of the paper. */
  abstract: string;
  /** List of author names. */
  authors: string[];
  /** The publication/submission date. */
  published: Date;
  /** URL link to the paper. */
  link: string;
  /** Embedding vector for similarity computations (populated after embedding). */
  embedding?: number[];
}

/**
 * Represents a seed paper used as a reference for finding similar preprints.
 */
export interface SeedPaper {
  /** The title of the seed paper. */
  title: string;
  /** The abstract/summary of the seed paper. */
  abstract: string;
  /** Embedding vector for similarity computations (populated after embedding). */
  embedding?: number[];
}

/**
 * A preprint paper that matched a seed paper based on similarity threshold.
 */
export interface MatchingPaper extends PreprintPaper {
  /** The seed paper this preprint is most similar to. */
  closestSeed: SeedPaper;
  /** Raw cosine similarity score (0-1). */
  rawSimilarity: number;
  /** Rescaled similarity as a percentage (0-100) above threshold. */
  rescaledSimilarity: number;
}

/**
 * Configuration options for the preprint-recommender CLI.
 * Can be specified via config file or CLI arguments.
 */
export interface ConfigOptions {
  /** Folder containing seed paper JSON files. */
  seedFolder?: string;
  /** List of arXiv categories to fetch papers from (e.g., ["cs.AI", "cs.LG"]). */
  arxivCategories?: string[];
  /** List of bioRxiv categories to fetch papers from (e.g., ["bioinformatics"]). */
  biorxivCategories?: string[];
  /** Number of days to look back for recent papers. */
  lookBack?: string;
  /** Maximum number of papers to fetch from arXiv per category. */
  maxResults?: string;
  /** Whether to enable verbose logging during fetching and embedding. */
  verbose?: boolean;
}
