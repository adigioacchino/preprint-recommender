#!/usr/bin/env node
import { Command } from "commander";
import { fetchRecentPapers } from "./services/arxiv.js";
import { embedPaper } from "./services/embedder.js";
import { loadSeedPapers } from "./services/load-seed-papers.js";

const program = new Command();

program
  .name("preprint-recommender")
  .description(
    "A CLI tool to fetch and embed daily preprints from arXiv using Google GenAI."
  )
  .version("1.0.0");

program
  .command("run")
  .requiredOption(
    "-c --categories <categories...>",
    "Space-separated list of arXiv categories to fetch papers from (e.g., cs.AI cs.LG)."
  )
  .requiredOption(
    "-s --seed-folder <folder>",
    "Folder containing seed papers of interest."
  )
  .option(
    "-l --look-back <days>",
    "Number of days to look back for papers (default: 1).",
    "1"
  )
  .option(
    "-m --max-results <results>",
    "Maximum number of papers to fetch (default: 500).",
    "500"
  )
  .action(async (options) => {
    // Parsed options
    const categories = options.categories;
    const seedFolder = options.seedFolder;
    const lookBackDays = parseInt(options.lookBack);
    const maxResults = parseInt(options.maxResults);
    console.log(
      `Fetching daily papers for categories: ${categories.join(", ")}`
    );

    // Fetch papers from preprint servers
    const preprintPapers = await fetchRecentPapers(
      categories,
      maxResults,
      lookBackDays
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
    for (const paper of preprintPapers) {
      await embedPaper(paper);
      console.log(`Embedded paper: ${paper.title}`);
    }
    console.log("Preprints embedded.");
    // Seed papers second
    console.log("Embedding seed papers...");
    for (const paper of seedPapers) {
      await embedPaper(paper);
      console.log(`Embedded paper: ${paper.title}`);
    }
    console.log("Seed papers embedded.");
    console.log("All papers have been embedded.");
  });

program.parse();
