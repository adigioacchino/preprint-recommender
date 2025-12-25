import { describe, it, expect } from 'vitest';
import { fetchDailyPapers } from '../src/fetch_from_arxiv';

describe('Arxiv Fetcher', () => {
    it('fetch papers from Arxiv', async () => {
        const category = 'cs.AI';
        const papers = await fetchDailyPapers(category);

        expect(papers).toBeDefined();
        expect(Array.isArray(papers)).toBe(true);

        console.log(`Found ${papers.length} papers.`);

        if (papers.length > 0) {
            console.log("First paper title:", papers[0].title);
            // Verify the structure of the first paper
            expect(papers[0]).toHaveProperty('id');
            expect(papers[0]).toHaveProperty('title');
            expect(papers[0]).toHaveProperty('abstract');
            expect(papers[0]).toHaveProperty('authors');
            expect(papers[0]).toHaveProperty('published');
            expect(papers[0]).toHaveProperty('link');
        }
    });
});
