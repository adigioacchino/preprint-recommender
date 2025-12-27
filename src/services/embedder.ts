import { GoogleGenAI } from "@google/genai";
import type { PreprintPaper, SeedPaper } from "../types.js";

const RATE_LIMIT_WAIT_MS = 60_000; // 1 minute cooldown for rate limits

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("quota") ||
      message.includes("rate-limit") ||
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED")
    );
  }
  return false;
}

export async function embedPaper(
  paper: PreprintPaper | SeedPaper,
  verbose: boolean = false
): Promise<void> {
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

  // Retry loop for rate limit handling
  const maxRetries = 5;
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
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
      const embedding = response.embeddings[0].values;
      if (verbose) {
        console.log(
          `Generated embedding of length ${embedding.length} for paper: ${paper.title}`
        );
      }

      // Add the embedding to the paper object
      paper.embedding = embedding;
      return;
    } catch (error) {
      if (isRateLimitError(error)) {
        console.log(
          `Rate limit hit, waiting ${RATE_LIMIT_WAIT_MS / 1000} seconds before retrying...`
        );
        await sleep(RATE_LIMIT_WAIT_MS);
        // Continue to retry
      } else {
        throw error;
      }
    }
    if (attempt === maxRetries) {
      throw new Error(
        `Failed to generate embedding after ${maxRetries} attempts.`
      );
    }
  }
}
