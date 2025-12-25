import { GoogleGenAI } from "@google/genai";
import type { PreprintPaper } from "../types.js";

export async function embedPaper(paper: PreprintPaper, verbose: boolean): Promise<number[]> {
    // Check that the API key is set
    const apiKey = process.env.GENAI_API_KEY;
    if (!apiKey) {
        throw new Error("GENAI_API_KEY environment variable is not set.");
    }

    // Initialize the Google GenAI client
    const genai = new GoogleGenAI({ apiKey });

    // Create the text to embed (title + abstract)
    const textToEmbed = `${paper.title}\n\n${paper.abstract}`;
    if (verbose) {
        console.log(`Generating embedding for paper: ${paper.title}`);
    }

    // Generate the embedding
    const response = await genai.models.embedContent({
        model: "gemini-embedding-001",
        contents: [textToEmbed],
        config: {
            outputDimensionality: 3072,
            taskType: "CLUSTERING",
        },
    });

    // Extract and return the embedding vector
    const embedding = response.embeddings[0].values
    if (verbose) {
        console.log(`Generated embedding of length ${embedding.length} for paper: ${paper.title}`);
    }

    return embedding;
}
