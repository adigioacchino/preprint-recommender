export interface PreprintPaper {
  title: string;
  abstract: string;
  authors: string[];
  published: Date;
  link: string;
  embedding: number[] | null;
}

export interface SeedPaper {
  title: string;
  abstract: string;
  embedding: number[] | null;
}

export interface MatchingPaper extends PreprintPaper {
  closestSeed: SeedPaper;
  rawSimilarity: number;
  rescaledSimilarity: number;
}
