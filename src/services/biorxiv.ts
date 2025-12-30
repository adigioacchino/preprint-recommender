import type { PreprintPaper } from "../types.js";

/**
 * Fetches recent papers from a single bioRxiv category.
 * @param category - The bioRxiv category to fetch papers from (e.g., "bioinformatics").
 * @param lookBackDays - Number of days to look back for recent papers (default: 1).
 * @param offsetDays - Number of days to offset the look back period (default: 7).
 * @param verbose - Whether to log messages during fetching (default: false).
 * @returns Array of preprint papers from the specified category.
 */
export async function fetchRecentPapersBiorxivCategory(
  category: string,
  lookBackDays: number = 1,
  offsetDays: number = 7,
  verbose: boolean = false
): Promise<PreprintPaper[]> {
  if (verbose) {
    console.log(
      `Fetching papers uploaded to bioRxiv in the last ${lookBackDays} days ` +
        `with an offset of ${offsetDays} days for category: ${category}...`
    );
  }

  // Get date strings for the API query
  // offsetDate is the end date (today - offsetDays)
  // pastDate is the start date (offsetDate - lookBackDays)
  const offsetDate = new Date();
  offsetDate.setDate(offsetDate.getDate() - offsetDays);
  const offsetDateStr = offsetDate.toISOString().split("T")[0];
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - (lookBackDays + offsetDays - 1)); // -1 because in query /yyy-mm-dd/yyyy-mm-dd is inclusive
  const pastDateStr = pastDate.toISOString().split("T")[0];
  if (verbose) {
    console.log(
      `Filtering papers published between ${pastDateStr} and ${offsetDateStr}.`
    );
  }

  // bioRxiv API URL
  const baseBiorxivUrl = `https://api.biorxiv.org/details/biorxiv/${pastDateStr}/${offsetDateStr}`;
  const categoryParam = `?category=${category}`;

  // Fetch and process the data
  try {
    const response = await fetch(baseBiorxivUrl + categoryParam);
    const data = await response.json();

    const totalResults = data.messages[0].total;

    let fetchedPapers: PreprintPaper[] = data.collection.map((item) => ({
      title: item.title,
      abstract: item.abstract,
      authors: item.authors.split("; ").map((author: string) => author.trim()),
      published: new Date(item.date),
      link: `https://www.biorxiv.org/content/${item.doi}v${item.version}`,
    }));

    // Deal with pagination if needed: bioRxiv returns max 100 results per page
    while (fetchedPapers.length < totalResults) {
      const pagedUrl = `${baseBiorxivUrl}/${fetchedPapers.length}${categoryParam}`;
      const pagedResponse = await fetch(pagedUrl);
      const pagedData = await pagedResponse.json();
      const pagedPapers: PreprintPaper[] = pagedData.collection.map((item) => ({
        title: item.title,
        abstract: item.abstract,
        authors: item.authors
          .split("; ")
          .map((author: string) => author.trim()),
        published: new Date(item.date),
        link: `https://www.biorxiv.org/content/${item.doi}v${item.version}`,
      }));
      fetchedPapers = fetchedPapers.concat(pagedPapers);
    }
    if (verbose) {
      console.log(
        `Fetched ${fetchedPapers.length} papers from bioRxiv for category: ${category}`
      );
    }

    return fetchedPapers;
  } catch (error) {
    console.error("Error fetching bioRxiv data:", error);
    return []; // Return empty list on failure
  }
}

/**
 * Fetches recent papers from multiple bioRxiv categories.
 * @param categories - Array of bioRxiv categories to fetch papers from.
 * @param lookBackDays - Number of days to look back for recent papers (default: 1).
 * @param offsetDays - Number of days to offset the look back period (default: 7).
 * @param dropDuplicatePapers - Whether to remove duplicate papers across categories (default: true).
 * @param verbose - Whether to log messages during fetching (default: false).
 * @returns Array of preprint papers from all specified categories.
 */
export async function fetchRecentPapersBiorxiv(
  categories: string[],
  lookBackDays: number = 1,
  offsetDays: number = 7,
  dropDuplicatePapers: boolean = true,
  verbose: boolean = false
): Promise<PreprintPaper[]> {
  let allPapers: PreprintPaper[] = [];

  for (const category of categories) {
    const papers = await fetchRecentPapersBiorxivCategory(
      category,
      lookBackDays,
      offsetDays,
      verbose
    );
    allPapers = allPapers.concat(papers);
  }

  if (dropDuplicatePapers) {
    // Remove duplicate papers based on their link
    const uniquePapersMap: { [link: string]: PreprintPaper } = {};
    for (const paper of allPapers) {
      uniquePapersMap[paper.link] = paper;
    }
    allPapers = Object.values(uniquePapersMap);
  }

  console.log(`Total unique papers fetched from bioRxiv: ${allPapers.length}`);
  return allPapers;
}
