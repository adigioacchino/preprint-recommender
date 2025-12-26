import { XMLParser } from "fast-xml-parser";
import type { PreprintPaper } from "../types.js";

export async function fetchDailyPapersCategory(
  category: string
): Promise<PreprintPaper[]> {
  console.log(`Fetching papers for category: ${category}...`);
  // Settings
  const MAX_RESULTS = 50; // Number of results to fetch per request

  // Arxiv API query
  // Sorting rules
  const sortBy = "submittedDate";
  const sortOrder = "descending";
  // Put together the full URL
  const arxivUrl = `http://export.arxiv.org/api/query?search_query=cat:${category}&start=0&max_results=${MAX_RESULTS}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

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
    const cleanPapers: PreprintPaper[] = entries.map((entry: any) => ({
      id: entry.id,
      title: entry.title.replace(/\n/g, " ").trim(), // Remove newlines and trim spaces
      abstract: entry.summary.replace(/\n/g, " ").trim(), // Remove newlines and trim spaces
      // Authors can be a single object or an array, convert accordingly
      authors: Array.isArray(entry.author)
        ? entry.author.map((author: any) => author.name)
        : [entry.author.name],
      // Convert published string to Date object
      published: new Date(entry.published),
      link: entry.id,
      embedding: null,
    }));

    // Only keep papers published in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPapers = cleanPapers.filter(
      (paper) => paper.published > oneDayAgo
    );

    console.log(
      `Fetched ${recentPapers.length} recent papers from Arxiv in category ${category}.`
    );

    return recentPapers;
  } catch (error) {
    console.error("Error fetching arxiv data:", error);
    return []; // Return empty list on failure
  }
}

export async function fetchDailyPapers(
  categories: string[]
): Promise<PreprintPaper[]> {
  let allPapers: PreprintPaper[] = [];
  for (const category of categories) {
    const papers = await fetchDailyPapersCategory(category);
    allPapers = allPapers.concat(papers);
    // Sleep for 3 seconds to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Remove duplicate papers based on their link
  const uniquePapersMap: { [link: string]: PreprintPaper } = {};
  for (const paper of allPapers) {
    uniquePapersMap[paper.link] = paper;
  }
  allPapers = Object.values(uniquePapersMap);

  return allPapers;
}
