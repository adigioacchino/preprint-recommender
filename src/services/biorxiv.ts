import type { PreprintPaper } from "../types.js";

export async function fetchRecentPapersArxivBiorxivCategory(
  category: string,
  daysBack: number = 1
): Promise<PreprintPaper[]> {
  console.log(`Fetching bioRxiv papers from the last ${daysBack} days...`);

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
    console.log(`Total bioRxiv papers found: ${totalResults}`);

    let fetchedPapers: PreprintPaper[] = data.collection.map((item) => ({
      title: item.title,
      abstract: item.abstract,
      authors: item.authors.split("; ").map((author: string) => author.trim()),
      published: new Date(item.date),
      link: `https://www.biorxiv.org/content/${item.doi}v${item.version}`,
      embedding: null,
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
        embedding: null,
      }));
      fetchedPapers = fetchedPapers.concat(pagedPapers);
    }
    console.log(`Fetched ${fetchedPapers.length} bioRxiv papers.`);

    return fetchedPapers;
  } catch (error) {
    console.error("Error fetching bioRxiv data:", error);
    return []; // Return empty list on failure
  }
}

export async function fetchRecentPapersArxivBiorxiv(
  categories: string[],
  daysBack: number = 1
): Promise<PreprintPaper[]> {
  let allPapers: PreprintPaper[] = [];

  for (const category of categories) {
    const papers = await fetchRecentPapersArxivBiorxivCategory(category, daysBack);
    allPapers = allPapers.concat(papers);
  }
  return allPapers;
}
