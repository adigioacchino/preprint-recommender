#!/usr/bin/env node
import { Command } from "commander";
import cliProgress from "cli-progress";

import { fetchRecentPapersArxiv } from "./services/arxiv.js";
import { fetchRecentPapersBiorxiv } from "./services/biorxiv.js";
import { getConfig } from "./services/config-loader.js";
import { embedPaper } from "./services/embedder.js";
import { loadSeedPapers } from "./services/load-seed-papers.js";
import {
  getClosestSeed,
  getSimilarityThreshold,
} from "./services/similarity.js";
import type { MatchingPaper } from "./types.js";

const program = new Command();

program
  .name("preprint-recommender")
  .description(
    "A CLI tool to fetch and embed daily preprints from arXiv using Google GenAI."
  )
  .version("1.0.0");

program
  .command("run")
  .option(
    "-c --config <path>",
    "Path to a JSON config file. Defaults to preprint-recommender-config.json in cwd."
  )
  .option(
    "-s --seed-folder <folder>",
    "Folder containing seed papers of interest."
  )
  .option(
    "--arxiv-categories <categories...>",
    "Space-separated list of arXiv categories to fetch papers from (e.g., cs.AI cs.LG)."
  )
  .option(
    "--biorxiv-categories <categories...>",
    "Space-separated list of bioRxiv categories to fetch papers from (e.g., bioinformatics microbiology)."
  )
  .option(
    "-l --look-back <days>",
    "Number of days to look back for papers (default: 1)."
  )
  .option(
    "-m --max-results <results>",
    "Maximum number of papers to fetch from arxiv (default: 500)."
  )
  .option(
    "-v --verbose",
    "Enable verbose logging during fetching and embedding."
  )
  .action(async (options) => {
    // Load config from file and merge with CLI options
    const config = getConfig(options);

    // Parsed options with defaults
    const arxivCategories = config.arxivCategories;
    const biorxivCategories = config.biorxivCategories;
    const seedFolder = config.seedFolder;
    const lookBackDays = parseInt(config.lookBack ?? "1");
    const maxResults = parseInt(config.maxResults ?? "500");
    const verbose = options.verbose ?? false;

    // Validate required options
    if (!seedFolder) {
      console.error(
        "Error: --seed-folder is required (via CLI or config file)."
      );
      process.exit(1);
    }

    // Fetch papers from preprint servers
    // One between arxivCategories and biorxivCategories must be provided
    if (
      (!arxivCategories || arxivCategories.length === 0) &&
      (!biorxivCategories || biorxivCategories.length === 0)
    ) {
      console.error(
        "Error: At least one of --arxiv-categories or --biorxiv-categories must be provided."
      );
      process.exit(1);
    }
    // Arxiv
    const preprintPapers = await fetchRecentPapersArxiv(
      arxivCategories,
      maxResults,
      lookBackDays,
      true, // drop duplicate papers
      verbose
    );
    // Biorxiv
    preprintPapers.push(
      ...(await fetchRecentPapersBiorxiv(
        biorxivCategories,
        lookBackDays,
        true, // drop duplicate papers
        verbose
      ))
    );
    console.log(
      `Fetched ${preprintPapers.length} papers from preprint servers.`
    );

    // Load seed papers
    const seedPapers = await loadSeedPapers(seedFolder);
    console.log(`Loaded ${seedPapers.length} seed papers.`);

    // Embed papers
    // Preprints first
    console.log("Embedding preprints...");
    const preprintBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    preprintBar.start(preprintPapers.length, 0);
    for (const [index, paper] of preprintPapers.entries()) {
      await embedPaper(paper);
      preprintBar.update(index + 1);
    }
    preprintBar.stop();
    console.log("Preprints embedded.");
    // Seed papers second
    console.log("Embedding seed papers...");
    const seedBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    seedBar.start(seedPapers.length, 0);
    for (const [index, paper] of seedPapers.entries()) {
      seedBar.update(index + 1);
      await embedPaper(paper);
    }
    seedBar.stop();
    console.log("Seed papers embedded.");
    console.log("All papers have been embedded.");

    // Get thresholds for seed papers
    const similarityThreshold = getSimilarityThreshold(seedPapers);
    console.log(
      `Computed similarity threshold: ${similarityThreshold.toFixed(4)}`
    );

    // Find and display closest seed paper for each preprint
    console.log("Finding closest seed papers for each preprint...");
    const matchingPapers: MatchingPaper[] = [];
    for (const preprint of preprintPapers) {
      const result = getClosestSeed(preprint, seedPapers);
      if (result && result.similarity >= similarityThreshold) {
        // Get a 0-100 scale for similarity
        const similarityPercent =
          ((result.similarity - similarityThreshold) /
            (1 - similarityThreshold)) *
          100;

        // Store the matching paper
        matchingPapers.push({
          ...preprint,
          closestSeed: result.closestSeed,
          rawSimilarity: result.similarity,
          rescaledSimilarity: similarityPercent,
        });
      }
    }

    // Print results: matching papers grouped by closest seed paper
    // and sorted by rescaled similarity
    console.log("Matching papers:");

    // Group papers by seed title
    const papersBySeed: Record<string, MatchingPaper[]> = {};
    for (const paper of matchingPapers) {
      const seedTitle = paper.closestSeed.title;
      if (!papersBySeed[seedTitle]) {
        papersBySeed[seedTitle] = [];
      }
      papersBySeed[seedTitle].push(paper);
    }

    // Print grouped results
    for (const [seedTitle, papers] of Object.entries(papersBySeed)) {
      console.log(`\nSeed Paper: "${seedTitle}"`);
      // Sort papers by rescaled similarity descending
      papers.sort((a, b) => b.rescaledSimilarity - a.rescaledSimilarity);
      for (const paper of papers) {
        console.log(
          `  Preprint: "${
            paper.title
          }" - Similarity (0-100%): ${paper.rescaledSimilarity.toFixed(
            2
          )}%. Link: ${paper.link}`
        );
      }
      console.log("\n");
    }
  });

program.parse();
