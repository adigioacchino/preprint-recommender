import type { PreprintPaper } from "../types.js";

/**
 * Fetches recent papers from a single bioRxiv category.
 * @param category - The bioRxiv category to fetch papers from (e.g., "bioinformatics").
 * @param daysBack - Number of days to look back for recent papers (default: 1).
 * @param verbose - Whether to log messages during fetching (default: false).
 * @returns Array of preprint papers from the specified category.
 */
export async function fetchRecentPapersBiorxivCategory(
  category: string,
  daysBack: number = 1,
  verbose: boolean = false
): Promise<PreprintPaper[]> {
  if (verbose) {
    console.log(
      `Fetching papers uploaded to bioRxiv in the last ${daysBack} days for category: ${category}...`
    );
  }

  // Today as YYYY-MM-DD and calculate the date 'daysBack' days ago
  const today = new Date().toISOString().split("T")[0];
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - (daysBack - 1)); // Include today
  const pastDateStr = pastDate.toISOString().split("T")[0];

  // bioRxiv API URL
  const baseBiorxivUrl = `https://api.biorxiv.org/details/biorxiv/${pastDateStr}/${today}`;
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
 * @param daysBack - Number of days to look back for recent papers (default: 1).
 * @param dropDuplicatePapers - Whether to remove duplicate papers across categories (default: true).
 * @param verbose - Whether to log messages during fetching (default: false).
 * @returns Array of preprint papers from all specified categories.
 */
export async function fetchRecentPapersBiorxiv(
  categories: string[],
  daysBack: number = 1,
  dropDuplicatePapers: boolean = true,
  verbose: boolean = false
): Promise<PreprintPaper[]> {
  let allPapers: PreprintPaper[] = [];

  for (const category of categories) {
    const papers = await fetchRecentPapersBiorxivCategory(
      category,
      daysBack,
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

  console.log(`Total papers fetched from bioRxiv: ${allPapers.length}`);
  return allPapers;
}
