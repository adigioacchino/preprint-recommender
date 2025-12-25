import { describe, it, expect } from 'vitest';
import { fetchDailyPapers } from '../src/services/arxiv.js';

describe('Arxiv Fetcher', () => {
    it.each([
        ['cs.AI'], // Artificial Intelligence
        ['cs.LG'], // Machine Learning
        ['cs.CV'], // Computer Vision
    ])('fetch papers from Arxiv [%s]', async (category) => {
        console.log(`Testing category: ${category}`);
        const papers = await fetchDailyPapers(category);

        expect(papers).toBeDefined();
        expect(Array.isArray(papers)).toBe(true);

        console.log(`Found ${papers.length} papers in ${category}.`);

        if (papers.length > 0) {
            console.log(`First paper title in ${category}:`, papers[0].title);
            // Verify the structure of each paper
            for (const paper of papers) {
                expect(paper).toHaveProperty('id');
                expect(paper).toHaveProperty('title');
                expect(paper).toHaveProperty('abstract');
                expect(paper).toHaveProperty('authors');
                expect(paper).toHaveProperty('published');
                expect(paper).toHaveProperty('link');
                expect(paper).toHaveProperty('embedding');
                expect(paper.embedding).toBeNull();
                expect(Array.isArray(paper.authors)).toBe(true);
                expect(paper.published instanceof Date).toBe(true);
            }
        }

        // Sleep for 3 seconds to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
    });
});
