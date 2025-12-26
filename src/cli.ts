#!/usr/bin/env node
import { Command } from "commander";
import { fetchDailyPapers } from "./services/arxiv.js";
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
    "-C --categories <categories...>",
    "Space-separated list of arXiv categories to fetch papers from (e.g., cs.AI cs.LG)."
  )
  .action(async (options) => {
    const categories = options.categories;
    console.log(`Fetching daily papers for categories: ${categories.join(", ")}`);
    const papers = await fetchDailyPapers(categories);
    console.log(`Fetched ${papers.length} papers.`);
    for (const paper of papers) {
      await embedPaper(paper);
      console.log(`Embedded paper: ${paper.title}`);
    }
    console.log("All papers have been embedded.");
  });

program.parse();
