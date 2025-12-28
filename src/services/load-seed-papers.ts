import fs from "fs/promises";
import path from "path";
import type { SeedPaper } from "../types.js";

/**
 * Loads seed papers from JSON files in a folder.
 * Each JSON file should contain a title and abstract field.
 * Files missing required fields or with parse errors are skipped with a warning.
 * @param seedFolder - Path to the folder containing seed paper JSON files.
 * @returns Array of valid seed papers.
 */
export async function loadSeedPapers(seedFolder: string): Promise<SeedPaper[]> {
  // Load seed papers from seedFolder
  const seedFiles = await fs.readdir(seedFolder);

  // Map each file to a promise that reads and parses its content
  const seedPapersPromises = seedFiles.map(async (seedFile) => {
    const seedFilePath = path.join(seedFolder, seedFile);
    try {
      const seedFileContent = await fs.readFile(seedFilePath, "utf-8");
      const paper = JSON.parse(seedFileContent) as Partial<SeedPaper>;
      if (paper.title && paper.abstract) {
        return {
          title: paper.title,
          abstract: paper.abstract,
          embedding: paper.embedding,
        } as SeedPaper;
      } else {
        console.warn(
          `Seed paper file ${seedFilePath} is missing required fields. Skipping.`
        );
        return null;
      }
    } catch (error) {
      console.error(`Error reading seed paper file ${seedFilePath}:`, error);
      return null;
    }
  });

  // Resolve all promises in parallel
  return Promise.all(seedPapersPromises).then((papers) => {
    // Filter out null values
    return papers.filter((paper) => paper !== null);
  });
}
