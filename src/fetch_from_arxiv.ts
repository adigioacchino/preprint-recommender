import { XMLParser } from 'fast-xml-parser';
import { argv } from 'process';
import { fileURLToPath } from 'url';
import path from 'path';

export interface ArxivPaper {
    id: string;
    title: string;
    abstract: string;
    authors: string[];
    published: Date;
    link: string;
}

export async function fetchDailyPapers(category: string = 'cs.LG'): Promise<ArxivPaper[]> {
    console.log(`Fetching papers for category: ${category}...`);
    // Settings
    const MAX_RESULTS = 50; // Number of results to fetch per request

    // Arxiv API query
    // Sorting rules
    const sortBy = 'submittedDate';
    const sortOrder = 'descending';
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
            attributeNamePrefix: ""
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
        // We transform the raw API data into our clean "ArxivPaper" format.
        // .map() is equivalent to a Python list comprehension [x for x in entries]
        const cleanPapers: ArxivPaper[] = entries.map((entry: any) => ({
            id: entry.id,
            title: entry.title.replace(/\n/g, ' ').trim(), // Remove newlines and trim spaces
            abstract: entry.summary.replace(/\n/g, ' ').trim(), // Remove newlines and trim spaces
            // Authors can be a single object or an array, convert accordingly
            authors: Array.isArray(entry.author)
                ? entry.author.map((author: any) => author.name)
                : [entry.author.name],
            // Convert published string to Date object
            published: new Date(entry.published),
            link: entry.id
        }));

        return cleanPapers;

    } catch (error) {
        console.error("Error fetching arxiv data:", error);
        return []; // Return empty list on failure
    }
}

// --- TEST CODE (To run this file directly) ---
// This block checks if this file is being run directly
// An ESM-friendly alternative to `require.main === module`
const isMainModule = (url: string, argv: string[]) => {
    // Convert file:// URL to system path
    const currentFilePath = fileURLToPath(url);
    // argv[1] is the executed script path. 
    // We resolve both to absolute paths to be safe.
    const executedScriptPath = path.resolve(argv[1]);

    return currentFilePath === executedScriptPath;
};

if (isMainModule(import.meta.url, argv)) {
    const metaUrl = import.meta.url; // Assign to variable for easier debugging
    fetchDailyPapers('cs.AI').then(papers => {
        console.log(`Found ${papers.length} papers.`);
        if (papers.length > 0) {
            console.log("First paper title:", papers[0].title);
        }
    });
}
