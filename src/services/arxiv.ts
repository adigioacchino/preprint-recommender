import { XMLParser } from "fast-xml-parser";
import type { PreprintPaper } from "../types.js";

/**
 * Fetches recent papers from a single arXiv category.
 * @param category - The arXiv category to fetch papers from (e.g., "cs.AI").
 * @param maxResults - Maximum number of papers to fetch (default: 500).
 * @param lookBackDays - Number of days to look back for recent papers (default: 1).
 * @param verbose - Whether to log messages during fetching (default: false).
 * @returns Array of preprint papers from the specified category.
 */
export async function fetchRecentPapersArxivArxivCategory(
  category: string,
  maxResults: number = 500,
  lookBackDays: number = 1,
  verbose: boolean = false
): Promise<PreprintPaper[]> {
  if (verbose) {
    console.log(
      `Fetching papers uploaded to Arxiv in the last ${lookBackDays} days for category: ${category}...`
    );
  }
  // Arxiv API query
  // Sorting rules
  const sortBy = "submittedDate";
  const sortOrder = "descending";
  // Put together the full URL
  const arxivUrl = `http://export.arxiv.org/api/query?search_query=cat:${category}&start=0&max_results=${maxResults}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  try {
    // Await the HTTP request and response
    const arxivResponse = await fetch(arxivUrl);
    const arxivXmlData = await arxivResponse.text();

    // Parse XML to JSON
    // Arxiv returns Atom XML. We use a library to convert it to a JS Object.
    const parser = new XMLParser({
      ignoreAttributes: false, // We might need attributes later
      attributeNamePrefix: "",
    });
    const parsed = parser.parse(arxivXmlData);

    // Handle "The Array Quirk"
    // If there is only 1 result, the parser returns a single Object.
    // If there are multiple, it returns an Array.
    // We force it into an array to be safe.
    const entries = Array.isArray(parsed.feed.entry)
      ? parsed.feed.entry
      : [parsed.feed.entry];

    // Clean and Map the Data
    // We transform the raw API data into our clean "PreprintPaper" format.
    const cleanPapers: PreprintPaper[] = entries.map((entry) => ({
      id: entry.id,
      title: entry.title.replace(/\n/g, " ").trim(), // Remove newlines and trim spaces
      abstract: entry.summary.replace(/\n/g, " ").trim(), // Remove newlines and trim spaces
      // Authors can be a single object or an array, convert accordingly
      authors: Array.isArray(entry.author)
        ? entry.author.map((author) => author.name)
        : [entry.author.name],
      // Convert published string to Date object
      published: new Date(entry.published),
      link: entry.id,
    }));

    // Only keep papers published in the last 24 hours
    const oneDayAgo = new Date(Date.now() - lookBackDays * 24 * 60 * 60 * 1000);
    const recentPapers = cleanPapers.filter(
      (paper) => paper.published > oneDayAgo
    );

    if (verbose) {
      console.log(
        `Fetched ${recentPapers.length} recent papers from Arxiv in category ${category}.`
      );
    }

    return recentPapers;
  } catch (error) {
    console.error("Error fetching arxiv data:", error);
    return []; // Return empty list on failure
  }
}

/**
 * Fetches recent papers from multiple arXiv categories.
 * @param categories - Array of arXiv categories to fetch papers from.
 * @param maxResults - Maximum number of papers to fetch per category (default: 500).
 * @param lookBackDays - Number of days to look back for recent papers (default: 1).
 * @param dropDuplicatePapers - Whether to remove duplicate papers across categories (default: true).
 * @param verbose - Whether to log messages during fetching (default: false).
 * @returns Array of unique preprint papers from all specified categories.
 */
export async function fetchRecentPapersArxiv(
  categories: string[],
  maxResults: number = 500,
  lookBackDays: number = 1,
  dropDuplicatePapers: boolean = true,
  verbose: boolean = false
): Promise<PreprintPaper[]> {
  let allPapers: PreprintPaper[] = [];
  for (const category of categories) {
    const papers = await fetchRecentPapersArxivArxivCategory(
      category,
      maxResults,
      lookBackDays,
      verbose
    );
    allPapers = allPapers.concat(papers);
    // Sleep for 3 seconds to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  if (dropDuplicatePapers) {
    // Remove duplicate papers based on their link
    const uniquePapersMap: { [link: string]: PreprintPaper } = {};
    for (const paper of allPapers) {
      uniquePapersMap[paper.link] = paper;
    }
    allPapers = Object.values(uniquePapersMap);
  }

  console.log(`Total unique papers fetched from Arxiv: ${allPapers.length}`);
  return allPapers;
}
