import { describe, it, expect } from 'vitest';

import { embedPaper } from '../src/services/embedder.js';
import type { PreprintPaper } from '../src/types.js';

describe('Embedder Service', () => {
    it('embed mock paper', async () => {
        const mockPaper: PreprintPaper = {
            title: 'A Novel Approach to Machine Learning',
            abstract: 'This paper presents a novel approach to machine learning that significantly improves performance on benchmark datasets.',
            authors: ['Alice Smith', 'Bob Johnson'],
            published: new Date(),
            link: 'http://arxiv.org/abs/1234.5678v1',
        };
        const embedding = await embedPaper(mockPaper, true);
        expect(embedding).toBeDefined();
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBe(3072);
    });
});
