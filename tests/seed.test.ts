import fs from "fs/promises";
import path from "path";
import os from "os";

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { loadSeedPapers } from "../src/services/load-seed-papers.js";

describe("loadSeedPapers", () => {
  let testDir: string;

  beforeAll(async () => {
    // Create a temporary directory for test files
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "seed-papers-test-"));
  });

  afterAll(async () => {
    // Clean up temporary directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should load valid seed papers", async () => {
    // Create 3 valid seed paper files
    const validPapers = [
      {
        title: "Quantum Computing Advances",
        abstract: "A study on recent quantum computing breakthroughs.",
        embedding: [0.1, 0.2, 0.3],
      },
      {
        title: "Machine Learning in Healthcare",
        abstract: "Applications of ML in medical diagnosis.",
      },
      {
        title: "Climate Change Modeling",
        abstract: "New approaches to climate prediction models.",
      },
    ];

    for (let i = 0; i < validPapers.length; i++) {
      await fs.writeFile(
        path.join(testDir, `valid-paper-${i}.json`),
        JSON.stringify(validPapers[i])
      );
    }

    const result = await loadSeedPapers(testDir);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("abstract");
    expect(result[0]).toHaveProperty("embedding");

    // Check that paper without embedding gets undefined embedding
    const mlPaper = result.find(
      (p) => p.title === "Machine Learning in Healthcare"
    );
    expect(mlPaper?.embedding).toBeUndefined();
    const climateChangePaper = result.find(
      (p) => p.title === "Climate Change Modeling"
    );
    expect(climateChangePaper?.embedding).toBeUndefined();
  });

  it("should skip papers missing required fields", async () => {
    const subDir = path.join(testDir, "missing-fields");
    await fs.mkdir(subDir);

    // Valid paper
    await fs.writeFile(
      path.join(subDir, "valid.json"),
      JSON.stringify({
        title: "Valid Paper",
        abstract: "This is valid.",
      })
    );

    // Missing title
    await fs.writeFile(
      path.join(subDir, "missing-title.json"),
      JSON.stringify({
        abstract: "No title here.",
      })
    );

    // Missing abstract
    await fs.writeFile(
      path.join(subDir, "missing-abstract.json"),
      JSON.stringify({
        title: "No abstract here",
      })
    );

    // Empty object
    await fs.writeFile(path.join(subDir, "empty.json"), JSON.stringify({}));

    const result = await loadSeedPapers(subDir);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Valid Paper");
  });

  it("should handle malformed JSON files", async () => {
    const subDir = path.join(testDir, "malformed");
    await fs.mkdir(subDir);

    // Valid paper
    await fs.writeFile(
      path.join(subDir, "valid.json"),
      JSON.stringify({
        title: "Valid Paper",
        abstract: "This is valid.",
      })
    );

    // Malformed JSON
    await fs.writeFile(
      path.join(subDir, "malformed.json"),
      "{ invalid json content"
    );

    // Another malformed JSON
    await fs.writeFile(path.join(subDir, "not-json.txt"), "just plain text");

    const result = await loadSeedPapers(subDir);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Valid Paper");
  });

  it("should return empty array for empty directory", async () => {
    const emptyDir = path.join(testDir, "empty-dir");
    await fs.mkdir(emptyDir);

    const result = await loadSeedPapers(emptyDir);

    expect(result).toHaveLength(0);
  });
});
