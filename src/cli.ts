#!/usr/bin/env node
import { Command } from "commander";
import { fetchRecentPapers } from "./services/arxiv.js";
import { embedPaper } from "./services/embedder.js";

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
  .option(
    "-l --look-back <days>",
    "Number of days to look back for papers (default: 1)",
    "1"
  )
  .option(
    "-m --max-results <results>",
    "Maximum number of papers to fetch (default: 50)",
    "50"
  )
  .action(async (options) => {
    const categories = options.categories;
    const lookBackDays = parseInt(options.lookBack);
    const maxResults = parseInt(options.maxResults);
    console.log(
      `Fetching daily papers for categories: ${categories.join(", ")}`
    );
    const papers = await fetchRecentPapers(
      categories,
      maxResults,
      lookBackDays
    );
    console.log(`Fetched ${papers.length} papers.`);
    for (const paper of papers) {
      await embedPaper(paper);
      console.log(`Embedded paper: ${paper.title}`);
    }
    console.log("All papers have been embedded.");
  });

program.parse();
